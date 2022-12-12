import { invariant } from "../utils/invariant.ts";
import { type Vector2 } from "../utils/vector2.ts";
import * as vector from "../utils/vector2.ts";

function parseInput(input: string) {
  const map = input
    .split("\n")
    .filter(Boolean)
    .map(function (row: string) {
      return Array.from(row);
    });

  const start = find(map, (value) => value === "S");
  const end = find(map, (value) => value === "E");

  invariant(start, "No start");
  invariant(end, "No end");

  map[start[1]][start[0]] = "a";
  map[end[1]][end[0]] = "z";

  return {
    map,
    start,
    end,
  };
}

function printMap<T>(map: T[][], delimiter = "") {
  for (const row of map) {
    console.log(
      row
        .map((item) => {
          if (typeof item === "number") {
            return item.toFixed(2);
          }
          return item;
        })
        .join(delimiter)
    );
  }
}

function find<T>(
  map: T[][],
  predicate: (value: T) => boolean
): Vector2 | undefined {
  for (let y = 0; y < map.length; y += 1) {
    for (let x = 0; x < map[y].length; x += 1) {
      if (predicate(map[y][x])) {
        return [x, y];
      }
    }
  }
}

function width<T>(map: T[][]) {
  return map[0].length;
}

function height<T>(map: T[][]) {
  return map.length;
}

function at<T>(map: T[][], position: Vector2) {
  return map[position[1]][position[0]];
}

function inbound<T>(map: T[][], v: Vector2) {
  return v[0] >= 0 && v[0] < width(map) && v[1] >= 0 && v[1] < height(map);
}

function passable(a: string, b: string) {
  const distance = b.charCodeAt(0) - a.charCodeAt(0);

  return distance === 1 || distance <= 0;
}

function findPath(
  map: string[][],
  from: Vector2,
  criteria: (value: string, position: Vector2) => boolean,
  passable: (a: string, b: string) => boolean
) {
  const queue: Vector2[][] = [];
  const discovered: Vector2[] = [];

  queue.push([from]);
  discovered.push(from);

  while (queue.length > 0) {
    const path = queue.shift()!;
    const position = path[0];

    if (criteria(at(map, position), position)) {
      return path;
    }

    const neighbors: Vector2[] = [
      vector.add(position, [1, 0]),
      vector.add(position, [-1, 0]),
      vector.add(position, [0, 1]),
      vector.add(position, [0, -1]),
    ]
      .filter((v) => inbound(map, v))
      .filter((va) => !discovered.some((vb) => vector.eq(va, vb)))
      .filter((v) => passable(at(map, position), at(map, v)));

    for (const neighbor of neighbors) {
      discovered.push(neighbor);
      queue.push([neighbor, ...path]);
    }
  }
}

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const { map, start, end } = parseInput(input);

  printMap(map);

  const path = findPath(
    map,
    start,
    (_, position) => vector.eq(position, end),
    passable
  );
  const closestPath = findPath(
    map,
    end,
    (value) => value === "a",
    (a, b) => passable(b, a)
  );

  if (path) {
    console.log(path.length - 1);
  } else {
    console.log("No path");
  }

  if (closestPath) {
    console.log(closestPath.length - 1);
  } else {
    console.log("No path");
  }

  // printMap(map);
}

await main();
