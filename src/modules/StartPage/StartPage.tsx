import Link from "next/link";
import { Card } from "@/components/Card/Card";
import { AREAS } from "@/lib/areas";
import styles from "./StartPage.module.css";

// One box per tool; the whole box is the link.
export function StartPage() {
  return (
    <main className="page__main">
      <h1 className="page__header display display--layout-1">Datamints Co-Worker</h1>
      <ul className={styles["start-page__list"]}>
        {AREAS.map((area) => (
          <li key={area.path}>
            <Link href={area.path} className={styles["start-page__link"]}>
              <Card icon={area.icon} className={styles["start-page__card"]}>
                <div className={styles["start-page__text"]}>
                  <h2 className="display display--layout-3 text-important">{area.name}</h2>
                  <p className="text-small text-muted">{area.description}</p>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
