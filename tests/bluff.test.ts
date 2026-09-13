import assert from "node:assert/strict";
import test from "node:test";
import { isCorrectVerdict, scoreVerdict } from "../lib/bluff.ts";

test("truthful claims should be believed", () => {
  assert.equal(isCorrectVerdict("believe", true), true);
  assert.equal(isCorrectVerdict("bluff", true), false);
});

test("false claims should be challenged", () => {
  assert.equal(isCorrectVerdict("bluff", false), true);
});

test("score rewards correct reads and never becomes negative", () => {
  assert.equal(scoreVerdict(1000, true, 1), 1350);
  assert.equal(scoreVerdict(100, false, 1), 0);
});

