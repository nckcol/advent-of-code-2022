import { invariant } from "../utils/invariant.ts";
import * as Vector from "../utils/vector2.ts";

type Elf = {
  position: Vector.Vector2;
};

function parseInput(input: string): Elf[] {
  const elves: Elf[] = [];

  input
    .split("\n")
    .filter(Boolean)
    .forEach((row, rowIndex) => {
      Array.from(row).forEach((col, colIndex) => {
        if (col !== "#") {
          return;
        }
        elves.push({
          position: [colIndex, rowIndex],
        });
      });
    });
  return elves;
}

enum DIRECTION {
  EAST = 0,
  NORTHEAST = 1,
  NORTH = 2,
  NORTHWEST = 3,
  WEST = 4,
  SOUTHWEST = 5,
  SOUTH = 6,
  SOUTHEAST = 7,
}

const DIRECTION_VECTOR = {
  [DIRECTION.EAST]: [1, 0] as const,
  [DIRECTION.NORTHEAST]: [1, -1] as const,
  [DIRECTION.NORTH]: [0, -1] as const,
  [DIRECTION.NORTHWEST]: [-1, -1] as const,
  [DIRECTION.WEST]: [-1, 0] as const,
  [DIRECTION.SOUTHWEST]: [-1, 1] as const,
  [DIRECTION.SOUTH]: [0, 1] as const,
  [DIRECTION.SOUTHEAST]: [1, 1] as const,
};

function nextDirection(direction: DIRECTION) {
  const directions = [
    DIRECTION.NORTH,
    DIRECTION.SOUTH,
    DIRECTION.WEST,
    DIRECTION.EAST,
  ];
  return directions[(directions.indexOf(direction) + 1) % 4];
}

function range(size: number, startAt = 0) {
  return Array.from({ length: size }, (_, i) => startAt + i);
}

function calculateBoundingRect(elves: Elf[]): [Vector.Vector2, Vector.Vector2] {
  const x = elves.map((elf) => elf.position[0]);
  const y = elves.map((elf) => elf.position[1]);
  return [
    [Math.min(...x), Math.min(...y)] as const,
    [Math.max(...x), Math.max(...y)] as const,
  ];
}

function adjacentDirections(direction: DIRECTION): DIRECTION[] {
  return [
    ((direction + 7) % 8) as DIRECTION,
    direction,
    ((direction + 1) % 8) as DIRECTION,
  ];
}

function move(position: Vector.Vector2, direction: DIRECTION) {
  return Vector.add(position, DIRECTION_VECTOR[direction]);
}

function simulateMovement(elves: Elf[], directions: DIRECTION[]): boolean {
  let moved = false;
  const occupied: Set<string> = new Set();

  for (const elf of elves) {
    occupied.add(Vector.toString(elf.position));
  }

  const proposed: Map<string, number> = new Map();
  const movement: Map<Elf, Vector.Vector2> = new Map();

  for (const elf of elves) {
    const shouldMove = (
      [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
      ] as Vector.Vector2[]
    )
      .map((v) => Vector.add(elf.position, v))
      .some((position) => occupied.has(Vector.toString(position)));

    if (!shouldMove) {
      continue;
    }

    const movingDirection = directions.find((direction) =>
      adjacentDirections(direction)
        .map((direction) => move(elf.position, direction))
        .every((position) => !occupied.has(Vector.toString(position)))
    );

    if (movingDirection !== undefined) {
      const position = move(elf.position, movingDirection);
      proposed.set(
        Vector.toString(position),
        (proposed.get(Vector.toString(position)) ?? 0) + 1
      );
      movement.set(elf, position);
    }
  }

  for (const elf of elves) {
    const position = movement.get(elf);
    if (!position) {
      continue;
    }
    const count = proposed.get(Vector.toString(position)) ?? 0;
    if (count !== 1) {
      continue;
    }
    moved = true;
    elf.position = position;
  }

  return moved;
}

function draw(elves: Elf[]) {
  const [min, max] = calculateBoundingRect(elves);

  const legend = [" "];
  for (let x = min[0]; x <= max[0]; x++) {
    legend.push(x % 5 === 0 ? x.toString() : " ");
  }
  console.log(legend.join(""));

  for (let y = min[1]; y <= max[1]; y++) {
    const row = [y % 5 === 0 ? y.toString() : " "];
    for (let x = min[0]; x <= max[0]; x++) {
      const elf = elves.find((elf) => Vector.eq(elf.position, [x, y]));
      row.push(elf ? "#" : ".");
    }
    console.log(row.join(""));
  }
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const elves = parseInput(input);
  const directions: DIRECTION[] = [
    DIRECTION.NORTH,
    DIRECTION.SOUTH,
    DIRECTION.WEST,
    DIRECTION.EAST,
  ];

  draw(elves);

  let moved: boolean;
  let i = 0;
  do {
    i += 1;
    // console.log("====", i + 1, "====");
    moved = simulateMovement(elves, directions);
    // draw(elves);
    directions.push(directions.shift()!);
  } while (moved);

  const [min, max] = calculateBoundingRect(elves);
  const width = max[0] - min[0] + 1;
  const height = max[1] - min[1] + 1;
  // console.log(width, height, width * height - elves.length);
  console.log(i);
}

await main();
