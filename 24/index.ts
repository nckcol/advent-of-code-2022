import * as Matrix from "../utils/matrix.ts";
import * as Vector from "../utils/vector2.ts";
import { invariant } from "../utils/invariant.ts";

function parseInput(input: string): string[][] {
  return input
    .trim()
    .split("\n")
    .map((row) => Array.from(row));
}

enum BlizzardDirection {
  Up = "^",
  Down = "v",
  Left = "<",
  Right = ">",
}

const BLAZZARD_DIRECTION_VECTOR: Record<BlizzardDirection, Vector.Vector2> = {
  [BlizzardDirection.Up]: [0, -1],
  [BlizzardDirection.Down]: [0, 1],
  [BlizzardDirection.Left]: [-1, 0],
  [BlizzardDirection.Right]: [1, 0],
};

const DIRECTIONS: Vector.Vector2[] = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
  [0, 0],
];

function vectorMod(v: Vector.Vector2, m: Vector.Vector2): Vector.Vector2 {
  let x = v[0] % m[0];
  if (x < 0) {
    x += m[0];
  }
  let y = v[1] % m[1];
  if (y < 0) {
    y += m[1];
  }
  return [x, y];
}

function loop(
  box: [Vector.Vector2, Vector.Vector2],
  v: Vector.Vector2
): Vector.Vector2 {
  return Vector.add(
    vectorMod(
      Vector.diff(v, box[0]),
      Vector.add(Vector.diff(box[1], box[0]), [1, 1])
    ),
    box[0]
  );
}

function moveBlizzard(
  blizzard: { start: Vector.Vector2; direction: BlizzardDirection },
  box: [Vector.Vector2, Vector.Vector2],
  steps: number
): Vector.Vector2 {
  const directionVector = BLAZZARD_DIRECTION_VECTOR[blizzard.direction];

  return loop(
    box,
    Vector.add(blizzard.start, Vector.scale(directionVector, steps))
  );
}

function isAccessible(
  blizzards: { start: Vector.Vector2; direction: BlizzardDirection }[],
  box: [Vector.Vector2, Vector.Vector2],
  step: number,
  position: Vector.Vector2
): boolean {
  invariant(blizzardPeriod);
  step = step % blizzardPeriod;

  if (!blizzardStates.has(step)) {
    const state: number[][] = [];
    blizzards
      .map((blizzard) => moveBlizzard(blizzard, box, step))
      .forEach((position) => {
        Matrix.set(state, position, 1);
      });
    blizzardStates.set(step, state);
  }

  if (
    position[0] < box[0][0] ||
    position[0] > box[1][0] ||
    position[1] < box[0][1] ||
    position[1] > box[1][1]
  ) {
    return false;
  }

  return Matrix.at(blizzardStates.get(step)!, position) !== 1;
}

function draw(
  blizzards: { start: Vector.Vector2; direction: BlizzardDirection }[],
  box: [Vector.Vector2, Vector.Vector2],
  start: Vector.Vector2,
  end: Vector.Vector2,
  position: Vector.Vector2,
  step: number
) {
  const matrix: string[][] = [];
  const size = Vector.add(box[1], [2, 2]);

  for (let x = 0; x < size[0]; x++) {
    Matrix.set(matrix, [x, 0], "#");
    Matrix.set(matrix, [x, size[1] - 1], "#");
  }
  for (let y = 0; y < size[1]; y++) {
    Matrix.set(matrix, [0, y], "#");
    Matrix.set(matrix, [size[0] - 1, y], "#");
  }

  for (const blizzard of blizzards) {
    const blizzardPosition = moveBlizzard(blizzard, box, step);
    Matrix.set(matrix, blizzardPosition, blizzard.direction);
  }

  Matrix.set(matrix, start, "S");
  Matrix.set(matrix, end, "E");
  Matrix.set(matrix, position, "X");

  for (let y = 0; y < size[1]; y++) {
    const row = [];
    for (let x = 0; x < size[0]; x++) {
      row.push(Matrix.at(matrix, [x, y]) ?? ".");
    }
    console.log(row.join(""));
  }
}

function play(
  blizzards: { start: Vector.Vector2; direction: BlizzardDirection }[],
  box: [Vector.Vector2, Vector.Vector2],
  start: Vector.Vector2,
  end: Vector.Vector2,
  initialStep = 0
) {
  const visited: Set<string> = new Set();
  const queue: Array<[number, Vector.Vector2[]]> = [];
  queue.push([initialStep, [start]]);

  while (queue.length > 0) {
    const [step, path] = queue.shift()!;
    const position = path.at(-1)!;
    const key = [Vector.toString(position), step].join(":");
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    for (const direction of DIRECTIONS) {
      const nextPosition = Vector.add(direction, position);

      if (Vector.eq(nextPosition, end)) {
        return [...path, nextPosition];
      }

      if (
        !Vector.eq(nextPosition, start) &&
        !isAccessible(blizzards, box, step + 1, nextPosition)
      ) {
        continue;
      }

      queue.push([step + 1, [...path, nextPosition]]);
    }
  }
}

function gcd(a: number, b: number): number {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

let blizzardPeriod: number;
const blizzardStates: Map<number, number[][]> = new Map();

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const field = parseInput(input);
  const size = Matrix.size(field);

  const entrance: Vector.Vector2 = [1, 0];
  const exit: Vector.Vector2 = Vector.diff(size, [2, 1]);
  const box: [Vector.Vector2, Vector.Vector2] = [
    [1, 1],
    Vector.diff(size, [2, 2]),
  ];
  blizzardPeriod = lcm(
    Vector.diff(size, [2, 2])[0],
    Vector.diff(size, [2, 2])[1]
  );

  const blizzards = [];

  for (let y = 0; y < size[1]; y++) {
    for (let x = 0; x < size[0]; x++) {
      const position: Vector.Vector2 = [x, y];
      if (
        Object.values(BlizzardDirection)
          .map((direction) => direction.toString())
          .includes(Matrix.at(field, position))
      ) {
        blizzards.push({
          start: position,
          direction: Matrix.at(field, position) as BlizzardDirection,
        });
      }
    }
  }

  // console.log(box, entrance, exit, blizzards);
  draw(blizzards, box, entrance, exit, entrance, 0);

  const path1 = play(blizzards, box, entrance, exit);
  invariant(path1, "No path found");

  // for (let i = 0; i < path.length; i++) {
  //   console.log("======", i, "======");
  //   draw(blizzards, box, entrance, exit, path[i], i);
  // }

  const stepsToWindow = path1.length - 1;
  console.log("To the window:", stepsToWindow);

  const path2 = play(blizzards, box, exit, entrance, stepsToWindow);
  invariant(path2, "No path found");

  const stepsToWall = stepsToWindow + path2.length - 1;
  console.log("To the wall:", stepsToWall);

  const path3 = play(blizzards, box, entrance, exit, stepsToWall);
  invariant(path3, "No path found");

  const stepsToWindowAgain = stepsToWall + path3.length - 1;
  console.log("To the window again:", stepsToWindowAgain);
}

await main();
