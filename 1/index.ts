function sum(a: number, b: number) {
  return a + b;
}

function compareDesc(a: number, b: number) {
  return b - a;
}

function parseInput(input: string) {
  return input
    .split("\n\n")
    .map((elf) => elf.split("\n").map((calories) => Number(calories)));
}

const input = await Deno.readTextFile("./input.txt");
const elves = parseInput(input);

console.log(
  elves
    .map((elf) => elf.reduce(sum))
    .sort(compareDesc)
    .slice(0, 3)
    .reduce(sum)
);
