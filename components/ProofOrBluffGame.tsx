"use client";

import { useEffect, useRef, useState } from "react";
import { CLAIMS, isCorrectVerdict, scoreVerdict, type Verdict } from "@/lib/bluff";

type Phase = "home" | "rules" | "decision" | "verifying" | "resolved" | "finished";

const rivals = [
  { name: "MIRA", face: "M", tone: "cyan", hearts: 3 },
  { name: "KNOX", face: "K", tone: "red", hearts: 2 },
  { name: "VEGA", face: "V", tone: "violet", hearts: 3 },
];

function Logo() {
  return <span className="pob-logo"><i>P</i><b>PROOF <em>OR</em> BLUFF</b></span>;
}

export default function ProofOrBluffGame() {
  const [phase, setPhase] = useState<Phase>("home");
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(1000);
  const [hearts, setHearts] = useState(3);
  const [choice, setChoice] = useState<Verdict | null>(null);
  const [proofStep, setProofStep] = useState(0);
  const [correct, setCorrect] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const claim = CLAIMS[round];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function start() {
    setRound(0); setScore(1000); setHearts(3); setChoice(null); setPhase("rules");
  }

  function decide(verdict: Verdict) {
    const won = isCorrectVerdict(verdict, claim.truth);
    setChoice(verdict); setCorrect(won); setPhase("verifying"); setProofStep(0);
    timers.current.push(setTimeout(() => setProofStep(1), 450));
    timers.current.push(setTimeout(() => setProofStep(2), 900));
    timers.current.push(setTimeout(() => setProofStep(3), 1350));
    timers.current.push(setTimeout(() => {
      setScore((value) => scoreVerdict(value, won, round));
      if (!won) setHearts((value) => Math.max(0, value - 1));
      setPhase("resolved");
    }, 1750));
  }

  function nextRound() {
    if (round === CLAIMS.length - 1 || hearts === 0) setPhase("finished");
    else { setRound((value) => value + 1); setChoice(null); setProofStep(0); setPhase("decision"); }
  }

  if (phase === "home") return (
    <main className="pob-home">
      <div className="pob-noise" />
      <nav><Logo /><span className="pob-network"><i /> BUILT FOR CREDITCOIN CC3</span></nav>
      <section className="pob-hero">
        <div className="pob-kicker">A CROSS-CHAIN SOCIAL DEDUCTION GAME</div>
        <h1>EVERY WALLET<br />HAS A <em>STORY.</em></h1>
        <p>Three rivals make claims about their Ethereum history. Read the evidence, call their bluff, and let Attestcoin reveal the truth.</p>
        <button className="pob-primary" onClick={start}>TAKE A SEAT <span>&rarr;</span></button>
        <small>Solo demo &middot; No wallet required &middot; 3 minute match</small>
      </section>
      <div className="pob-table-preview">
        <div className="preview-card preview-card--one"><span>CLAIM</span><b>?</b></div>
        <div className="preview-card preview-card--two"><span>PROOF</span><b>&#9671;</b></div>
        <div className="preview-stamp">CALL<br />BLUFF</div>
      </div>
      <footer><span>CLAIM</span><i /> <span>CHALLENGE</span><i /> <b>ATTESTCOIN REVEAL</b></footer>
    </main>
  );

  if (phase === "rules") return (
    <main className="pob-screen pob-rules">
      <Logo />
      <section>
        <p className="pob-overline">HOW TO PLAY</p><h1>Catch the liar.</h1>
        <div className="rule-flow">
          <div><b>1</b><span><strong>READ THE CLAIM</strong>A rival tells you what they did on Ethereum.</span></div>
          <div><b>2</b><span><strong>CHECK THE CLUES</strong>Inspect the transaction fragment.</span></div>
          <div><b>3</b><span><strong>MAKE THE CALL</strong>Believe them—or call bluff.</span></div>
        </div>
        <div className="rule-demo"><span>&ldquo;I minted the Crown.&rdquo;</span><button>CALL BLUFF</button><b>LIAR!</b></div>
        <p className="rule-note">Attestcoin verifies the real cross-chain receipt. Correct reads win chips. Wrong reads cost a heart.</p>
        <button className="pob-primary" onClick={() => setPhase("decision")}>START ROUND 1 <span>&rarr;</span></button>
      </section>
    </main>
  );

  if (phase === "finished") return (
    <main className="pob-screen pob-finish"><Logo /><section className="finish-card"><p className="pob-overline">MATCH COMPLETE</p><div className="finish-rank">#1</div><h1>Human lie detector.</h1><p>You finished with <b>{score.toLocaleString()} chips</b> and {hearts} heart{hearts === 1 ? "" : "s"}.</p><div className="finish-proof"><i>&#10003;</i><span><b>3 claims adjudicated</b>by Attestcoin proof rules</span></div><button className="pob-primary" onClick={start}>PLAY AGAIN</button></section></main>
  );

  return (
    <main className="pob-game">
      <header><Logo /><div className="pob-stats"><span>ROUND <b>{round + 1}/3</b></span><span>YOUR CHIPS <b>{score.toLocaleString()}</b></span><span>HEARTS <b>{"♥".repeat(hearts)}{"♡".repeat(3 - hearts)}</b></span></div></header>
      <section className="rival-row">
        {rivals.map((rival, index) => <div className={`rival rival--${rival.tone}${index === round ? " rival--speaking" : ""}`} key={rival.name}><div>{rival.face}</div><b>{rival.name}</b><small>{"♥".repeat(rival.hearts)}</small></div>)}
      </section>
      <section className="pob-table">
        <div className="table-ring" />
        <article className={`claim-card${phase === "resolved" ? " claim-card--flipped" : ""}`}>
          <p>{claim.speaker.toUpperCase()} CLAIMS</p>
          <blockquote>&ldquo;{claim.claim}&rdquo;</blockquote>
          <span>{claim.alias} &middot; ETHEREUM SEPOLIA</span>
        </article>
        <article className="case-file">
          <p>CASE FILE <span>{claim.block}</span></p>
          <div><small>VISIBLE METHOD</small><b>{claim.method}</b></div>
          <div><small>RECEIPT FRAGMENT</small><b>{claim.receiptHint}</b></div>
          <em>Does the evidence match the story?</em>
        </article>
      </section>

      {phase === "decision" && <section className="decision-bar"><p>WHAT&apos;S YOUR READ?</p><div><button className="believe" onClick={() => decide("believe")}><span>&#10003;</span><b>BELIEVE</b><small>The claim matches</small></button><button className="bluff" onClick={() => decide("bluff")}><span>!</span><b>CALL BLUFF</b><small>Something is wrong</small></button></div></section>}

      {phase === "verifying" && <section className="proof-reveal"><div className="proof-beam" /><p>ATTESTCOIN REVEAL</p><h2>Ethereum receipt <span>&rarr;</span> Creditcoin verdict</h2><div className="proof-steps"><span className={proofStep >= 1 ? "done" : ""}>Inclusion proof</span><span className={proofStep >= 2 ? "done" : ""}>Continuity proof</span><span className={proofStep >= 3 ? "done" : ""}>Receipt decoded</span></div><small>Demo proof sequence &middot; live verifier path included in the contracts</small></section>}

      {phase === "resolved" && <section className={`verdict verdict--${claim.truth ? "true" : "liar"}`}><div className="verdict-stamp">{claim.truth ? "VERIFIED" : "LIAR"}</div><p>{claim.provenFact}</p><h2>{correct ? `GOOD READ! +${300 + round * 50}` : "WRONG READ! -200"}</h2><p>You chose <b>{choice === "bluff" ? "CALL BLUFF" : "BELIEVE"}</b>.</p><button className="pob-primary" onClick={nextRound}>{round === CLAIMS.length - 1 || hearts === 0 ? "SEE RESULTS" : "NEXT CLAIM"} <span>&rarr;</span></button></section>}
    </main>
  );
}

