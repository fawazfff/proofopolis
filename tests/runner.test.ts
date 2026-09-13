import assert from "node:assert/strict";
import test from "node:test";
import { advanceItems, collides, moveLane, type RunnerItem } from "../lib/runner.ts";

test("runner stays inside three lanes", () => {
  assert.equal(moveLane(-1, -1), -1);
  assert.equal(moveLane(1, 1), 1);
  assert.equal(moveLane(0, -1), -1);
});

test("jumping clears corrupted blocks", () => {
  const block: RunnerItem = { id: 1, lane: 0, depth: 92, kind: "block" };
  assert.equal(collides(block, 0, false), true);
  assert.equal(collides(block, 0, true), false);
});

test("items advance toward the player", () => {
  const item: RunnerItem = { id: 1, lane: 1, depth: 10, kind: "shard" };
  assert.equal(advanceItems([item], 20, 0.5)[0].depth, 20);
});

