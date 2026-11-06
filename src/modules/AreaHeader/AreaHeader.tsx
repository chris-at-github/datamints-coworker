import { Logo } from "@/components/Logo/Logo";
import type { Area } from "@/lib/areas";

export type AreaHeaderProps = {
  area: Area;
};

// Logo with icon and name of the tool above its pages; the name is the <h1>.
export function AreaHeader({ area }: AreaHeaderProps) {
  return (
    <header className="page__header">
      <Logo icon={area.icon}>
        <h1 className="display display--layout-1">{area.name}</h1>
      </Logo>
    </header>
  );
}
