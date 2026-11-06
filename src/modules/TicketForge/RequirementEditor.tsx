"use client";

import { EllipsisIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Menu } from "@/components/Menu";
import { usePendingSaves } from "@/lib/use-pending-saves";
import { prepareRequirement, undoPreparation, updateRequirement } from "./api";
import { RequirementAiPanel } from "./RequirementAiPanel";
import { RequirementOdooPanel } from "./RequirementOdooPanel";
import { formatDateTime, getDisplayTitle, type Requirement, STATUS_LABELS, UNTITLED } from "./requirements";
import styles from "./RequirementForm.module.css";

type TextField = "title" | "description" | "internalDescription";

const FIELD_LABELS: Record<TextField, string> = {
  title: "Title",
  description: "Description",
  internalDescription: "Internal description",
};

const LIST_URL = "/ticket-forge";

// What runs while the AI panel waits; null when nothing runs.
type AiRun = "prepare" | "refine" | "undo" | null;

export type RequirementEditorProps = {
  requirement: Requirement;
  // Starts the preparation right away, after creating with "Prepare with AI".
  autoPrepare?: boolean;
};

// Edit page of a requirement: every field saves itself when it is left.
export function RequirementEditor({ requirement: initialRequirement, autoPrepare = false }: RequirementEditorProps) {
  const router = useRouter();
  const [requirement, setRequirement] = useState(initialRequirement);
  // The values the server has, to skip saving an unchanged field.
  const savedRef = useRef(initialRequirement);
  const [message, setMessage] = useState("");
  const [aiRun, setAiRun] = useState<AiRun>(null);
  const hasAutoPreparedRef = useRef(false);
  const { trackSave, waitForSaves, navigateAfterSaves } = usePendingSaves();

  function handleChange(field: TextField, value: string) {
    setRequirement((current) => ({ ...current, [field]: value }));
  }

  function handleBlur(field: TextField) {
    const value = requirement[field];

    if (value === savedRef.current[field]) {
      return;
    }

    trackSave(save({ [field]: value }, `${FIELD_LABELS[field]} could not be saved.`));
  }

  // Takes the server's answer only for the saved fields and the dates, so text
  // typed in another field meanwhile is kept.
  async function save(changes: Partial<Requirement>, errorMessage: string): Promise<void> {
    setMessage("");

    try {
      const saved = await updateRequirement(requirement.id, changes);
      const savedChanges = Object.fromEntries(Object.keys(changes).map((key) => [key, saved[key as keyof Requirement]]));

      savedRef.current = { ...savedRef.current, ...savedChanges, updatedAt: saved.updatedAt };
      setRequirement((current) => ({ ...current, ...savedChanges, updatedAt: saved.updatedAt }));
    } catch (error) {
      setMessage(errorMessage);
      throw error;
    }
  }

  function handleArchived(archived: boolean) {
    trackSave(save({ archived }, archived ? "The requirement could not be archived." : "The requirement could not be restored."));
  }

  // The AI reads the requirement on the server, so running saves finish first.
  // The fields are read-only meanwhile, so the answer replaces all of them.
  async function runAi(run: Exclude<AiRun, null>, action: () => Promise<Requirement>): Promise<boolean> {
    setAiRun(run);
    setMessage("");

    try {
      await waitForSaves();
      const result = await action();

      savedRef.current = result;
      setRequirement(result);

      return true;
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "The AI request failed.");

      return false;
    } finally {
      setAiRun(null);
    }
  }

  function handlePrepare() {
    return runAi("prepare", () => prepareRequirement(requirement.id));
  }

  function handleRefine(instruction: string) {
    return runAi("refine", () => prepareRequirement(requirement.id, instruction));
  }

  function handleUndo() {
    return runAi("undo", () => undoPreparation(requirement.id));
  }

  // The parameter leaves the URL first, so a reload does not start it again.
  // An effect event always sees the current functions without being a dependency.
  const startAutoPrepare = useEffectEvent(() => {
    router.replace(`${LIST_URL}/${requirement.id}`);
    void handlePrepare();
  });

  // The ref keeps the double effect of React's strict mode from running it twice.
  useEffect(() => {
    if (autoPrepare && !hasAutoPreparedRef.current) {
      hasAutoPreparedRef.current = true;
      startAutoPrepare();
    }
  }, [autoPrepare]);

  // Answers of the Odoo panel replace the whole requirement, like an AI run.
  function handleOdooChange(changed: Requirement, changeMessage = "") {
    savedRef.current = changed;
    setRequirement(changed);
    setMessage(changeMessage);
  }

  const isRunning = aiRun !== null;

  return (
    <div className={styles["requirement-form"]}>
      <header className={styles["requirement-form__header"]}>
        <h2 className="display display--layout-2">{getDisplayTitle(requirement)}</h2>
        <Button.Group>
          <Button.Link href={LIST_URL} onClick={(event) => void navigateAfterSaves(event, LIST_URL)}>
            Back to the list
          </Button.Link>
          <Menu>
            <Menu.Trigger render={<Button.Icon icon={EllipsisIcon} aria-label="More" />} />
            <Menu.Popup align="end">
              {requirement.archived ? (
                <Menu.Item onClick={() => handleArchived(false)}>Restore</Menu.Item>
              ) : (
                <Menu.Item onClick={() => handleArchived(true)}>Archive</Menu.Item>
              )}
            </Menu.Popup>
          </Menu>
        </Button.Group>
      </header>
      <p className={styles["requirement-form__meta"]}>
        {STATUS_LABELS[requirement.status]}
        {requirement.archived && " · Archived"} · Last change {formatDateTime(requirement.updatedAt)}
      </p>
      <p className={styles["requirement-form__message"]} aria-live="polite">
        {message}
      </p>
      <RequirementAiPanel
        requirement={requirement}
        run={aiRun}
        onPrepare={handlePrepare}
        onRefine={handleRefine}
        onUndo={handleUndo}
      />
      <Field>
        <Field.Label>{FIELD_LABELS.title}</Field.Label>
        <Field.Control
          placeholder={UNTITLED}
          autoComplete="off"
          readOnly={isRunning}
          value={requirement.title}
          onChange={(event) => handleChange("title", event.currentTarget.value)}
          onBlur={() => handleBlur("title")}
        />
      </Field>
      <Field>
        <Field.Label>{FIELD_LABELS.description} (Markdown)</Field.Label>
        <Field.Control
          render={<textarea />}
          className={styles["requirement-form__text"]}
          readOnly={isRunning}
          value={requirement.description}
          onChange={(event) => handleChange("description", event.currentTarget.value)}
          onBlur={() => handleBlur("description")}
        />
      </Field>
      <Field>
        <Field.Label>{FIELD_LABELS.internalDescription} (Markdown, not visible to the customer)</Field.Label>
        <Field.Control
          render={<textarea rows={6} />}
          readOnly={isRunning}
          value={requirement.internalDescription}
          onChange={(event) => handleChange("internalDescription", event.currentTarget.value)}
          onBlur={() => handleBlur("internalDescription")}
        />
      </Field>
      <RequirementOdooPanel
        requirement={requirement}
        isBusy={isRunning}
        onChange={handleOdooChange}
        waitForSaves={waitForSaves}
      />
    </div>
  );
}
