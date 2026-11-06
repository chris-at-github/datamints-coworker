"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon/Icon";
import { AREA_GROUPS, isAreaActive } from "@/lib/areas";
import styles from "./Sidebar.module.css";

// Fixed navigation between the tools; the client only needs the path to mark
// the active entry.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar} aria-label="Tools">
      {AREA_GROUPS.map((group, index) => (
        <div key={group.name ?? index} className={styles.sidebar__group}>
          {group.name && <div className={styles["sidebar__group-name"]}>{group.name}</div>}
          <ul className={styles.sidebar__list}>
            {group.areas.map((area) => (
              <li key={area.path}>
                <Link
                  href={area.path}
                  className={styles.sidebar__link}
                  aria-current={isAreaActive(area, pathname) ? "page" : undefined}
                >
                  <Icon icon={area.icon} />
                  {area.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
