import { invariant } from "./invariant.ts";

function parseInput(input: string) {
  const [stateString, instructionsString] = input.split("\n\n");
  const crateLines = stateString.split("\n");
  const stacks = crateLines.pop();

  invariant(crateLines.length > 0);
  invariant(stacks);

  const stackCount = Math.ceil((stacks.length + 1) / 4);
  const crates = Array.from({ length: stackCount }, (): string[] => []);

  for (const line of crateLines) {
    for (let i = 0; i < stackCount; i++) {
      const crate = line.slice(i * 4 + 1, (i + 1) * 4 - 2);
      if (crate !== " ") {
        crates[i].push(crate);
      }
    }
  }

  const instructions = instructionsString
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(" ");
      return {
        count: parseInt(parts[1], 10),
        from: parseInt(parts[3], 10),
        to: parseInt(parts[5], 10),
      };
    });

  return { crates, instructions };
}

const input = await Deno.readTextFile("./input.txt");
const { crates, instructions } = parseInput(input);

for (const { count, from, to } of instructions) {
  for (let i = 0; i < count; i++) {
    const crate = crates[from - 1].shift();
    invariant(crate, `No crate to move from stack ${from}`);
    crates[to - 1].unshift(crate);
  }
}

console.log(crates.map((crate) => crate[0]).join(""));
