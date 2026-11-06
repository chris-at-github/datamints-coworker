"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { updateRequirement } from "./api";
import { formatDateTime, getDisplayTitle, type Requirement } from "./requirements";
import styles from "./RequirementList.module.css";

export type RequirementArchiveProps = {
  // Archived, latest change first.
  requirements: Requirement[];
};

// All archived requirements; a restored one leaves this list, the user stays here.
export function RequirementArchive({ requirements: initialRequirements }: RequirementArchiveProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [message, setMessage] = useState("");

  async function handleRestore(requirement: Requirement) {
    const title = getDisplayTitle(requirement);

    setMessage("");

    try {
      await updateRequirement(requirement.id, { archived: false });
      setRequirements((current) => current.filter((item) => item.id !== requirement.id));
      setMessage(`"${title}" restored.`);
    } catch (error) {
      console.error(error);
      setMessage(`"${title}" could not be restored.`);
    }
  }

  return (
    <section className={styles["requirement-list"]}>
      <header className={styles["requirement-list__header"]}>
        <h2 className="display display--layout-2">Archived requirements</h2>
        <Link href="/ticket-forge">Back to the list</Link>
      </header>
      <p className={styles["requirement-list__message"]} aria-live="polite">
        {message}
      </p>
      {requirements.length === 0 ? (
        <p className={styles["requirement-list__empty"]}>No archived requirements.</p>
      ) : (
        <table className={styles["requirement-list__table"]}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Last change</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((requirement) => (
              <tr key={requirement.id}>
                <td>
                  <Link
                    href={`/ticket-forge/${requirement.id}`}
                    className={requirement.title.trim() ? undefined : styles["requirement-list__untitled"]}
                  >
                    {getDisplayTitle(requirement)}
                  </Link>
                </td>
                <td className={styles["requirement-list__date"]}>{formatDateTime(requirement.updatedAt)}</td>
                <td className={styles["requirement-list__actions"]}>
                  <Button onClick={() => void handleRestore(requirement)}>Restore</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
