import assert from "node:assert/strict";
import test from "node:test";
import { deterministicTile, placementScore, totalScore, type PlacedTile } from "../lib/game.ts";

test("proof-derived tiles are deterministic", () => {
  const hash = `0x${"7a".repeat(32)}`;
  assert.deepEqual(deterministicTile(1, hash), deterministicTile(1, hash));
});

test("placing beside a district earns an adjacency bonus", () => {
  const first = { ...deterministicTile(0), x: 2, y: 2 } satisfies PlacedTile;
  const next = deterministicTile(1);
  assert.equal(placementScore(next, [first], 2, 3), next.baseScore + 18 + 7);
});

test("the board counts each connection only once", () => {
  const board: PlacedTile[] = [
    { ...deterministicTile(0), x: 1, y: 1 },
    { ...deterministicTile(1), x: 2, y: 1 },
    { ...deterministicTile(2), x: 2, y: 2 },
  ];
  const base = board.reduce((sum, tile) => sum + tile.baseScore, 0);
  assert.equal(totalScore(board), base + 36);
});
