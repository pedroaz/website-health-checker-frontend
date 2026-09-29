import type { Metadata } from "next";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Pulse — Website health",
  description: "A local website monitoring showcase",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <a href="/" className="brand">
            <span className="logo">↗</span> pulse
            <span className="tag">LOCAL SHOWCASE</span>
          </a>
          <a
            href={process.env.MAILPIT_UI_URL ?? "http://localhost:8025"}
            target="_blank"
            rel="noreferrer"
          >
            Open email inbox ↗
          </a>
        </header>
        <main>{children}</main>
        <footer>
          Next.js + .NET 10 + PostgreSQL · Emails captured by Mailpit · Checks
          every 5 minutes
        </footer>
      </body>
    </html>
  );
}
