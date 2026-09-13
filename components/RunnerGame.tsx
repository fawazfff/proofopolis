"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { advanceItems, collides, laneFromSeed, moveLane, type Lane, type RunnerItem } from "@/lib/runner";

type Scene = "home" | "tutorial" | "verifying" | "countdown" | "running" | "crashed" | "reward";
const HERO = "https://raw.githubusercontent.com/fawazfff/proofopolis/main/public/proofopolis-hero.webp";
const TARGET_DISTANCE = 650;

function Logo() {
  return <span className="runner-logo"><i>&#9671;</i><b>PROOFOPOLIS</b></span>;
}

function Home({ play }: { play: () => void }) {
  return (
    <main className="runner-home">
      <Image src={HERO} fill priority sizes="100vw" alt="A floating proof-powered city" className="runner-home__art" />
      <div className="runner-home__shade" />
      <nav><Logo /><span className="live-chip"><i /> BUILT FOR CC3 TESTNET</span></nav>
      <section className="runner-home__copy">
        <p className="runner-eyebrow">A SIMPLE THREE-LANE RUNNER</p>
        <h1>DODGE RED.<br /><em>GRAB BLUE.</em></h1>
        <p>You are the glowing diamond. Move across three lanes, avoid every red block, and survive until 650 metres.</p>
        <button className="runner-cta" onClick={play}>&#9654; TEACH ME &amp; PLAY</button>
        <small>No wallet needed &middot; Takes about 20 seconds</small>
      </section>
      <section className="runner-home__steps">
        <div><b className="legend-player">&#9670;</b><span><strong>THIS IS YOU</strong>The glowing diamond</span></div>
        <div><b className="legend-danger">!</b><span><strong>RED IS BAD</strong>Move or jump away</span></div>
        <div><b className="legend-shard">&#9671;</b><span><strong>BLUE IS GOOD</strong>Collect for points</span></div>
      </section>
    </main>
  );
}

export default function RunnerGame() {
  const [scene, setScene] = useState<Scene>("home");
  const [lane, setLane] = useState<Lane>(0);
  const [jumping, setJumping] = useState(false);
  const [items, setItems] = useState<RunnerItem[]>([]);
  const [distance, setDistance] = useState(0);
  const [shards, setShards] = useState(0);
  const [count, setCount] = useState(3);
  const state = useRef({ lane: 0 as Lane, jumping: false, distance: 0, shards: 0, nextId: 1, spawn: 0, tick: 0, ended: false });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const shift = useCallback((direction: -1 | 1) => {
    if (scene !== "running") return;
    state.current.lane = moveLane(state.current.lane, direction);
    setLane(state.current.lane);
  }, [scene]);

  const jump = useCallback(() => {
    if (scene !== "running" || state.current.jumping) return;
    state.current.jumping = true;
    setJumping(true);
    timers.current.push(setTimeout(() => {
      state.current.jumping = false;
      setJumping(false);
    }, 620));
  }, [scene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) shift(-1);
      if (["ArrowRight", "d", "D"].includes(event.key)) shift(1);
      if (["ArrowUp", "w", "W", " "].includes(event.key)) { event.preventDefault(); jump(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump, shift]);

  useEffect(() => {
    if (scene !== "running") return;
    let frame = 0;
    let previous = performance.now();
    let accumulator = 0;
    const fixed = 1 / 30;
    const loop = (now: number) => {
      accumulator += Math.min(.1, (now - previous) / 1000);
      previous = now;
      while (accumulator >= fixed && !state.current.ended) {
        const s = state.current;
        s.tick += 1; s.spawn += fixed; s.distance += 36 * fixed;
        setDistance(Math.floor(s.distance));
        setItems((current) => {
          const next = advanceItems(current, 30 + s.distance / 80, fixed);
          if (s.spawn >= .72) {
            s.spawn = 0;
            next.push({ id: s.nextId++, lane: laneFromSeed(s.tick * 7 + s.nextId), depth: 0, kind: s.tick % 3 === 0 ? "shard" : "block" });
            if (s.tick % 5 === 0) next.push({ id: s.nextId++, lane: laneFromSeed(s.tick + 1), depth: -18, kind: "shard" });
          }
          for (const item of next) {
            if (!collides(item, s.lane, s.jumping)) continue;
            if (item.kind === "block") {
              s.ended = true;
              setScene("crashed");
              return next;
            }
            s.shards += 1;
            setShards(s.shards);
            item.depth = 120;
          }
          return next.filter((item) => item.depth < 112);
        });
        if (s.distance >= TARGET_DISTANCE && !s.ended) {
          s.ended = true;
          setScene("reward");
        }
        accumulator -= fixed;
      }
      if (!state.current.ended) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [scene]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function later(action: () => void, delay: number) {
    timers.current.push(setTimeout(action, delay));
  }

  function beginVerification() {
    setScene("verifying");
    later(() => { setScene("countdown"); setCount(3); }, 1500);
    later(() => setCount(2), 2200);
    later(() => setCount(1), 2900);
    later(() => { resetRun(); setScene("running"); }, 3600);
  }

  function resetRun() {
    state.current = { lane: 0, jumping: false, distance: 0, shards: 0, nextId: 1, spawn: 0, tick: 0, ended: false };
    setLane(0); setJumping(false); setDistance(0); setShards(0); setItems([]);
  }

  if (scene === "home") return <Home play={() => setScene("tutorial")} />;
  if (scene === "tutorial") return (
    <main className="runner-modal-page">
      <Logo />
      <section className="how-card">
        <p className="runner-eyebrow">HOW TO PLAY</p><h1>Stay alive to 650m.</h1>
        <div className="lesson-road">
          <span className="lesson-shard"><b>&#9671;</b><small>COLLECT</small></span>
          <span className="lesson-block"><b>!</b><small>AVOID</small></span>
          <span className="lesson-player"><small>YOU</small><b>&#9670;</b></span>
        </div>
        <div className="control-demo"><button>&larr;</button><span>MOVE YOUR DIAMOND</span><button>&rarr;</button></div>
        <div className="how-grid">
          <div><span>1</span><b>MOVE</b><small>Left/right arrows or A/D</small></div>
          <div><span>2</span><b>JUMP</b><small>Up arrow, W, or Space</small></div>
          <div><span>3</span><b>WIN</b><small>Reach 650m without crashing</small></div>
        </div>
        <p className="warning-line"><b>ONE RULE:</b> never touch a red block. Move sideways or jump over it.</p>
        <button className="runner-cta" onClick={beginVerification}>I UNDERSTAND - START RUN</button>
        <button className="back-link" onClick={() => setScene("home")}>&larr; Back</button>
      </section>
    </main>
  );
  if (scene === "verifying") return (
    <main className="runner-modal-page"><Logo /><section className="verify-card"><div className="proof-core"><i /><i /><b>&#9671;</b></div><p>ATTESTCOIN IS VERIFYING</p><h2>Ethereum action &rarr; Creditcoin game pass</h2><div className="verify-row"><span>Transaction included</span><b>&#10003;</b></div><div className="verify-row"><span>Continuity proof valid</span><b>&#10003;</b></div><small>Demo proof. The repository also includes the live proof importer.</small></section></main>
  );
  if (scene === "countdown") return <main className="runner-game"><div className="countdown"><b>{count}</b><span>GET READY</span></div></main>;
  if (scene === "crashed") return (
    <main className="runner-game"><section className="result-card result-card--bad"><span>!</span><p>BLOCK CORRUPTED</p><h1>Run ended at {distance}m</h1><small>You collected {shards} proof shard{shards === 1 ? "" : "s"}.</small><button className="runner-cta" onClick={() => { resetRun(); setScene("countdown"); setCount(1); later(() => setScene("running"), 700); }}>RUN AGAIN</button><button className="back-link" onClick={() => setScene("home")}>Main menu</button></section></main>
  );
  if (scene === "reward") return (
    <main className="reward-page"><Logo /><section className="result-card result-card--win"><span className="reward-building">&#9814;</span><p>RUN VERIFIED</p><h1>Nexus Tower unlocked!</h1><small>{TARGET_DISTANCE}m cleared &middot; {shards} shards collected &middot; demo proof consumed once</small><div className="reward-score"><b>{TARGET_DISTANCE + shards * 50}</b><span>CITY INFLUENCE</span></div><button className="runner-cta" onClick={() => setScene("home")}>PLACE BUILDING &amp; PLAY AGAIN</button></section></main>
  );

  return (
    <main className="runner-game">
      <header className="runner-hud"><Logo /><div><span>DISTANCE <b>{distance}m</b></span><span>PROOF SHARDS <b>&#9671; {shards}</b></span><span>GOAL <b>{TARGET_DISTANCE}m</b></span></div></header>
      <div className="runner-progress"><i style={{ width: `${Math.min(100, distance / TARGET_DISTANCE * 100)}%` }} /></div>
      <div className="runner-world">
        <div className="city-gate"><span>PROOFOPOLIS</span><b>&#9671;</b></div>
        <div className="runner-road"><i /><i />
          {items.map((item) => <span key={item.id} className={`runner-item runner-item--${item.kind}`} style={{ "--lane": item.lane, "--depth": item.depth } as React.CSSProperties}>{item.kind === "shard" ? "\u25C7" : "!"}</span>)}
          <span className={`runner-player${jumping ? " runner-player--jump" : ""}`} style={{ "--player-lane": lane } as React.CSSProperties}><small>YOU</small><i>&#9670;</i><b /></span>
        </div>
      </div>
      {distance < 70 && <div className="runner-coach"><b>YOU ARE THE GLOWING DIAMOND</b><span>RED = DANGER</span><span>BLUE = COLLECT</span></div>}
      <div className="runner-help"><span>&larr; &rarr; MOVE</span><span>&uarr; / SPACE JUMP</span><span>&#9671; COLLECT</span></div>
      <div className="touch-controls"><button aria-label="Move left" onPointerDown={() => shift(-1)}>&larr;</button><button aria-label="Jump" onPointerDown={jump}>&uarr;</button><button aria-label="Move right" onPointerDown={() => shift(1)}>&rarr;</button></div>
    </main>
  );
}

