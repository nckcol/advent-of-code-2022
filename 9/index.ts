import { invariant } from "../utils/invariant.ts";
import * as matrix from "../utils/matrix.ts";
import * as number from "../utils/number.ts";
import * as vector from "../utils/vector2.ts";

enum Way {
  Right = "R",
  Down = "D",
  Left = "L",
  Up = "U",
}

function isEnumValue<T extends string, TEnumValue extends string>(
  enumType: { [key in T]: TEnumValue },
  value: string
): value is TEnumValue {
  return Object.values(enumType).includes(value);
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [wayString, stepsString] = line.split(" ");
      const steps = parseInt(stepsString, 10);

      invariant(isEnumValue(Way, wayString), "Invalid way");
      invariant(!isNaN(steps), "Invalid steps");

      return [wayString, steps] as const;
    });
}

function printField(
  visitedPositions: vector.Vector2[],
  knots: vector.Vector2[] = []
) {
  let minPosition: vector.Vector2 = [0, 0];
  let maxPosition: vector.Vector2 = [0, 0];

  for (const position of visitedPositions) {
    minPosition = [
      Math.min(minPosition[0], position[0]),
      Math.min(minPosition[1], position[1]),
    ];
    maxPosition = [
      Math.max(maxPosition[0], position[0]),
      Math.max(maxPosition[1], position[1]),
    ];
  }

  for (const position of knots) {
    minPosition = [
      Math.min(minPosition[0], position[0]),
      Math.min(minPosition[1], position[1]),
    ];
    maxPosition = [
      Math.max(maxPosition[0], position[0]),
      Math.max(maxPosition[1], position[1]),
    ];
  }

  const dimensions = vector.add(vector.diff(maxPosition, minPosition), [1, 1]);
  const field: string[][] = matrix.create(
    dimensions[0],
    dimensions[1],
    () => "."
  );

  for (const position of visitedPositions) {
    const [x, y] = vector.diff(position, minPosition);
    field[y][x] = "#";
  }

  for (let i = knots.length - 1; i >= 0; i -= 1) {
    const [x, y] = vector.diff(knots[i], minPosition);
    field[y][x] = i === 0 ? "H" : i.toString();
  }

  console.log(
    field
      .map((row) => row.join(""))
      .reverse()
      .join("\n")
  );
}

const WAY_ANGLE: Record<Way, number> = {
  [Way.Right]: 0,
  [Way.Down]: 1,
  [Way.Left]: 2,
  [Way.Up]: 3,
};

const MOVEMENT_VECTOR: vector.Vector2 = [1, 0];
const KNOTS_NUMBER = 10;

const input = await Deno.readTextFile("./input.txt");
const instructions = parseInput(input);

const knots: vector.Vector2[] = Array.from(new Array(KNOTS_NUMBER), () => [
  0, 0,
]);

const visitedPositions: vector.Vector2[] = [];

for (const [way, steps] of instructions) {
  const alignMovement = vector.rotateQ(-WAY_ANGLE[way]);

  for (let s = 0; s < steps; s++) {
    // move head
    knots[0] = vector.add(knots[0], alignMovement(MOVEMENT_VECTOR));

    for (let i = 0; i < knots.length - 1; i += 1) {
      const distance = vector.diff(knots[i], knots[i + 1]);

      // we need to know if head knot went too far from tail knot
      if (Math.abs(distance[0]) > 1 || Math.abs(distance[1]) > 1) {
        knots[i + 1] = vector.add(knots[i + 1], [
          vector.sig(distance[0]),
          vector.sig(distance[1]),
        ]);
      }
    }

    // track tail
    visitedPositions.push(knots[knots.length - 1]);
  }
}

printField(visitedPositions, knots);

// calculate visited positions
const map: Map<number, Map<number, number>> = new Map();
for (const position of visitedPositions) {
  if (!map.has(position[1])) {
    map.set(position[1], new Map());
  }

  map.get(position[1])!.set(position[0], 1);
}

console.log(
  Array.from(map.values())
    .map((row) => row.size)
    .reduce(number.sum, 0)
);
