import { callOdoo } from "@/lib/odoo-client";
import { parseTime } from "@/lib/time";
import { findEntryForTransfer, saveTransfer } from "@/lib/timesheet-repository";
import {
  getBookingTextField,
  getTransferBlocker,
  getTransferValues,
  type TransferResult,
} from "@/modules/Timesheet/entries";

const TIMESHEET_MODEL = "account.analytic.line";

// Creates the timesheet line in Odoo or updates the one of an earlier transfer.
async function transferEntry(id: string): Promise<TransferResult> {
  const result = await findEntryForTransfer(id);

  if (!result) {
    return { id, outcome: "skipped", message: "Entry not found", entry: null };
  }

  const { entry, date, ticket } = result;
  const blocker = getTransferBlocker(entry);

  if (blocker || !ticket) {
    return { id, outcome: "skipped", message: blocker ?? "No ticket", entry };
  }

  try {
    if (!ticket.allowsTimesheets || ticket.projectOdooId === null) {
      throw new Error(`Ticket ${ticket.number} does not allow timesheets in Odoo`);
    }

    const isHelpdesk = ticket.type === "helpdesk";
    // The other reference is cleared, so a changed ticket type moves the line.
    const values = {
      date,
      name: entry[getBookingTextField(entry)].trim(),
      unit_amount: (parseTime(entry.duration) ?? 0) / 60,
      project_id: ticket.projectOdooId,
      task_id: isHelpdesk ? false : ticket.odooId,
      helpdesk_ticket_id: isHelpdesk ? ticket.odooId : false,
      // Custom field of the Odoo instance; false clears it.
      internal_comment: entry.bookingTextInternal.trim() || false,
    };

    let odooTimesheetId = entry.odooTimesheetId;

    if (odooTimesheetId === null) {
      [odooTimesheetId] = await callOdoo<number[]>(TIMESHEET_MODEL, "create", { vals_list: [values] });
    } else {
      await callOdoo<boolean>(TIMESHEET_MODEL, "write", { ids: [odooTimesheetId], vals: values });
    }

    const saved = await saveTransfer(id, {
      odooTimesheetId,
      transferredValues: getTransferValues(entry, date),
      transferError: "",
    });

    return { id, outcome: "transferred", message: "", entry: saved };
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Transfer failed";

    return { id, outcome: "failed", message, entry: await saveTransfer(id, { transferError: message }) };
  }
}

// One after another, so the lines are created in the order of the ids.
export async function transferEntries(ids: string[]): Promise<TransferResult[]> {
  const results: TransferResult[] = [];

  for (const id of ids) {
    results.push(await transferEntry(id));
  }

  return results;
}
