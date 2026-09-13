export type Lane = -1 | 0 | 1;
export type RunnerItem = {
  id: number;
  lane: Lane;
  depth: number;
  kind: "block" | "shard";
};

export function moveLane(lane: Lane, direction: -1 | 1): Lane {
  return Math.max(-1, Math.min(1, lane + direction)) as Lane;
}

export function advanceItems(items: RunnerItem[], speed: number, dt: number) {
  return items
    .map((item) => ({ ...item, depth: item.depth + speed * dt }))
    .filter((item) => item.depth < 112);
}

export function collides(item: RunnerItem, lane: Lane, jumping: boolean) {
  if (item.lane !== lane || item.depth < 86 || item.depth > 101) return false;
  return item.kind === "shard" || !jumping;
}

export function laneFromSeed(seed: number): Lane {
  return ([-1, 0, 1] as Lane[])[Math.abs(seed) % 3];
}

