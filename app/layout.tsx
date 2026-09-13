import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./runner.css";
import "./tutorial.css";
import "./bluff.css";

export const metadata: Metadata = {
  title: "Proof or Bluff - Every wallet has a story",
  description: "A cross-chain social deduction game where Attestcoin reveals who is lying about their Ethereum history.",
  metadataBase: new URL("https://proofopolis-game.vercel.app"),
  openGraph: {
    title: "Proof or Bluff",
    description: "Believe the claim or call their bluff. Attestcoin reveals the truth.",
    images: ["/proofopolis-hero.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#07111f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

