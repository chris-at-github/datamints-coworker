import type { Metadata } from "next";
import { HousesIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card/Card";
import { Ruler } from "@/components/Ruler/Ruler";
import styles from "../prototype.module.css";

export const metadata: Metadata = {
  title: "Components",
};

export default function ComponentsPage() {
  return (
    <>
      <h1 className="display display--layout-1">Components</h1>

      <Ruler />

      <section className={styles.prototype__section}>
        <h1 className="display display--layout-2">Typography</h1>

        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>

        <h3 className="display display--layout-3">Labore qui commodo</h3>
        <p className="text-large text-important">
          Esse ut maecenas laborum nostrud adipiscing ultricies et proident suscipit excepteur laboris. Velit incididunt adipiscing lorem pariatur incididunt.
        </p>
        <p className="text-small text-muted">
          Irure maecenas nostrud tellus tellus eiusmod ea lorem officia cupidatat laboris ipsum sit proident. Labore qui commodo dolor magna velit labore pariatur fugiat. Qui sunt diam reprehenderit pariatur officia ad quis esse. Maecenas minim dolor veniam et maecenas nostrud reprehenderit adipiscing aliqua nulla do.
        </p>
      </section>

      <Ruler />

      <section className={styles.prototype__section}>
        <h2 className="display display--layout-2">Card</h2>

        <Card icon={HousesIcon} />
      </section>

      <Ruler />

      <section className={styles.prototype__section}>
        <h2 className="display display--layout-2">Button</h2>

        <Button.Group>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button.Icon icon={Plus} aria-label="Add" />
          <Button.Icon icon={Trash2} aria-label="Delete" disabled />
        </Button.Group>
      </section>
    </>
  );
}
