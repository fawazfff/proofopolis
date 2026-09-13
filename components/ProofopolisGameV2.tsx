"use client";

import Image from "next/image";
import { useMemo, useReducer, useRef, useState } from "react";
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
type ActionKind = 0 | 1 | 2;

const DEMO_HASHES = [
  `0x${"39d8ac".repeat(10)}39d8`,
  `0x${"8bf217".repeat(10)}8bf2`,
  `0x${"c42e91".repeat(10)}c42e`,
];

const ACTIONS: Array<{ value: ActionKind; label: string }> = [
  { value: 0, label: "Trade → Market" },
  { value: 1, label: "Collectible → Gallery" },
  { value: 2, label: "Vote → Council Hall" },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>;
}

function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="landing">
      <Image className="landing__art" src="/proofopolis-hero.webp" alt="A floating Proofopolis city" fill priority sizes="100vw" />
      <div className="landing__veil" />
      <nav className="landing__nav">
        <span className="brand"><BrandMark /><span>PROOFOPOLIS</span></span>
        <div className="network-pill"><i /> CC3 TESTNET</div>
      </nav>
      <section className="landing__copy" id="top">
        <p className="kicker"><span>◆</span> Powered by Attestcoin Protocol</p>
        <h1>Your wallet.<br /><em>Your city.</em></h1>
        <p className="landing__lede">Prove Ethereum activity with Attestcoin. Unlock one-use building tiles on Creditcoin. Place them well and build the highest-scoring city.</p>
        <div className="landing__actions">
          <button className="button button--primary button--large" onClick={onEnter}>Enter your city <span>→</span></button>
          <a className="button button--glass" href="#how-it-works">How it works</a>
        </div>
        <div className="landing__proofline">
          <div><b>01</b><span>Prove a transaction</span></div><i />
          <div><b>02</b><span>Unlock a building</span></div><i />
          <div><b>03</b><span>Place for combos</span></div>
        </div>
      </section>
      <section className="landing__how" id="how-it-works"><span>ETHEREUM</span><i>→</i><b>ATTESTCOIN PROOF</b><i>→</i><span>CREDITCOIN CITY</span></section>
    </main>
  );
}

function Cell({ x, y, tile, canPlace, onPlace }: { x: number; y: number; tile?: PlacedTile; canPlace: boolean; onPlace: () => void }) {
  return (
    <button className={`city-cell${tile ? " city-cell--occupied" : ""}${canPlace ? " city-cell--ready" : ""}`} style={{ "--x": x, "--y": y } as React.CSSProperties} onClick={onPlace} disabled={!tile && !canPlace}>
      <span className="city-cell__ground" />
      {tile ? <Building kind={tile.kind} /> : <span className="city-cell__plus">+</span>}
    </button>
  );
}

export default function ProofopolisGameV2() {
  const [entered, setEntered] = useState(false);
  const [wallet, setWallet] = useState("");
  const [stage, setStage] = useState<ProofStage>("idle");
  const [proofSequence, bumpSequence] = useReducer((n) => n + 1, 0);
  const [hand, setHand] = useState<Tile[]>([]);
  const [board, setBoard] = useState<PlacedTile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [liveAction, setLiveAction] = useState<ActionKind>(0);
  const [liveError, setLiveError] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [proofLog, setProofLog] = useState([
    { label: "Verifier online", value: "0x…0FD2", tone: "cyan" },
    { label: "Source chain", value: "Sepolia · key 1", tone: "violet" },
  ]);

  const selected = hand.find((tile) => tile.id === selectedId);
  const score = totalScore(board);
  const occupied = useMemo(() => new Set(board.map((tile) => `${tile.x}:${tile.y}`)), [board]);

  function flash(text: string) {
    setNotice(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 3400);
  }

  async function connectWallet() {
    const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!ethereum) return flash("Install MetaMask or another EVM wallet for live proof mode.");
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
      setWallet(accounts[0] || "");
      flash("Wallet connected. Live proofs require this same address to own the Sepolia transaction.");
    } catch {
      flash("Wallet connection was cancelled.");
    }
  }

  function runDemoProof() {
    if (["requesting", "attested", "verifying"].includes(stage)) return;
    setStage("requesting");
    const sequence = proofSequence;
    const hash = DEMO_HASHES[sequence % DEMO_HASHES.length];
    setTimeout(() => setStage("attested"), 650);
    setTimeout(() => setStage("verifying"), 1300);
    setTimeout(() => {
      const tile = deterministicTile(sequence, hash);
      setHand((current) => [...current, tile]);
      setSelectedId(tile.id);
      setStage("minted");
      setProofLog((current) => [{ label: `Demo: ${TILE_META[tile.kind].eyebrow}`, value: shortenHash(tile.proofId), tone: "gold" }, ...current].slice(0, 4));
      bumpSequence();
      flash(`${TILE_META[tile.kind].name} unlocked in demo mode.`);
    }, 2050);
  }

  function testForgery() {
    if (["requesting", "attested", "verifying"].includes(stage)) return;
    setStage("verifying");
    setTimeout(() => {
      setStage("rejected");
      setProofLog((current) => [{ label: "Forged proof rejected", value: "State unchanged", tone: "danger" }, ...current].slice(0, 4));
      flash("Tampered proof rejected. No building was created.");
    }, 900);
  }

  function placeSelected(x: number, y: number) {
    if (!selected || occupied.has(`${x}:${y}`)) return;
    const earned = placementScore(selected, board, x, y);
    setBoard((current) => [...current, { ...selected, x, y }]);
    setHand((current) => current.filter((tile) => tile.id !== selected.id));
    setSelectedId("");
    setStage("idle");
    flash(`District expanded · +${earned} influence`);
  }

  async function importLiveProof(event: React.FormEvent) {
    event.preventDefault();
    setLiveError("");
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) return setLiveError("Enter a valid 32-byte Sepolia transaction hash.");
    if (!wallet) return setLiveError("Connect the wallet that sent this Sepolia transaction first.");
    if (!PROOFOPOLIS_ADDRESS) return setLiveError("Live mode is locked until the Proofopolis contract address is configured.");

    try {
      setStage("requesting");
      const response = await fetch("/api/proof", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash, chainKey: 1 }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Attestcoin proof is not available yet.");
      setStage("attested");

      const ethereum = (window as unknown as { ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      const provider = new BrowserProvider(ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 102031) throw new Error("Switch your wallet to Creditcoin CC3 testnet (chain ID 102031), then try again.");

      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      if (signerAddress.toLowerCase() !== wallet.toLowerCase()) throw new Error("Connected wallet changed. Reconnect and try again.");

      setStage("verifying");
      const proof = payload.proof;
      const contract = new Contract(PROOFOPOLIS_ADDRESS, PROOFOPOLIS_ABI, signer);
      const transaction = await contract.proveBuilding(
        liveAction,
        proof.chainKey,
        proof.headerNumber,
        proof.txBytes,
        proof.merkleProof.root,
        proof.merkleProof.siblings,
        proof.continuityProof.lowerEndpointDigest,
        proof.continuityProof.roots,
      );
      const receipt = await transaction.wait();
      if (!receipt || receipt.status !== 1) throw new Error("Creditcoin verification transaction failed.");

      const tile = deterministicTile(liveAction, txHash);
      setHand((current) => [...current, tile]);
      setSelectedId(tile.id);
      setStage("minted");
      setProofLog((current) => [{ label: "LIVE PROOF ACCEPTED", value: shortenHash(txHash), tone: "gold" }, ...current].slice(0, 4));
      bumpSequence();
      setShowImport(false);
      flash("Attestcoin proof accepted on Creditcoin. Building unlocked.");
    } catch (error) {
      setStage("rejected");
      setLiveError(error instanceof Error ? error.message : "Live proof verification failed.");
    }
  }

  if (!entered) return <Landing onEnter={() => setEntered(true)} />;

  return (
    <main className="game-shell">
      <header className="game-nav">
        <button className="brand brand--button" onClick={() => setEntered(false)}><BrandMark /><span>PROOFOPOLIS</span></button>
        <div className="game-nav__center"><span className="season"><i /> GENESIS SEASON</span><span className="network-pill"><i /> CC3 TESTNET</span></div>
        <button className="wallet-button" onClick={connectWallet}><span className="wallet-button__gem">◇</span>{wallet ? shortenHash(wallet) : "Connect wallet"}</button>
      </header>

      <section className="game-layout">
        <aside className="side-panel profile-panel">
          <p className="panel-label">CITY PASSPORT</p>
          <div className="passport-orb"><span>◇</span></div>
          <h2>{wallet ? `${shortenHash(wallet, 8, 5)}'s City` : "Founder's Reach"}</h2>
          <p className="passport-rank">Genesis settlement · Rank #{1247 - board.length * 83}</p>
          <div className="city-stats"><div><b>{board.length}</b><span>Buildings</span></div><div><b>{score}</b><span>Influence</span></div></div>
          <div className="divider" />
          <p className="panel-label">PROOF FEED</p>
          <div className="proof-feed">{proofLog.map((log, index) => <div className="proof-feed__item" key={`${log.label}-${index}`}><i className={`dot dot--${log.tone}`} /><span><b>{log.label}</b><small>{log.value}</small></span></div>)}</div>
          <button className="text-button" onClick={testForgery}>Test forged proof <span>↗</span></button>
        </aside>

        <section className="city-stage">
          <div className="city-stage__header"><div><p className="panel-label">YOUR PROVEN WORLD</p><h1>Founder&apos;s Reach</h1></div><div className="score-chip"><span>◆</span><b>{score.toLocaleString()}</b><small>CITY SCORE</small></div></div>
          <div className="sky-glow sky-glow--one" /><div className="sky-glow sky-glow--two" />
          <div className="city-board-wrap"><div className="island-shadow" /><div className="city-board">{Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
            const x = index % BOARD_SIZE; const y = Math.floor(index / BOARD_SIZE); const tile = board.find((candidate) => candidate.x === x && candidate.y === y);
            return <Cell key={`${x}-${y}`} x={x} y={y} tile={tile} canPlace={Boolean(selected)} onPlace={() => placeSelected(x, y)} />;
          })}</div></div>
          <div className="city-stage__tip"><span>✦</span>{selected ? "Choose a glowing plot to place your building" : "Verify a proof to unlock your next building"}</div>
          {stage !== "idle" && stage !== "minted" && <div className={`verification-orbit${stage === "rejected" ? " verification-orbit--rejected" : ""}`}><div className="verification-orbit__rings"><span /><span /><b>{stage === "rejected" ? "×" : "◆"}</b></div><p>{stage === "rejected" ? "PROOF REJECTED" : stage.toUpperCase()}</p><small>{stage === "rejected" ? "Invalid data cannot change the city" : "Ethereum → Attestcoin → Creditcoin"}</small></div>}
        </section>

        <aside className="side-panel forge-panel">
          <p className="panel-label">PROOF FORGE</p><h2>Turn history<br />into landmarks.</h2>
          <p className="forge-panel__lede">A live tile is created only after Creditcoin accepts the Attestcoin proof.</p>
          <div className="route-map"><div><span className="chain-icon chain-icon--eth">◇</span><b>Ethereum</b><small>Source transaction</small></div><i><span /></i><div className="route-map__active"><span className="chain-icon chain-icon--proof">◆</span><b>Attestcoin</b><small>Inclusion + continuity</small></div><i><span /></i><div><span className="chain-icon chain-icon--ctc">C</span><b>Creditcoin</b><small>Playable state</small></div></div>
          <button className="button button--primary forge-button" onClick={runDemoProof} disabled={["requesting", "attested", "verifying"].includes(stage)}><span>✦</span> Run demo proof</button>
          <button className="button button--outline forge-button" onClick={() => setShowImport((open) => !open)}>Import live Sepolia transaction</button>
          {showImport && <form className="import-form" onSubmit={importLiveProof}>
            <label htmlFor="action">Source action</label>
            <select id="action" value={liveAction} onChange={(event) => setLiveAction(Number(event.target.value) as ActionKind)}>{ACTIONS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select>
            <label htmlFor="txHash">Transaction hash</label>
            <input id="txHash" value={txHash} onChange={(event) => setTxHash(event.target.value)} placeholder="0x…" spellCheck={false} />
            {liveError && <p>{liveError}</p>}
            <button className="button button--primary" type="submit">Verify on Creditcoin</button>
          </form>}
          <div className="hand-header"><p className="panel-label">BUILDING HAND</p><span>{hand.length} READY</span></div>
          <div className="tile-hand">{hand.length === 0 ? <div className="empty-hand"><span>◇</span><p>Your next verified landmark will appear here.</p></div> : hand.map((tile) => <button key={tile.id} className={`tile-card${selectedId === tile.id ? " tile-card--selected" : ""}`} onClick={() => setSelectedId(tile.id)}><Building kind={tile.kind} compact /><span><small>{tile.rarity}</small><b>{TILE_META[tile.kind].name}</b><em>+{tile.baseScore}</em></span></button>)}</div>
          <div className="security-note"><span>✓</span><p><b>Fail closed</b><small>No valid Attestcoin proof means no live building.</small></p></div>
        </aside>
      </section>
      {notice && <div className="toast toast--info"><i />{notice}</div>}
    </main>
  );
}
