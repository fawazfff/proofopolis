import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./proofopolis-v2.css";

export const metadata: Metadata = {
  title: "Proofopolis | Your wallet is your deck",
  description: "Prove Ethereum activity with Attestcoin and turn it into strategic city-building tiles on Creditcoin.",
  metadataBase: new URL("https://proofopolis-game.vercel.app"),
  openGraph: {
    title: "Proofopolis | Your wallet is your deck",
    description: "Every building has a history. Every history has a proof.",
    images: ["/proofopolis-hero.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#07111f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
