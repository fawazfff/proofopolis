export type Verdict = "believe" | "bluff";

export type Claim = {
  id: number;
  speaker: string;
  alias: string;
  color: string;
  claim: string;
  method: string;
  receiptHint: string;
  block: string;
  truth: boolean;
  provenFact: string;
};

export const CLAIMS: Claim[] = [
  { id: 1, speaker: "Mira", alias: "0x71...A9F", color: "cyan", claim: "I recorded a 2.5 ETH trade on Ethereum.", method: "SeedActions.trade(2500000)", receiptHint: "Event topic: TradeRecorded", block: "#8,924,113", truth: true, provenFact: "TradeRecorded was emitted by Mira in a successful transaction." },
  { id: 2, speaker: "Knox", alias: "0xD4...81C", color: "red", claim: "I discovered the legendary Neon Crown collectible.", method: "SeedActions.vote(42)", receiptHint: "Event topic: VoteCast", block: "#8,924,206", truth: false, provenFact: "The receipt contains VoteCast—not CollectibleDiscovered." },
  { id: 3, speaker: "Vega", alias: "0x09...EF2", color: "violet", claim: "My vault transaction succeeded.", method: "Vault.unlock(7)", receiptHint: "Receipt status: 0x0", block: "#8,924,391", truth: false, provenFact: "The source-chain receipt status is failed." },
];

export function isCorrectVerdict(verdict: Verdict, truth: boolean) {
  return (verdict === "believe" && truth) || (verdict === "bluff" && !truth);
}

export function scoreVerdict(score: number, correct: boolean, round: number) {
  return Math.max(0, score + (correct ? 300 + round * 50 : -200));
}

