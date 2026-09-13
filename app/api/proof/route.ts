import { NextRequest, NextResponse } from "next/server";
import { proofProvider } from "@gluwa/usc-sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const SUPPORTED_CHAIN_KEYS = new Set([1, 3]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { txHash?: string; chainKey?: number };
    const txHash = body.txHash?.trim();
    const chainKey = Number(body.chainKey ?? 1);

    if (!txHash || !HASH_PATTERN.test(txHash)) {
      return NextResponse.json({ error: "Enter a valid 32-byte transaction hash." }, { status: 400 });
    }
    if (!SUPPORTED_CHAIN_KEYS.has(chainKey)) {
      return NextResponse.json({ error: "Only Sepolia (1) and Ethereum (3) are supported." }, { status: 400 });
    }

    const proofBuilderUrl =
      process.env.CREDITCOIN_PROOF_BUILDER_URL ||
      "https://prover.cc3-testnet.creditcoin.network/";
    const builder = new proofProvider.service.ProofBuilder(chainKey, proofBuilderUrl);
    const result = await builder.getProof(txHash);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          error: result.error || "This transaction is not attested yet.",
          hint: "Attestation commonly trails the source chain. Try an older transaction.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ proof: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proof generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
