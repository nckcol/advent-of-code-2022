import { invariant } from "./invariant.ts";

type Strategy = readonly ["A" | "B" | "C", "X" | "Y" | "Z"];

const WIN_SCORE = 6;
const DRAW_SCORE = 3;
const LOOSE_SCORE = 0;

// A for Rock, B for Paper, and C for Scissors
// X for Rock, Y for Paper, and Z for Scissors
// X for Loose, Y for Draw, and Z for Win
const STRATEGY_TO_SCORE = {
  X: LOOSE_SCORE,
  Y: DRAW_SCORE,
  Z: WIN_SCORE,
};

const SHAPE_TO_SCORE = {
  A: {
    X: 3,
    Y: 1,
    Z: 2,
  },
  B: {
    X: 1,
    Y: 2,
    Z: 3,
  },
  C: {
    X: 2,
    Y: 3,
    Z: 1,
  },
};

function calculateWinScore(strategy: Strategy) {
  return STRATEGY_TO_SCORE[strategy[1]];
}

function calculateShapeScore(strategy: Strategy) {
  return SHAPE_TO_SCORE[strategy[0]][strategy[1]];
}

function sum(a: number, b: number) {
  return a + b;
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((round) => {
      const [player1, player2] = round.split(" ");
      invariant(player1 === "A" || player1 === "B" || player1 === "C");
      invariant(player2 === "X" || player2 === "Y" || player2 === "Z");
      return [player1, player2] as const;
    });
}

const input = await Deno.readTextFile("./input.txt");
const rounds = parseInput(input);
const score = rounds
  .map(
    (strategy) => calculateWinScore(strategy) + calculateShapeScore(strategy)
  )
  .reduce(sum);
console.log(score);
