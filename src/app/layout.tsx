import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "SeatScout — Find the best ticket deals",
  description:
    "Compare live event ticket prices across brokers and find the best deals on sports, concerts, comedy and theater. Powered by the Ticketmaster Discovery API.",
};

// Set the theme before paint to avoid a flash of the wrong color scheme.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('seatscout:theme');
    var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-center text-xs text-slate-500">
            <nav className="flex items-center gap-4 font-medium">
              <Link href="/" className="hover:text-brand-600">
                Search
              </Link>
              <Link href="/watchlist" className="hover:text-brand-600">
                Watchlist
              </Link>
              <Link href="/about" className="hover:text-brand-600">
                About
              </Link>
            </nav>
            <p className="max-w-2xl">
              SeatScout aggregates live data from the Ticketmaster Discovery API.
              Prices and availability are provided by the brokers and may change
              at checkout.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
