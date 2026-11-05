import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/application.css";

// No weight given, so next/font serves Inter as a variable font.
const inter = Inter({
  variable: "--font-family-default",
  subsets: ["latin"],
});

// Pages set only their own part of the title, e.g. "Timesheet | Datamints Co-Worker".
export const metadata: Metadata = {
  title: { default: "Datamints Co-Worker", template: "%s | Datamints Co-Worker" },
  description: "Everyday tools for working at datamints, starting with the timesheet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <div className="page">{children}</div>
      </body>
    </html>
  );
}
