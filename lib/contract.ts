export const PROOFOPOLIS_ADDRESS = process.env.NEXT_PUBLIC_PROOFOPOLIS_CONTRACT || "";

export const PROOFOPOLIS_ABI = [
  "function proveBuilding(uint8 action,uint64 chainKey,uint64 blockHeight,bytes encodedTransaction,bytes32 merkleRoot,(bytes32 hash,bool isLeft)[] siblings,bytes32 lowerEndpointDigest,bytes32[] continuityRoots) returns (bytes32 proofId,uint256 tileId)",
  "function placeTile(uint256 tileId,uint8 x,uint8 y)",
  "function scoreOf(address player) view returns (uint256)",
  "event BuildingProved(address indexed player,uint256 indexed tileId,bytes32 indexed proofId,uint8 kind,uint16 baseScore)",
  "event BuildingPlaced(address indexed player,uint256 indexed tileId,uint8 x,uint8 y,uint256 score)",
] as const;
