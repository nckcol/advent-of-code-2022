import * as setOperations from "https://deno.land/x/set_operations@v1.0.3/set_operations.ts";

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((rucksackString) => [
      new Set(
        Array.from(rucksackString.substring(0, rucksackString.length / 2))
      ),
      new Set(Array.from(rucksackString.substring(rucksackString.length / 2))),
    ]);
}

function calculateItemPriority(item: string) {
  if (item.charAt(0) >= "a" && item.charAt(0) <= "z") {
    return item.charCodeAt(0) - "a".charCodeAt(0) + 1;
  }

  if (item.charAt(0) >= "A" && item.charAt(0) <= "Z") {
    return item.charCodeAt(0) - "A".charCodeAt(0) + 27;
  }

  throw new Error("Invalid item");
}

function sum(a: number, b: number) {
  return a + b;
}

const input = await Deno.readTextFile("./input.txt");
const rucksackList = parseInput(input);

const result = rucksackList
  .map((compartments) => {
    const intersection = setOperations.intersection(
      compartments[0],
      compartments[1]
    );
    if (intersection.size !== 1) {
      throw new Error(
        "There must be exactly one item in common both compartments"
      );
    }
    return intersection.values().next().value;
  })
  .map(calculateItemPriority)
  .reduce(sum);

console.log(result);
