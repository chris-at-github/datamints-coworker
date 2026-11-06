"use client";

import { ExternalLinkIcon, FolderIcon, HeadsetIcon } from "lucide-react";
import { useState } from "react";
import { AlertDialog } from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon/Icon";
import { Tabs } from "@/components/Tabs";
import { ticketSource } from "@/modules/TicketPicker/api";
import { GroupChoice } from "@/modules/TicketPicker/GroupPanel";
import { TicketSummary } from "@/modules/TicketPicker/TicketSummary";
import type { TicketGroupRow } from "@/modules/TicketPicker/tickets";
import type { Ticket } from "@/modules/Timesheet/entries";
import { TicketField } from "@/modules/Timesheet/TicketField";
import { useGroupUrl, useTicketUrl } from "@/modules/Timesheet/TicketLinks";
import { checkTransfer, setTransferTarget, type TransferField, transferRequirement, unlinkTicket } from "./api";
import { type Decisions, RequirementDecisionDialog } from "./RequirementDecisionDialog";
import { hasUntransferredChanges, type Requirement } from "./requirements";
import styles from "./RequirementOdooPanel.module.css";

const GROUP_LABELS = { helpdesk: "Team", project: "Project" } as const;
const TICKET_LABELS = { helpdesk: "Helpdesk ticket", project: "Task" } as const;
const FIELD_LABELS: Record<TransferField, string> = {
  description: "Description",
  internalDescription: "Internal description",
};

type TargetTab = "new" | "existing";

export type RequirementOdooPanelProps = {
  requirement: Requirement;
  // Disables the actions while the AI works on the fields.
  isBusy: boolean;
  onChange: (requirement: Requirement, message?: string) => void;
  waitForSaves: () => Promise<void>;
};

// Target of the transfer, the transfer itself and its state. The transfer runs
// right away; only content in Odoo that would be overwritten asks first.
export function RequirementOdooPanel({ requirement, isBusy, onChange, waitForSaves }: RequirementOdooPanelProps) {
  const { targetGroup, ticket } = requirement;
  const [tab, setTab] = useState<TargetTab>(ticket && !targetGroup ? "existing" : "new");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [includeOriginal, setIncludeOriginal] = useState(requirement.transferred?.includeOriginal ?? true);
  const [conflicts, setConflicts] = useState<TransferField[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [message, setMessage] = useState("");
  const url = useTicketUrl(ticket);
  const groupUrl = useGroupUrl(targetGroup);
  const isTransferred = requirement.transferred !== null;
  const isDisabled = isBusy || isTransferring;
  const blocker =
    !targetGroup && !ticket
      ? "Choose a team, a project or an existing ticket first."
      : targetGroup && !requirement.title.trim()
        ? "A new ticket needs a title."
        : "";

  async function run(action: () => Promise<Requirement>, errorMessage: string, successMessage = "") {
    setMessage("");

    try {
      onChange(await action(), successMessage);
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : errorMessage);
    }
  }

  function handleGroup(group: TicketGroupRow) {
    setIsGroupDialogOpen(false);
    void run(() => setTransferTarget(requirement.id, { group }), "The team or project could not be set.");
  }

  function handleTicket(selected: Ticket | null) {
    void run(
      () => setTransferTarget(requirement.id, selected && { ticketId: selected.id }),
      "The ticket could not be set.",
    );
  }

  async function transfer(decisions: Decisions) {
    const { requirement: transferred, skipped } = await transferRequirement(requirement.id, includeOriginal, decisions);
    const skippedText = skipped.map((field) => FIELD_LABELS[field]).join(", ");

    onChange(
      transferred,
      skipped.length > 0 ? `Transferred. Changed in Odoo meanwhile and not written: ${skippedText}.` : "Transferred to Odoo.",
    );
  }

  // Wraps a transfer step: busy state, and the error stays visible in the panel.
  async function runTransfer(step: () => Promise<void>) {
    setIsTransferring(true);
    setMessage("");

    try {
      await step();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "The transfer failed.");
    } finally {
      setIsTransferring(false);
    }
  }

  // Odoo is read first; fields changed there need a decision, otherwise the
  // transfer runs without a dialog.
  function handleTransfer() {
    void runTransfer(async () => {
      await waitForSaves();
      const check = await checkTransfer(requirement.id);
      const changed = (Object.keys(check) as TransferField[]).filter((field) => check[field] === "changed");

      if (changed.length > 0) {
        setConflicts(changed);
      } else {
        await transfer({});
      }
    });
  }

  function handleDecisions(decisions: Decisions) {
    setConflicts([]);
    void runTransfer(() => transfer(decisions));
  }

  let state = "";

  if (isTransferring) {
    state = "Transferring…";
  } else if (isTransferred) {
    state = hasUntransferredChanges(requirement) ? "Changed since the last transfer" : "Transferred";
  }

  return (
    <section className={styles["odoo-panel"]} aria-labelledby="odoo-panel-title">
      <h3 id="odoo-panel-title" className={styles["odoo-panel__title"]}>
        Odoo
      </h3>
      {isTransferred && ticket ? (
        // Looks like the ticket field before the transfer, but is fixed until unlinked.
        <div className={styles["odoo-panel__target"]}>
          <div className={styles["odoo-panel__ticket"]}>
            <TicketSummary ticket={ticket} />
          </div>
          {url && (
            <Button.IconLink
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              icon={ExternalLinkIcon}
              aria-label={`Open ${TICKET_LABELS[ticket.type]} #${ticket.number} in Odoo (new tab)`}
            />
          )}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(value) => setTab(value as TargetTab)} className={styles["odoo-panel__tabs"]}>
          <Tabs.List aria-label="Target in Odoo">
            <Tabs.Tab value="new">New ticket</Tabs.Tab>
            <Tabs.Tab value="existing">Existing ticket</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="new" className={styles["odoo-panel__tab-panel"]}>
            <span className={styles["odoo-panel__label"]}>Team or project</span>
            {/* Field and link icon like the ticket field of the other tab. */}
            <div className={styles["odoo-panel__group"]}>
              <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                {/* Looks like the ticket field of the other tab. */}
                <Dialog.Trigger
                  render={<button type="button" />}
                  disabled={isDisabled}
                  className={styles["odoo-panel__group-field"]}
                  aria-label={`Team or project: ${targetGroup ? targetGroup.name : "none"}`}
                >
                  {targetGroup && (
                    <span className={styles["odoo-panel__group-text"]}>
                      {GROUP_LABELS[targetGroup.type]} – {targetGroup.name}
                    </span>
                  )}
                </Dialog.Trigger>
                <Dialog.Popup className={styles["odoo-panel__group-dialog"]}>
                  <Dialog.Title>Team or project of the new ticket</Dialog.Title>
                  {/* Mounted only while open, so every opening starts fresh. */}
                  {isGroupDialogOpen && (
                    <Tabs defaultValue={targetGroup?.type ?? "helpdesk"} className={styles["odoo-panel__group-tabs"]}>
                      <Tabs.List aria-label="Ticket type">
                        <Tabs.Tab value="helpdesk">
                          <Icon icon={HeadsetIcon} />
                          Helpdesk
                        </Tabs.Tab>
                        <Tabs.Tab value="project">
                          <Icon icon={FolderIcon} />
                          Projects
                        </Tabs.Tab>
                      </Tabs.List>
                      <Tabs.Panel value="helpdesk">
                        <GroupChoice type="helpdesk" source={ticketSource} onChoose={handleGroup} />
                      </Tabs.Panel>
                      <Tabs.Panel value="project">
                        <GroupChoice type="project" source={ticketSource} onChoose={handleGroup} />
                      </Tabs.Panel>
                    </Tabs>
                  )}
                </Dialog.Popup>
              </Dialog>
              {groupUrl && targetGroup && (
                <Button.IconLink
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={ExternalLinkIcon}
                  aria-label={`Open ${GROUP_LABELS[targetGroup.type]} ${targetGroup.name} in Odoo (new tab)`}
                />
              )}
            </div>
          </Tabs.Panel>
          <Tabs.Panel value="existing" className={styles["odoo-panel__tab-panel"]}>
            <span className={styles["odoo-panel__label"]}>Ticket</span>
            <TicketField ticket={targetGroup ? null : ticket} onSave={handleTicket} label="Existing ticket" variant="boxed" />
          </Tabs.Panel>
        </Tabs>
      )}
      <div className={styles["odoo-panel__actions"]}>
        <Button disabled={isDisabled || blocker !== ""} onClick={handleTransfer}>
          {isTransferred ? "Transfer again" : "Transfer to Odoo"}
        </Button>
        {isTransferred && (
          <AlertDialog>
            <AlertDialog.Trigger disabled={isDisabled}>Unlink Odoo ticket</AlertDialog.Trigger>
            <AlertDialog.Popup>
              <AlertDialog.Title>Unlink Odoo ticket?</AlertDialog.Title>
              <AlertDialog.Description>
                The requirement can then be transferred to another target. The ticket in Odoo stays as it is and is
                not deleted.
              </AlertDialog.Description>
              <Button.Group>
                <AlertDialog.Close>Cancel</AlertDialog.Close>
                <AlertDialog.Close
                  onClick={() => void run(() => unlinkTicket(requirement.id), "Unlinking failed.", "Odoo ticket unlinked.")}
                >
                  Unlink
                </AlertDialog.Close>
              </Button.Group>
            </AlertDialog.Popup>
          </AlertDialog>
        )}
        {state && <span className={styles["odoo-panel__state"]}>{state}</span>}
      </div>
      <label className={styles["odoo-panel__check"]}>
        <Checkbox checked={includeOriginal} onCheckedChange={setIncludeOriginal} disabled={isDisabled} />
        Include original (&ldquo;Anforderung durch Kunden&rdquo;, visible to the customer)
      </label>
      {blocker && !isTransferred && <p className={styles["odoo-panel__hint"]}>{blocker}</p>}
      <p className={styles["odoo-panel__message"]} aria-live="polite">
        {message || requirement.transferError}
      </p>
      {/* Mounted per conflict, so the decisions start empty every time. */}
      {conflicts.length > 0 && (
        <RequirementDecisionDialog fields={conflicts} onCancel={() => setConflicts([])} onConfirm={handleDecisions} />
      )}
    </section>
  );
}
