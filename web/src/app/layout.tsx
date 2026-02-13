import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Library Tracker Next",
  description: "Single-user local library tracker with analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <header className="siteHeader shellHeader">
            <div>
              <h1>Library Tracker</h1>
              <p>Local single-user tracker, ready for cloud migration</p>
            </div>
            <nav className="shellNav">
              <Link className="shellLink" href="/">Home</Link>
              <Link className="shellLink" href="/add">Add</Link>
              <Link className="shellLink" href="/library">Library</Link>
              <Link className="shellLink" href="/analytics">Analytics</Link>
            </nav>
          </header>
          <main className="shellMain">{children}</main>
        </div>
      </body>
    </html>
  );
}
