export const BOARD_SIZE = 5;

export type TileKind = "market" | "gallery" | "council";

export type Tile = {
  id: string;
  kind: TileKind;
  proofId: string;
  sourceTx: string;
  rarity: "Common" | "Rare" | "Mythic";
  baseScore: number;
};

export type PlacedTile = Tile & { x: number; y: number };

export const TILE_META: Record<
  TileKind,
  { name: string; eyebrow: string; color: string; accent: string; icon: string }
> = {
  market: {
    name: "Nexus Market",
    eyebrow: "Verified trade",
    color: "#f4a261",
    accent: "#ffcf70",
    icon: "◆",
  },
  gallery: {
    name: "Echo Gallery",
    eyebrow: "Verified collectible",
    color: "#a78bfa",
    accent: "#d8b4fe",
    icon: "✦",
  },
  council: {
    name: "Consensus Hall",
    eyebrow: "Verified governance",
    color: "#2dd4bf",
    accent: "#67e8f9",
    icon: "⬡",
  },
};

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

export function tileAt(board: PlacedTile[], x: number, y: number) {
  return board.find((tile) => tile.x === x && tile.y === y);
}

export function placementScore(tile: Tile, board: PlacedTile[], x: number, y: number) {
  const adjacent = NEIGHBORS.map(([dx, dy]) => tileAt(board, x + dx, y + dy)).filter(
    (candidate): candidate is PlacedTile => Boolean(candidate),
  );

  const connectionBonus = adjacent.length * 18;
  const diversityBonus = new Set(adjacent.map((candidate) => candidate.kind)).size * 7;
  const harmonyBonus = adjacent.some((candidate) => candidate.kind === tile.kind) ? 9 : 0;

  return tile.baseScore + connectionBonus + diversityBonus + harmonyBonus;
}

export function totalScore(board: PlacedTile[]) {
  return board.reduce((score, tile) => score + tile.baseScore, 0) + adjacencyEdges(board) * 18;
}

export function adjacencyEdges(board: PlacedTile[]) {
  let edges = 0;
  for (const tile of board) {
    if (tileAt(board, tile.x + 1, tile.y)) edges += 1;
    if (tileAt(board, tile.x, tile.y + 1)) edges += 1;
  }
  return edges;
}

export function deterministicTile(sequence: number, txHash?: string): Tile {
  const kinds: TileKind[] = ["market", "gallery", "council"];
  const kind = kinds[sequence % kinds.length];
  const seed = txHash || `0x${(sequence + 17).toString(16).padStart(64, "a")}`;
  const suffix = seed.slice(-6);
  const rarity = sequence % 3 === 2 ? "Mythic" : sequence % 3 === 1 ? "Rare" : "Common";

  return {
    id: `${kind}-${sequence}-${suffix}`,
    kind,
    proofId: `0x${(sequence + 91).toString(16).padStart(8, "0")}…${suffix}`,
    sourceTx: seed,
    rarity,
    baseScore: kind === "council" ? 64 : kind === "gallery" ? 52 : 46,
  };
}

export function shortenHash(value: string, start = 6, end = 4) {
  if (value.length <= start + end + 1) return value;
  return `${value.slice(0, start)}…${value.slice(-end)}`;
}
