"use client";

import { ArchiveIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { updateRequirement } from "./api";
import { formatDateTime, getDisplayTitle, type Requirement, SOURCE_LABELS, STATUS_LABELS } from "./requirements";
import styles from "./RequirementList.module.css";

export type RequirementListProps = {
  // Not archived, latest change first.
  requirements: Requirement[];
};

// Start of Ticket Forge: the requirements in progress; an archived one leaves
// the list, the user stays here.
export function RequirementList({ requirements: initialRequirements }: RequirementListProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [message, setMessage] = useState("");

  async function handleArchive(requirement: Requirement) {
    const title = getDisplayTitle(requirement);

    setMessage("");

    try {
      await updateRequirement(requirement.id, { archived: true });
      setRequirements((current) => current.filter((item) => item.id !== requirement.id));
      setMessage(`"${title}" archived.`);
    } catch (error) {
      console.error(error);
      setMessage(`"${title}" could not be archived.`);
    }
  }

  return (
    <section className={styles["requirement-list"]}>
      <header className={styles["requirement-list__header"]}>
        <Button.Link href="/ticket-forge/new">New</Button.Link>
        <Link href="/ticket-forge/archive">Archived requirements</Link>
      </header>
      <p className={styles["requirement-list__message"]} aria-live="polite">
        {message}
      </p>
      {requirements.length === 0 ? (
        <p className={styles["requirement-list__empty"]}>
          No requirements yet. Start with &ldquo;New&rdquo; and paste notes from a meeting or the text of an email.
        </p>
      ) : (
        <table className={styles["requirement-list__table"]}>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
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
                  {requirement.source === "claude-code" && (
                    <span className={styles["requirement-list__source"]}>{SOURCE_LABELS[requirement.source]}</span>
                  )}
                </td>
                <td>{STATUS_LABELS[requirement.status]}</td>
                <td className={styles["requirement-list__date"]}>{formatDateTime(requirement.updatedAt)}</td>
                <td className={styles["requirement-list__actions"]}>
                  <Button.Icon
                    icon={ArchiveIcon}
                    variant="neutral"
                    aria-label={`Archive "${getDisplayTitle(requirement)}"`}
                    onClick={() => void handleArchive(requirement)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
