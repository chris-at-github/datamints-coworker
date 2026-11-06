"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { ToggleGroup } from "@/components/ToggleGroup";
import type { FieldDecision, TransferField } from "./api";
import styles from "./RequirementOdooPanel.module.css";

const FIELD_LABELS: Record<TransferField, string> = {
  description: "Description",
  internalDescription: "Internal description",
};

const DECISION_LABELS: Record<FieldDecision, string> = { replace: "Replace", append: "Append", skip: "Skip" };

const DECISION_HINTS: Record<FieldDecision, string> = {
  replace: "The content in Odoo is replaced.",
  append: "The new content is added below the content in Odoo.",
  skip: "The field stays as it is in Odoo.",
};

const DECISIONS = Object.keys(DECISION_LABELS) as FieldDecision[];

export type Decisions = Partial<Record<TransferField, FieldDecision>>;

// Only the asked fields are sent; the server writes the others without asking.
function pickDecisions(fields: TransferField[], decisions: Record<TransferField, FieldDecision>): Decisions {
  return Object.fromEntries(fields.map((field) => [field, decisions[field]]));
}

export type RequirementDecisionDialogProps = {
  // The fields with content in Odoo that was not transferred from here; the
  // dialog is open while there are any.
  fields: TransferField[];
  onCancel: () => void;
  onConfirm: (decisions: Decisions) => void;
};

// Only shown when a transfer would overwrite content in Odoo: one decision per
// field, "Replace" preselected.
export function RequirementDecisionDialog({ fields, onCancel, onConfirm }: RequirementDecisionDialogProps) {
  const [decisions, setDecisions] = useState<Record<TransferField, FieldDecision>>({
    description: "replace",
    internalDescription: "replace",
  });

  return (
    <Dialog open={fields.length > 0} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Popup className={styles["decision-dialog"]}>
        <Dialog.Title>Content in Odoo</Dialog.Title>
        <p className={styles["decision-dialog__hint"]}>
          These fields have content in Odoo that was not transferred from here. What should happen with it?
        </p>
        <div className={styles["decision-dialog__fields"]}>
          {fields.map((field) => (
            <div key={field} className={styles["decision-dialog__field"]}>
              <h3 id={`decision-${field}`} className={styles["decision-dialog__name"]}>
                {FIELD_LABELS[field]}
              </h3>
              {/* Pressing the chosen option again would clear it, so an empty value is ignored. */}
              <ToggleGroup
                aria-labelledby={`decision-${field}`}
                aria-describedby={`decision-${field}-hint`}
                className={styles["decision-dialog__options"]}
                value={[decisions[field]]}
                onValueChange={(value) =>
                  value[0] && setDecisions((current) => ({ ...current, [field]: value[0] as FieldDecision }))
                }
              >
                {DECISIONS.map((decision) => (
                  <ToggleGroup.Item key={decision} value={decision}>
                    {DECISION_LABELS[decision]}
                  </ToggleGroup.Item>
                ))}
              </ToggleGroup>
              <p id={`decision-${field}-hint`} className={styles["decision-dialog__hint"]}>
                {DECISION_HINTS[decisions[field]]}
              </p>
            </div>
          ))}
        </div>
        <div className={styles["decision-dialog__actions"]}>
          <Dialog.Close>Cancel</Dialog.Close>
          <Button onClick={() => onConfirm(pickDecisions(fields, decisions))}>Transfer</Button>
        </div>
      </Dialog.Popup>
    </Dialog>
  );
}
