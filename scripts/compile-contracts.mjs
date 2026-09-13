import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const input = { language: "Solidity", sources: {}, settings: { optimizer: { enabled: true, runs: 200 }, viaIR: true, outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } } } };
for (const name of ["Proofopolis.sol", "SeedActions.sol"]) input.sources[`contracts/src/${name}`] = { content: fs.readFileSync(path.join(root, "contracts/src", name), "utf8") };
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: (name) => {
  const resolved = path.join(root, "node_modules", name);
  return fs.existsSync(resolved) ? { contents: fs.readFileSync(resolved, "utf8") } : { error: `Import not found: ${name}` };
} }));
const errors = (output.errors || []).filter((item) => item.severity === "error");
if (errors.length) { console.error(errors.map((item) => item.formattedMessage).join("\n")); process.exit(1); }
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
for (const [file, contracts] of Object.entries(output.contracts)) for (const [name, artifact] of Object.entries(contracts)) if (file.startsWith("contracts/src/")) fs.writeFileSync(path.join(root, "artifacts", `${name}.json`), JSON.stringify(artifact, null, 2));
console.log("Compiled Proofopolis and SeedActions against @gluwa/asc-contracts 0.2.1");
