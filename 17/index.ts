import * as vector from "../utils/vector2.ts";

/*
####
*/
const ROCK_I_H: vector.Vector2[] = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
];

/*
.#.
###
.#.
*/
const ROCK_PLUS: vector.Vector2[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [1, 2],
];

/*
..#
..#
###
*/
const ROCK_J: vector.Vector2[] = [
  [2, 2],
  [2, 1],
  [0, 0],
  [1, 0],
  [2, 0],
];

/*
#
#
#
#
*/
const ROCK_I: vector.Vector2[] = [
  [0, 0],
  [0, 1],
  [0, 2],
  [0, 3],
];

/*
##
##
*/
const ROCK_O: vector.Vector2[] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

const ROCK_LIST: Array<vector.Vector2[]> = [
  ROCK_I_H,
  ROCK_PLUS,
  ROCK_J,
  ROCK_I,
  ROCK_O,
];

function defined<T>(value: T | null | undefined): value is T {
  return value != null;
}

function parseInput(input: string) {
  function toNumber(char: string): 1 | -1 | undefined {
    switch (char) {
      case "<":
        return -1;
      case ">":
        return 1;
    }
  }

  return Array.from(input).map(toNumber).filter(defined);
}

function at<T>(map: T[][], position: vector.Vector2) {
  return map[position[1]]?.[position[0]];
}

function set<T>(map: T[][], position: vector.Vector2, value: T) {
  map[position[1]] ??= [];
  map[position[1]][position[0]] = value;
}

const POSITION_MIN = [0, 0] as const;
const POSITION_MAX = [6, null] as const;

function isColliding(
  field: number[][],
  rock: vector.Vector2[],
  position: vector.Vector2
): boolean {
  for (const point of rock) {
    const fieldPoint = vector.add(position, point);
    if (
      fieldPoint[0] < POSITION_MIN[0] ||
      fieldPoint[1] < POSITION_MIN[1] ||
      fieldPoint[0] > POSITION_MAX[0]
    ) {
      return true; // OOB
    }
    if (at(field, fieldPoint)) {
      return true;
    }
  }

  return false;
}

function top(field: number[][]): number {
  return field.findLastIndex((row) => row.some((item) => item !== 0));
}

function spawnPosition(field: number[][]): vector.Vector2 {
  return [2, top(field) + 4];
}

function settleRock(
  field: number[][],
  rock: vector.Vector2[],
  position: vector.Vector2
) {
  for (const point of rock) {
    set(field, vector.add(position, point), 1);
  }
}

function findRepetitionPeriod(field: number[][]) {
  const t = top(field);
  const maxPeriod = Math.trunc(field.length / 2);

  for (let period = maxPeriod; period > 10; period -= 1) {
    let repeating = true;
    for (let i = 0; i < period; i++) {
      const row1 = field[t - i];
      const row2 = field[t - (i + period)];
      if (!row1.every((v, i) => row2[i] === v)) {
        repeating = false;
        break;
      }
    }
    if (repeating) {
      return period;
    }
  }

  return 0;
}

const EMPTY_CHAR = ".";
const ROCK_CHAR = "#";
const FALLING_ROCK_CHAR = "@";

function draw(
  bbox: readonly [vector.Vector2, vector.Vector2],
  {
    field,
    rock,
  }: {
    field: number[][];
    rock: vector.Vector2[];
  }
) {
  const rows: string[] = [];
  for (let y = bbox[0][1]; y < bbox[1][1]; y++) {
    const row: string[] = [];
    for (let x = bbox[0][0]; x < bbox[1][0]; x++) {
      if (!field[y] || !field[y][x]) {
        row[x] = EMPTY_CHAR;
      } else {
        row[x] = ROCK_CHAR;
      }

      if (rock.find((position) => position[0] === x && position[1] === y)) {
        row[x] = FALLING_ROCK_CHAR;
      }
    }
    rows.push(row.join(""));
  }

  console.log(rows.reverse().join("\n"));
}

const DOWN = [0, -1] as const;
const ROCKS_COUNT = 1000000000000;
const LOGGING = false;

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const jets = parseInput(input);

  const field: number[][] = [];
  let rockIndex = 0;
  let jetIndex = 0;
  let rock = ROCK_LIST[rockIndex % ROCK_LIST.length];
  let position: vector.Vector2 = spawnPosition(field);

  let repetitionPeriod = 0;
  let repetitionStart = 0;
  let repetitionsCount = 0;
  let heightSkipped = 0;
  let repetitionRockIndex = 0;

  while (rockIndex < ROCKS_COUNT) {
    while (true) {
      const jetShift = [jets[jetIndex % jets.length], 0] as const;
      jetIndex += 1;

      if (!isColliding(field, rock, vector.add(position, jetShift))) {
        position = vector.add(position, jetShift);
      }

      if (!isColliding(field, rock, vector.add(position, DOWN))) {
        position = vector.add(position, DOWN);
      } else {
        settleRock(field, rock, position);
        break;
      }
    }

    if (!repetitionStart) {
      repetitionPeriod = findRepetitionPeriod(field);
      if (repetitionPeriod) {
        console.log("Found repetition with period: ", repetitionPeriod);
        console.log("At rock:", rockIndex);
        repetitionStart = top(field);
        repetitionRockIndex = rockIndex;
      }
    } else if (
      top(field) === repetitionStart + repetitionPeriod &&
      !repetitionsCount
    ) {
      const repetitionSteps = rockIndex - repetitionRockIndex;
      const fullRest = ROCKS_COUNT - rockIndex;
      const repetitionRest = fullRest % repetitionSteps;
      repetitionsCount = Math.ceil(fullRest / repetitionSteps) - 1;
      rockIndex = ROCKS_COUNT - repetitionRest;
      heightSkipped = repetitionsCount * repetitionPeriod;
    }

    rockIndex += 1;
    rock = ROCK_LIST[rockIndex % ROCK_LIST.length];
    position = spawnPosition(field);

    if (LOGGING) {
      draw(
        [
          [0, 0],
          [7, 20],
        ],
        { field, rock: rock.map((v) => vector.add(v, position)) }
      );
      console.log();
    }
  }

  console.log("Units tall:", heightSkipped + top(field) + 1);
}

await main();
