"use client";

import Image from "next/image";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { Building } from "@/components/Building";
import {
  BOARD_SIZE,
  TILE_META,
  deterministicTile,
  placementScore,
  shortenHash,
  totalScore,
  type PlacedTile,
  type Tile,
} from "@/lib/game";
import { PROOFOPOLIS_ABI, PROOFOPOLIS_ADDRESS } from "@/lib/contract";

type ProofStage = "idle" | "requesting" | "attested" | "verifying" | "minted" | "rejected";
type Notice = { id: number; tone: "success" | "danger" | "info"; text: string } | null;

const STAGES: Array<{ stage: ProofStage; label: string; detail: string }> = [
  { stage: "requesting", label: "Reading Ethereum", detail: "Locating transaction and receipt" },
  { stage: "attested", label: "Attestation found", detail: "Continuity root anchored on Creditcoin" },
  { stage: "verifying", label: "Verifying proof", detail: "Native verifier 0xâ€¦0FD2 is checking inclusion" },
  { stage: "minted", label: "Building unlocked", detail: "Proof consumed once; tile ready to place" },
];

const DEMO_HASHES = [
  `0x${"39d8ac".repeat(10)}39d8`,
  `0x${"8bf217".repeat(10)}8bf2`,
  `0x${"c42e91".repeat(10)}c42e`,
];

function useNotice() {
  const [notice, setNotice] = useState<Notice>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (tone: NonNullable<Notice>["tone"], text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice({ id: Date.now(), tone, text });
    timer.current = setTimeout(() => setNotice(null), 3200);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return { notice, show };
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="landing">
      <Image
        className="landing__art"
        src="https://raw.githubusercontent.com/fawazfff/proofopolis/main/public/proofopolis-hero.webp"
        alt="A floating city connected to a glowing cryptographic portal"
        fill
        priority
        sizes="100vw"
      />
      <div className="landing__veil" />
      <nav className="landing__nav">
        <a className="brand" href="#top" aria-label="Proofopolis home">
          <BrandMark />
          <span>PROOFOPOLIS</span>
        </a>
        <div className="network-pill"><i /> CC3 TESTNET</div>
      </nav>
      <section className="landing__copy" id="top">
        <p className="kicker"><span>â—†</span> Powered by Attestcoin Protocol</p>
        <h1>Your history.<br /><em>Your city.</em></h1>
        <p className="landing__lede">
          Turn verified Ethereum activity into a living strategy world on Creditcoin. Every building
          has a history. Every history has a proof.
        </p>
        <div className="landing__actions">
          <button className="button button--primary button--large" onClick={onEnter}>
            Enter your city <span>â†’</span>
          </button>
          <a className="button button--glass" href="#how-it-works">How it works</a>
        </div>
        <div className="landing__proofline">
          <div><b>01</b><span>Prove a transaction</span></div>
          <i />
          <div><b>02</b><span>Unlock a building</span></div>
          <i />
          <div><b>03</b><span>Shape your legacy</span></div>
        </div>
      </section>
      <section className="landing__how" id="how-it-works">
        <span>ETHEREUM</span><i>â†’</i><b>ATTESTCOIN PROOF</b><i>â†’</i><span>CREDITCOIN CITY</span>
      </section>
    </main>
  );
}

function CityCell({
  x,
  y,
  tile,
  canPlace,
  onPlace,
}: {
  x: number;
  y: number;
  tile?: PlacedTile;
  canPlace: boolean;
  onPlace: () => void;
}) {
  return (
    <button
      className={`city-cell${tile ? " city-cell--occupied" : ""}${canPlace ? " city-cell--ready" : ""}`}
      style={{ "--x": x, "--y": y } as React.CSSProperties}
      onClick={onPlace}
      disabled={!tile && !canPlace}
      aria-label={tile ? `${TILE_META[tile.kind].name} at ${x + 1}, ${y + 1}` : `Empty plot ${x + 1}, ${y + 1}`}
    >
      <span className="city-cell__ground" />
      {tile ? <Building kind={tile.kind} /> : <span className="city-cell__plus">+</span>}
    </button>
  );
}

export default function ProofopolisGame() {
  const [entered, setEntered] = useState(false);
  const [wallet, setWallet] = useState("");
  const [stage, setStage] = useState<ProofStage>("idle");
  const [proofSequence, bumpSequence] = useReducer((n) => n + 1, 0);
  const [hand, setHand] = useState<Tile[]>([]);
  const [board, setBoard] = useState<PlacedTile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [liveError, setLiveError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [proofLog, setProofLog] = useState([
    { label: "Verifier online", value: "0xâ€¦0FD2", tone: "cyan" },
    { label: "Source chain", value: "Sepolia Â· key 1", tone: "violet" },
  ]);
  const { notice, show } = useNotice();

  const selected = hand.find((tile) => tile.id === selectedId);
  const score = totalScore(board);
  const occupied = useMemo(() => new Set(board.map((tile) => `${tile.x}:${tile.y}`)), [board]);

  async function connectWallet() {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!ethereum) {
      show("info", "Install an EVM wallet to use live proof mode. Demo mode is ready now.");
      return;
    }
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
      setWallet(accounts[0]);
      show("success", "Wallet connected. The same address must own the source transaction.");
    } catch {
      show("danger", "Wallet connection was cancelled.");
    }
  }

  function runDemoProof() {
    if (stage !== "idle" && stage !== "minted" && stage !== "rejected") return;
    setStage("requesting");
    const sequence = proofSequence;
    const hash = DEMO_HASHES[sequence % DEMO_HASHES.length];
    const timers = [
      setTimeout(() => setStage("attested"), 700),
      setTimeout(() => setStage("verifying"), 1450),
      setTimeout(() => {
        const tile = deterministicTile(sequence, hash);
        setHand((current) => [...current, tile]);
        setSelectedId(tile.id);
        setStage("minted");
        setProofLog((current) => [
          { label: TILE_META[tile.kind].eyebrow, value: shortenHash(tile.proofId), tone: "gold" },
          ...current,
        ].slice(0, 4));
        bumpSequence();
        show("success", `${TILE_META[tile.kind].name} unlocked. Choose a glowing plot.`);
      }, 2250),
    ];
    return () => timers.forEach(clearTimeout);
  }

  function testForgery() {
    if (stage === "requesting" || stage === "attested" || stage === "verifying") return;
    setStage("verifying");
    setTimeout(() => {
      setStage("rejected");
      setProofLog((current) => [
        { label: "Forged proof rejected", value: "State unchanged", tone: "danger" },
        ...current,
      ].slice(0, 4));
      show("danger", "Tampered Merkle path rejected. No building was created.");
    }, 1100);
  }

  function placeSelected(x: number, y: number) {
    if (!selected || occupied.has(`${x}:${y}`)) return;
    const earned = placementScore(selected, board, x, y);
    setBoard((current) => [...current, { ...selected, x, y }]);
    setHand((current) => current.filter((tile) => tile.id !== selected.id));
    setSelectedId("");
    setStage("idle");
    show("success", `District expanded Â· +${earned} influence`);
  }

  async function importLiveProof(event: React.FormEvent) {
    event.preventDefault();
    setLiveError("");
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      setLiveError("Enter a valid Ethereum transaction hash.");
      return;
    }
    setStage("requesting");
    try {
      const response = await fetch("/api/proof", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ txHash, chainKey: 1 }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Proof is not available yet.");
      setStage("attested");

      if (PROOFOPOLIS_ADDRESS && wallet) {
        const ethereum = (window as unknown as { ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(PROOFOPOLIS_ADDRESS, PROOFOPOLIS_ABI, signer);
        const proof = payload.proof;
        setStage("verifying");
        const transaction = await contract.proveBuilding(
          proofSequence % 3,
          proof.chainKey,
          proof.headerNumber,
          proof.txBytes,
          proof.merkleProof.root,
          proof.merkleProof.siblings,
          proof.continuityProof.lowerEndpointDigest,
          proof.continuityProof.roots,
        );
        await transaction.wait();
      }

      const tile = deterministicTile(proofSequence, txHash);
      setHand((current) => [...current, tile]);
      setSelectedId(tile.id);
      bumpSequence();
      setStage("minted");
      setShowImport(false);
      show("success", PROOFOPOLIS_ADDRESS ? "Attestcoin proof accepted on CC3." : "Proof fetched. Contract deployment is the final live step.");
    } catch (error) {
      setStage("rejected");
      setLiveError(error instanceof Error ? error.message : "Proof import failed.");
    }
  }

  if (!entered) return <Landing onEnter={() => setEntered(true)} />;

  const activeStage = STAGES.findIndex((item) => item.stage === stage);

  return (
    <main className="game-shell">
      <header className="game-nav">
        <button className="brand brand--button" onClick={() => setEntered(false)}>
          <BrandMark /><span>PROOFOPOLIS</span>
        </button>
        <div className="game-nav__center">
          <span className="season"><i /> GENESIS SEASON</span>
          <span className="network-pill"><i /> CC3 TESTNET</span>
        </div>
        <button className="wallet-button" onClick={connectWallet}>
          <span className="wallet-button__gem">â—‡</span>
          {wallet ? shortenHash(wallet) : "Connect wallet"}
        </button>
      </header>

      <section className="game-layout">
        <aside className="side-panel profile-panel">
          <p className="panel-label">CITY PASSPORT</p>
          <div className="passport-orb"><span>â—‡</span></div>
          <h2>{wallet ? `${shortenHash(wallet, 8, 5)}'s City` : <>Founder&apos;s Reach</>}</h2>
          <p className="passport-rank">Genesis settlement Â· Rank #{1247 - board.length * 83}</p>
          <div className="level-row"><span>LEVEL {1 + Math.floor(score / 180)}</span><b>{Math.min(score, 180)} / 180 XP</b></div>
          <div className="progress"><span style={{ width: `${Math.min(100, (score / 180) * 100)}%` }} /></div>
          <div className="city-stats">
            <div><b>{board.length}</b><span>Buildings</span></div>
            <div><b>{score}</b><span>Influence</span></div>
          </div>
          <div className="divider" />
          <p className="panel-label">PROOF FEED</p>
          <div className="proof-feed">
            {proofLog.map((log, index) => (
              <div className="proof-feed__item" key={`${log.label}-${index}`}>
                <i className={`dot dot--${log.tone}`} />
                <span><b>{log.label}</b><small>{log.value}</small></span>
              </div>
            ))}
          </div>
          <button className="text-button" onClick={testForgery}>Test a forged proof <span>â†—</span></button>
        </aside>

        <section className="city-stage">
          <div className="city-stage__header">
            <div><p className="panel-label">YOUR PROVEN WORLD</p><h1>Founder&apos;s Reach</h1></div>
            <div className="score-chip"><span>â—†</span><b>{score.toLocaleString()}</b><small>CITY SCORE</small></div>
          </div>
          <div className="sky-glow sky-glow--one" />
          <div className="sky-glow sky-glow--two" />
          <div className="city-board-wrap">
            <div className="island-shadow" />
            <div className="city-board" aria-label="5 by 5 Proofopolis building grid">
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
                const x = index % BOARD_SIZE;
                const y = Math.floor(index / BOARD_SIZE);
                const tile = board.find((candidate) => candidate.x === x && candidate.y === y);
                return <CityCell key={`${x}-${y}`} x={x} y={y} tile={tile} canPlace={Boolean(selected)} onPlace={() => placeSelected(x, y)} />;
              })}
            </div>
          </div>
          <div className="city-stage__tip"><span>âœ¦</span>{selected ? "Choose a glowing plot to place your proven building" : "Import a proof to unlock your next building"}</div>

          {(stage === "requesting" || stage === "attested" || stage === "verifying" || stage === "rejected") && (
            <div className={`verification-orbit${stage === "rejected" ? " verification-orbit--rejected" : ""}`}>
              <div className="verification-orbit__rings"><span /><span /><b>{stage === "rejected" ? "Ã—" : "â—†"}</b></div>
              <p>{stage === "rejected" ? "PROOF REJECTED" : STAGES[Math.max(0, activeStage)]?.label.toUpperCase()}</p>
              <small>{stage === "rejected" ? "Tampered data cannot alter the city" : STAGES[Math.max(0, activeStage)]?.detail}</small>
            </div>
          )}
        </section>

        <aside className="side-panel forge-panel">
          <p className="panel-label">PROOF FORGE</p>
          <h2>Turn history<br />into landmarks.</h2>
          <p className="forge-panel__lede">Attestcoin verifies your Ethereum transaction before Creditcoin unlocks a tile.</p>
          <div className="route-map">
            <div><span className="chain-icon chain-icon--eth">â—‡</span><b>Ethereum</b><small>Source transaction</small></div>
            <i><span /></i>
            <div className="route-map__active"><span className="chain-icon chain-icon--proof">â—†</span><b>Attestcoin</b><small>Inclusion + continuity</small></div>
            <i><span /></i>
            <div><span className="chain-icon chain-icon--ctc">C</span><b>Creditcoin</b><small>Playable city state</small></div>
          </div>
          <button className="button button--primary forge-button" onClick={runDemoProof} disabled={["requesting", "attested", "verifying"].includes(stage)}>
            <span>âœ¦</span> Verify demo proof
          </button>
          <button className="button button--outline forge-button" onClick={() => setShowImport((open) => !open)}>
            Import Sepolia transaction
          </button>

          {showImport && (
            <form className="import-form" onSubmit={importLiveProof}>
              <label htmlFor="txHash">Transaction hash</label>
              <input id="txHash" value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="0xâ€¦" spellCheck={false} />
              {liveError && <p>{liveError}</p>}
              <button className="button button--primary" type="submit">Build proof</button>
            </form>
          )}

          <div className="hand-header"><p className="panel-label">BUILDING HAND</p><span>{hand.length} READY</span></div>
          <div className="tile-hand">
            {hand.length === 0 ? (
              <div className="empty-hand"><span>â—‡</span><p>Your next verified landmark will appear here.</p></div>
            ) : hand.map((tile) => (
              <button key={tile.id} className={`tile-card${selectedId === tile.id ? " tile-card--selected" : ""}`} onClick={() => setSelectedId(tile.id)}>
                <Building kind={tile.kind} compact />
                <span><small>{tile.rarity}</small><b>{TILE_META[tile.kind].name}</b><em>+{tile.baseScore}</em></span>
              </button>
            ))}
          </div>
          <div className="security-note"><span>âœ“</span><p><b>Replay protected</b><small>Each source transaction can unlock exactly one building.</small></p></div>
        </aside>
      </section>

      {notice && <div className={`toast toast--${notice.tone}`} key={notice.id}><i />{notice.text}</div>}
    </main>
  );
}
