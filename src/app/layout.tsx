import type { Metadata } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import "./globals.css";

/*
  Every component in this app sets font-family: 'Orbitron' / 'Space Grotesk'
  directly (TreasureHunt, Login, Admin's CSS modules), inherited from the old
  design these were built against - but nothing ever actually loaded either
  font, so the whole app was silently rendering in the browser's default
  sans-serif the entire time. next/font/google self-hosts them (no render-
  blocking request to fonts.googleapis.com) and registers the exact family
  names the rest of the CSS already expects, so nothing else needs to change.
*/
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum Hunt",
  description: "A campus-wide quantum treasure hunt - scan, solve, and stabilise every fragment.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${orbitron.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
