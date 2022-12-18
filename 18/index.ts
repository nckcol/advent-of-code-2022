import { invariant } from "../utils/invariant.ts";

type Vector3 = readonly [number, number, number];

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [x, y, z] = line.split(",").map((v) => parseInt(v, 10));

      invariant(!isNaN(x));
      invariant(!isNaN(y));
      invariant(!isNaN(z));

      return [x, y, z] as const;
    });
}

function add(va: Vector3, vb: Vector3) {
  return [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]] as const;
}

function at(matrix: number[][][], position: Vector3) {
  return matrix[position[2]]?.[position[1]]?.[position[0]];
}

function set(matrix: number[][][], position: Vector3, value: number) {
  matrix[position[2]] ??= [];
  matrix[position[2]][position[1]] ??= [];
  matrix[position[2]][position[1]][position[0]] = value;
}

function inbound(position: Vector3, min: Vector3, max: Vector3) {
  return (
    position[0] >= min[0] &&
    position[1] >= min[1] &&
    position[2] >= min[2] &&
    position[0] <= max[0] &&
    position[1] <= max[1] &&
    position[2] <= max[2]
  );
}

function findAllAir(
  space: number[][][],
  start: Vector3,
  min: Vector3,
  max: Vector3
): Vector3[] {
  const checked: Set<string> = new Set();

  function isChecked(position: Vector3) {
    return checked.has(position.join(","));
  }

  function markChecked(position: Vector3) {
    checked.add(position.join(","));
  }

  const queue: Vector3[] = [start];
  const result: Vector3[] = [];

  while (queue.length) {
    const position = queue.shift()!;
    if (isChecked(position)) {
      continue;
    }
    markChecked(position);

    if (at(space, position) || !inbound(position, min, max)) {
      continue;
    }

    result.push(position);

    queue.push(
      add(position, [1, 0, 0]),
      add(position, [-1, 0, 0]),
      add(position, [0, 1, 0]),
      add(position, [0, -1, 0]),
      add(position, [0, 0, 1]),
      add(position, [0, 0, -1])
    );
  }

  return result;
}

function countFaces(
  space: number[][][],
  vertices: Vector3[],
  fn: (value: number, position: Vector3) => boolean
) {
  let count = 0;

  for (const v of vertices) {
    const toCheck = [
      add(v, [1, 0, 0]),
      add(v, [-1, 0, 0]),
      add(v, [0, 1, 0]),
      add(v, [0, -1, 0]),
      add(v, [0, 0, 1]),
      add(v, [0, 0, -1]),
    ];

    count += toCheck.filter((position) =>
      fn(at(space, position), position)
    ).length;
  }

  return count;
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const lava = parseInput(input);
  const space: number[][][] = [];
  let min: Vector3 = lava[0];
  let max: Vector3 = lava[0];

  for (const part of lava) {
    set(space, part, 1);
    min = [
      Math.min(min[0], part[0] - 1),
      Math.min(min[1], part[1] - 1),
      Math.min(min[2], part[2] - 1),
    ] as const;
    max = [
      Math.max(max[0], part[0] + 1),
      Math.max(max[1], part[1] + 1),
      Math.max(max[2], part[2] + 1),
    ] as const;
  }

  const lavaFreeFaces = countFaces(space, lava, (value) => !value);
  const air = findAllAir(space, min, min, max); // air outside;
  const outsideFreeFaces = countFaces(space, air, (value) => Boolean(value));

  console.log(lavaFreeFaces, outsideFreeFaces);
}

await main();
