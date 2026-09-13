import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proofopolis — Your history. Your city.",
  description: "Turn verified Ethereum activity into a living strategy world on Creditcoin, powered by Attestcoin Protocol.",
  metadataBase: new URL("https://proofopolis.vercel.app"),
  openGraph: {
    title: "Proofopolis",
    description: "Your wallet is your deck. Build a city from cryptographically verified Ethereum history.",
    images: ["/proofopolis-hero.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#07111f", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
