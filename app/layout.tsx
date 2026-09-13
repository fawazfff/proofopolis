import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./runner.css";
import "./tutorial.css";

export const metadata: Metadata = {
  title: "Proofopolis - Run the chain. Build the city.",
  description: "A fast arcade runner where Attestcoin-verified Ethereum activity unlocks a living city on Creditcoin.",
  metadataBase: new URL("https://proofopolis-game.vercel.app"),
  openGraph: {
    title: "Proofopolis",
    description: "Dodge corruption, collect proof shards, and build a city from verified Ethereum history.",
    images: ["/proofopolis-hero.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#07111f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

