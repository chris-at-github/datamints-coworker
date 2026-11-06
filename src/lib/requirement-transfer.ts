// Server only: transfers a requirement to Odoo as a new helpdesk ticket or
// project task, or into an existing one.
import { createHash } from "node:crypto";
import { callOdoo } from "@/lib/odoo-client";
import { markdownToOdooHtml, originalToOdooHtml } from "@/lib/odoo-html";
import {
  findRequirement,
  findTransferState,
  saveTransfer,
  saveTransferError,
} from "@/lib/requirement-repository";
import { storeTicket } from "@/lib/ticket-picker";
import type { Requirement } from "@/modules/TicketForge/requirements";
import type { TicketType } from "@/modules/Timesheet/entries";

const ORIGINAL_HEADING = "Anforderung durch Kunden";

const MODELS: Record<TicketType, string> = { helpdesk: "helpdesk.ticket", project: "project.task" };
const GROUP_FIELDS: Record<TicketType, string> = { helpdesk: "team_id", project: "project_id" };

// Fields Odoo's form fills when a ticket is created in a team or project.
const DEFAULT_FIELDS: Record<TicketType, string[]> = {
  helpdesk: ["team_id", "project_id", "partner_id", "sale_line_id", "user_id", "company_id", "priority"],
  project: ["project_id", "partner_id", "sale_line_id", "user_ids", "company_id", "priority", "stage_id"],
};

export const TRANSFER_FIELDS = ["description", "internalDescription"] as const;

export type TransferField = (typeof TRANSFER_FIELDS)[number];

const ODOO_FIELDS: Record<TransferField, string> = {
  description: "description",
  internalDescription: "internal_description",
};

// "empty" and "unchanged" are written without asking; "changed" means the field
// was edited in Odoo since the last transfer, or holds content of an existing ticket.
export type FieldState = "empty" | "unchanged" | "changed";

export type FieldDecision = "replace" | "append" | "skip";

export type TransferCheck = Record<TransferField, FieldState>;

export type TransferOptions = {
  includeOriginal: boolean;
  // Needed for every field whose state is "changed".
  decisions: Partial<Record<TransferField, FieldDecision>>;
};

export type TransferOutcome = {
  requirement: Requirement;
  // Fields changed in Odoo without a decision, e.g. between check and transfer.
  skipped: TransferField[];
};

type OdooHtml = string | false;

function hashHtml(html: OdooHtml): string {
  return createHash("sha256").update(html || "").digest("hex");
}

// Odoo stores an emptied field as e.g. "<p><br></p>".
function isEmptyHtml(html: OdooHtml): boolean {
  return !html || html.replace(/<[^>]*>|&nbsp;/g, "").trim() === "";
}

type Target = { type: TicketType; odooId: number; isNew: boolean };

function getTarget(requirement: Requirement): Target {
  if (requirement.ticket) {
    return { type: requirement.ticket.type, odooId: requirement.ticket.odooId, isNew: false };
  }

  if (requirement.targetGroup) {
    return { type: requirement.targetGroup.type, odooId: requirement.targetGroup.odooId, isNew: true };
  }

  throw new Error("Choose a team, a project or a ticket first");
}

async function readOdooFields(type: TicketType, odooId: number): Promise<Record<TransferField, OdooHtml>> {
  const [record] = await callOdoo<Record<string, OdooHtml>[]>(MODELS[type], "read", {
    ids: [odooId],
    fields: Object.values(ODOO_FIELDS),
  });

  if (!record) {
    throw new Error("The Odoo ticket does not exist anymore; unlink it to choose another target");
  }

  return { description: record.description, internalDescription: record.internal_description };
}

async function readStoredHashes(id: string): Promise<Record<TransferField, string>> {
  const state = await findTransferState(id);

  return { description: state?.odooDescriptionHash ?? "", internalDescription: state?.odooInternalHash ?? "" };
}

async function checkFields(requirement: Requirement, target: Target): Promise<{ check: TransferCheck; current: Record<TransferField, OdooHtml> }> {
  if (target.isNew) {
    return { check: { description: "empty", internalDescription: "empty" }, current: { description: false, internalDescription: false } };
  }

  const [current, storedHashes] = await Promise.all([
    readOdooFields(target.type, target.odooId),
    readStoredHashes(requirement.id),
  ]);
  const stateOf = (field: TransferField): FieldState => {
    if (isEmptyHtml(current[field])) {
      return "empty";
    }

    return storedHashes[field] === hashHtml(current[field]) ? "unchanged" : "changed";
  };

  return { check: { description: stateOf("description"), internalDescription: stateOf("internalDescription") }, current };
}

// Tells the dialog which fields need a decision; null if the requirement does not exist.
export async function checkTransfer(id: string): Promise<TransferCheck | null> {
  const requirement = await findRequirement(id);

  if (!requirement) {
    return null;
  }

  return (await checkFields(requirement, getTarget(requirement))).check;
}

// The values Odoo's form sets for a new ticket in the team or project.
async function getNewTicketValues(type: TicketType, groupOdooId: number): Promise<Record<string, unknown>> {
  const groupField = GROUP_FIELDS[type];
  const context = { [`default_${groupField}`]: groupOdooId };
  const defaults = await callOdoo<Record<string, unknown>>(MODELS[type], "default_get", {
    fields: DEFAULT_FIELDS[type],
    context,
  });
  const values = { ...defaults, [groupField]: groupOdooId };
  const { value } = await callOdoo<{ value: Record<string, unknown> }>(MODELS[type], "onchange", {
    values,
    field_names: [groupField],
    fields_spec: Object.fromEntries(DEFAULT_FIELDS[type].map((field) => [field, {}])),
    context,
  });

  return { ...values, ...value };
}

// The stage for new helpdesk tickets; Odoo's default stage sends the customer a
// mail, so a missing stage stops the transfer instead of falling back to it.
async function findHelpdeskStage(teamOdooId: number): Promise<number> {
  const name = process.env.ODOO_HELPDESK_STAGE;

  if (!name) {
    throw new Error("ODOO_HELPDESK_STAGE is not set, see docs/guides/odoo.md");
  }

  const [stage] = await callOdoo<{ id: number; template_id: [number, string] | false }[]>("helpdesk.stage", "search_read", {
    domain: [
      ["team_ids", "in", [teamOdooId]],
      ["name", "=", name],
    ],
    fields: ["template_id"],
    limit: 1,
  });

  if (!stage) {
    throw new Error(`The helpdesk team has no stage "${name}"; the ticket was not created, so the customer gets no mail`);
  }

  if (stage.template_id) {
    throw new Error(`The stage "${name}" sends the mail "${stage.template_id[1]}"; the ticket was not created`);
  }

  return stage.id;
}

async function createTicket(type: TicketType, groupOdooId: number, values: Record<string, unknown>): Promise<number> {
  const defaults = await getNewTicketValues(type, groupOdooId);
  const stage = type === "helpdesk" ? { stage_id: await findHelpdeskStage(groupOdooId) } : {};
  const [odooId] = await callOdoo<number[]>(MODELS[type], "create", {
    vals_list: [{ ...defaults, ...stage, ...values }],
  });

  await completeSaleLine(type, odooId);

  return odooId;
}

// Odoo may compute the sale order line only in the form; if it stayed empty and
// the project has one, it is taken from the project.
async function completeSaleLine(type: TicketType, odooId: number): Promise<void> {
  const [record] = await callOdoo<{ sale_line_id: [number, string] | false; project_id: [number, string] | false }[]>(
    MODELS[type],
    "read",
    { ids: [odooId], fields: ["sale_line_id", "project_id"] },
  );

  if (!record || record.sale_line_id || !record.project_id) {
    return;
  }

  const [project] = await callOdoo<{ sale_line_id: [number, string] | false }[]>("project.project", "read", {
    ids: [record.project_id[0]],
    fields: ["sale_line_id"],
  });

  if (project?.sale_line_id) {
    await callOdoo(MODELS[type], "write", { ids: [odooId], vals: { sale_line_id: project.sale_line_id[0] } });
  }
}

function buildHtml(requirement: Requirement, includeOriginal: boolean): Record<TransferField, string> {
  const original = includeOriginal ? originalToOdooHtml(ORIGINAL_HEADING, requirement.rawText) : "";

  return {
    description: markdownToOdooHtml(requirement.description) + original,
    internalDescription: markdownToOdooHtml(requirement.internalDescription),
  };
}

// Creates the ticket or writes into the linked one, then stores the hashes of
// the fields as Odoo stored them. Failures are stored on the requirement and thrown.
export async function transferRequirement(id: string, options: TransferOptions): Promise<TransferOutcome | null> {
  const requirement = await findRequirement(id);

  if (!requirement) {
    return null;
  }

  try {
    const target = getTarget(requirement);
    const html = buildHtml(requirement, options.includeOriginal);
    // Not written: skipped by decision, or changed in Odoo without a decision.
    const notWritten: TransferField[] = [];
    const skipped: TransferField[] = [];
    let ticketOdooId = target.odooId;

    if (target.isNew) {
      const title = requirement.title.trim();

      if (!title) {
        throw new Error("A new ticket needs a title");
      }

      ticketOdooId = await createTicket(target.type, target.odooId, {
        name: title,
        description: html.description,
        internal_description: html.internalDescription,
      });
    } else {
      // Checked again, so a change in Odoo after the dialog is not overwritten.
      const { check, current } = await checkFields(requirement, target);
      const values: Record<string, string> = {};

      for (const field of TRANSFER_FIELDS) {
        const decision = check[field] === "changed" ? options.decisions[field] : "replace";

        if (!decision || decision === "skip") {
          notWritten.push(field);

          if (!decision) {
            skipped.push(field);
          }
        } else if (decision === "replace") {
          values[ODOO_FIELDS[field]] = html[field];
        } else if (decision === "append") {
          values[ODOO_FIELDS[field]] = `${current[field] || ""}<hr>${html[field]}`;
        }
      }

      if (Object.keys(values).length > 0) {
        await callOdoo(MODELS[target.type], "write", { ids: [target.odooId], vals: values });
      }
    }

    const [stored, ticket, previousHashes] = await Promise.all([
      readOdooFields(target.type, ticketOdooId),
      storeTicket(target.type, ticketOdooId),
      readStoredHashes(id),
    ]);

    if (!ticket) {
      throw new Error("The Odoo ticket could not be read after the transfer");
    }

    // A skipped field keeps its old hash and value: the change in Odoo is still
    // unconfirmed, and the requirement's text is still not transferred.
    const isSkipped = (field: TransferField) => notWritten.includes(field);
    const hashOf = (field: TransferField) => (isSkipped(field) ? previousHashes[field] : hashHtml(stored[field]));
    const valueOf = (field: TransferField) =>
      isSkipped(field) ? (requirement.transferred?.[field] ?? "") : requirement[field];
    const saved = await saveTransfer(id, {
      ticketId: ticket.id,
      odooDescriptionHash: hashOf("description"),
      odooInternalHash: hashOf("internalDescription"),
      transferred: {
        title: requirement.title,
        description: valueOf("description"),
        internalDescription: valueOf("internalDescription"),
        includeOriginal: options.includeOriginal,
      },
    });

    return { requirement: saved, skipped };
  } catch (error) {
    await saveTransferError(id, error instanceof Error ? error.message : "Transfer failed");
    throw error;
  }
}
