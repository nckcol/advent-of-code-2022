type Range = [number, number];

function parseRange(rangeString: string): Range {
  const [start, end] = rangeString.split("-");
  return [parseInt(start), parseInt(end)];
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((pairString) => pairString.split(",").map(parseRange));
}

function intersects(range1: Range, range2: Range) {
  return range1[0] <= range2[1] && range2[0] <= range1[1];
}

const input = await Deno.readTextFile("./input.txt");
const pairList = parseInput(input);

const result = pairList.filter(([range1, range2]) =>
  intersects(range1, range2)
).length;

console.log(result);
