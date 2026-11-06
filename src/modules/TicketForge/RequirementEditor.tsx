"use client";

import { EllipsisIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { Menu } from "@/components/Menu";
import { usePendingSaves } from "@/lib/use-pending-saves";
import { updateRequirement } from "./api";
import { formatDateTime, getDisplayTitle, type Requirement, STATUS_LABELS, UNTITLED } from "./requirements";
import styles from "./RequirementForm.module.css";

type TextField = "title" | "description" | "internalDescription";

const FIELD_LABELS: Record<TextField, string> = {
  title: "Title",
  description: "Description",
  internalDescription: "Internal description",
};

const LIST_URL = "/ticket-forge";

export type RequirementEditorProps = {
  requirement: Requirement;
};

// Edit page of a requirement: every field saves itself when it is left.
export function RequirementEditor({ requirement: initialRequirement }: RequirementEditorProps) {
  const [requirement, setRequirement] = useState(initialRequirement);
  // The values the server has, to skip saving an unchanged field.
  const savedRef = useRef(initialRequirement);
  const [message, setMessage] = useState("");
  const [isOriginalShown, setIsOriginalShown] = useState(false);
  const { trackSave, navigateAfterSaves } = usePendingSaves();

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
      <Field>
        <Field.Label>{FIELD_LABELS.title}</Field.Label>
        <Field.Control
          placeholder={UNTITLED}
          autoComplete="off"
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
          value={requirement.description}
          onChange={(event) => handleChange("description", event.currentTarget.value)}
          onBlur={() => handleBlur("description")}
        />
      </Field>
      <Field>
        <Field.Label>{FIELD_LABELS.internalDescription} (Markdown, not visible to the customer)</Field.Label>
        <Field.Control
          render={<textarea rows={6} />}
          value={requirement.internalDescription}
          onChange={(event) => handleChange("internalDescription", event.currentTarget.value)}
          onBlur={() => handleBlur("internalDescription")}
        />
      </Field>
      <div className={styles["requirement-form__original"]}>
        <Button
          aria-expanded={isOriginalShown}
          aria-controls="requirement-raw-text"
          onClick={() => setIsOriginalShown((shown) => !shown)}
        >
          {isOriginalShown ? "Hide original" : "Show original"}
        </Button>
        {isOriginalShown && (
          <pre id="requirement-raw-text" className={styles["requirement-form__raw-text"]}>
            {requirement.rawText}
          </pre>
        )}
      </div>
    </div>
  );
}
