"use client";

import { SparklesIcon, Undo2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Icon } from "@/components/Icon/Icon";
import type { Requirement } from "./requirements";
import styles from "./RequirementAiPanel.module.css";

const RUN_LABELS = {
  prepare: "Claude is preparing the requirement…",
  refine: "Claude is refining the requirement…",
  undo: "Restoring the version before the AI change…",
} as const;

export type RequirementAiPanelProps = {
  requirement: Requirement;
  run: keyof typeof RUN_LABELS | null;
  // Resolve to true if the run succeeded.
  onPrepare: () => Promise<boolean>;
  onRefine: (instruction: string) => Promise<boolean>;
  onUndo: () => Promise<boolean>;
};

// Prepare, refine with an instruction and undo, with Claude's feedback for the author.
export function RequirementAiPanel({ requirement, run, onPrepare, onRefine, onUndo }: RequirementAiPanelProps) {
  const [instruction, setInstruction] = useState("");
  const isRunning = run !== null;
  const isPrepared = requirement.status !== "draft";

  return (
    <section className={styles["ai-panel"]} aria-labelledby="ai-panel-title">
      <h3 id="ai-panel-title" className={styles["ai-panel__title"]}>
        <Icon icon={SparklesIcon} />
        AI
      </h3>
      <div className={styles["ai-panel__actions"]}>
        <Button disabled={isRunning} onClick={() => void onPrepare()}>
          {isPrepared ? "Prepare again" : "Prepare with AI"}
        </Button>
        {requirement.canUndo && (
          <Button disabled={isRunning} onClick={() => void onUndo()}>
            <Icon icon={Undo2Icon} />
            Undo AI change
          </Button>
        )}
      </div>
      <p className={styles["ai-panel__status"]} role="status">
        {run && RUN_LABELS[run]}
      </p>
      {requirement.aiFeedback && (
        <div className={styles["ai-panel__feedback"]}>
          <h4 className={styles["ai-panel__feedback-title"]}>Feedback from Claude</h4>
          <p className={styles["ai-panel__feedback-text"]}>{requirement.aiFeedback}</p>
        </div>
      )}
      <Field>
        <Field.Label>Instruction for refining</Field.Label>
        <Field.Control
          render={<textarea rows={2} />}
          placeholder="E.g. „Punkt 3 ist out of scope“ or „Die Checkbox im Kontaktformular soll rein“"
          value={instruction}
          onChange={(event) => setInstruction(event.currentTarget.value)}
        />
      </Field>
      <div className={styles["ai-panel__actions"]}>
        <Button disabled={isRunning || instruction.trim() === ""} onClick={() => void onRefine(instruction)}>
          Refine
        </Button>
      </div>
    </section>
  );
}
