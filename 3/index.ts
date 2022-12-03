import * as setOperations from "https://deno.land/x/set_operations@v1.0.3/set_operations.ts";
import { chunk } from "https://deno.land/std@0.115.1/collections/chunk.ts";

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((rucksackString) => new Set(Array.from(rucksackString)));
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

const result = chunk(rucksackList, 3)
  .map((racksackGroup) => {
    const intersection = racksackGroup.reduce(setOperations.intersection);

    if (intersection.size !== 1) {
      throw new Error(
        "There must be exactly one item common in racksack group"
      );
    }

    return intersection.values().next().value;
  })
  .map(calculateItemPriority)
  .reduce(sum);

console.log(result);
