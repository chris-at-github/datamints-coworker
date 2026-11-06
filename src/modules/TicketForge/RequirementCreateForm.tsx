"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { createRequirement } from "./api";
import styles from "./RequirementForm.module.css";

// Raw text and an optional title; saving opens the new requirement.
export function RequirementCreateForm() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setIsSaving(true);
    setMessage("");

    try {
      const requirement = await createRequirement(String(data.get("rawText")), String(data.get("title")));

      router.push(`/ticket-forge/${requirement.id}`);
    } catch (error) {
      console.error(error);
      setMessage("The requirement could not be created.");
      setIsSaving(false);
    }
  }

  return (
    <form className={styles["requirement-form"]} onSubmit={(event) => void handleSubmit(event)}>
      <header className={styles["requirement-form__header"]}>
        <h2 className="display display--layout-2">New requirement</h2>
        <Link href="/ticket-forge">Back to the list</Link>
      </header>
      <Field>
        <Field.Label>Title (optional)</Field.Label>
        <Field.Control name="title" autoComplete="off" />
      </Field>
      <Field>
        <Field.Label>Raw text</Field.Label>
        <Field.Control
          name="rawText"
          required
          placeholder="Notes from a meeting or the text of an email"
          render={<textarea />}
          className={styles["requirement-form__text"]}
        />
      </Field>
      <div className={styles["requirement-form__actions"]}>
        <Button type="submit" disabled={isSaving}>
          Create
        </Button>
        <p className={styles["requirement-form__message"]} aria-live="polite">
          {message}
        </p>
      </div>
    </form>
  );
}
