import type { TileKind } from "@/lib/game";

export function Building({ kind, compact = false }: { kind: TileKind; compact?: boolean }) {
  return (
    <span className={`building building--${kind}${compact ? " building--compact" : ""}`} aria-hidden="true">
      <span className="building__shadow" />
      <span className="building__base" />
      <span className="building__body">
        <span className="building__roof" />
        <span className="building__light building__light--one" />
        <span className="building__light building__light--two" />
        <span className="building__spire" />
      </span>
    </span>
  );
}
