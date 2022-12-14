import { delay } from "https://deno.land/std@0.136.0/async/delay.ts";
import { ansi } from "https://deno.land/x/cliffy@v0.25.5/ansi/ansi.ts";
import { tty } from "https://deno.land/x/cliffy@v0.25.5/ansi/tty.ts";
import { invariant } from "../utils/invariant.ts";
import * as vector from "../utils/vector2.ts";

function parseNumber(number: string): number {
  return parseInt(number, 10);
}

function parseList<T>(list: string, delimiter = ","): string[] {
  return list.split(delimiter);
}

function parseNumberList(list: string, delimiter = ","): number[] {
  return parseList(list, delimiter).map(parseNumber);
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((row) => {
      const polyline: vector.Vector2[] = parseList(row, " -> ").map(
        (pointInput) => {
          const [x, y] = parseNumberList(pointInput);
          invariant(x, "invalid point");
          invariant(y, "invalid point");
          return [x, y] as const;
        }
      );

      return polyline;
    });
}

function at<T>(map: T[][], position: vector.Vector2) {
  return map[position[1]]?.[position[0]];
}

function createPoint(field: string[][], point: vector.Vector2, symbol: string) {
  field[point[1]] ??= [];
  field[point[1]][point[0]] = symbol;
}

function removePoint(field: string[][], point: vector.Vector2) {
  if (!field[point[1]]) {
    return;
  }
  delete field[point[1]][point[0]];
}

function createLine(
  field: string[][],
  pointA: vector.Vector2,
  pointB: vector.Vector2,
  symbol: string
) {
  const diff = vector.diff(pointB, pointA);

  if (diff[0] === 0) {
    const sign = Math.sign(diff[1]);
    for (let y = 0; y <= Math.abs(diff[1]); y += 1) {
      const point = vector.add(pointA, [0, sign * y]);
      field[point[1]] ??= [];
      field[point[1]][point[0]] = symbol;
    }
  } else {
    const sign = Math.sign(diff[0]);
    for (let x = 0; x <= Math.abs(diff[0]); x += 1) {
      const point = vector.add(pointA, [sign * x, 0]);
      field[point[1]] ??= [];
      field[point[1]][point[0]] = symbol;
    }
  }
}

async function drawField(
  field: string[][],
  bbox: readonly [vector.Vector2, vector.Vector2]
) {
  const rows = [];
  for (let y = bbox[0][1]; y < bbox[1][1]; y++) {
    let row = "";
    for (let x = bbox[0][0]; x < bbox[1][0]; x++) {
      if (!field[y] || !field[y][x]) {
        row += ".";
      } else {
        row += field[y][x];
      }
    }
    rows.push(row);
  }

  const encoder = new TextEncoder();
  tty.clearScreen();
  await Deno.stdout.write(encoder.encode(rows.join("\n")));
}

async function updateField(
  field: string[][],
  bbox: readonly [vector.Vector2, vector.Vector2]
) {
  // tty.cursorTo(0, 0);
  // const height = bbox[1][1] - bbox[0][1];
  // await Deno.stdout.write(
  //   ansi.cursorUp(height).cursorLeft.eraseDown(height).toBuffer()
  // );

  await drawField(field, bbox);
}

function isFree(field: string[][], point: vector.Vector2) {
  const symbol = at(field, point);
  return symbol !== "#" && symbol !== "o";
}

const SCENE_BBOX = [
  [490, 0],
  [510, 12],
] as const;
const SAND_SOURCE = [500, 0] as const;

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const polylineList = parseInput(input);

  const field: string[][] = [];
  let min: vector.Vector2 = SAND_SOURCE;
  let max: vector.Vector2 = SAND_SOURCE;
  for (const polyline of polylineList) {
    for (let i = 0; i < polyline.length - 1; i++) {
      createLine(field, polyline[i], polyline[i + 1], "#");
      min = [
        Math.min(min[0], polyline[i][0], polyline[i + 1][0]),
        Math.min(min[1], polyline[i][1], polyline[i + 1][1]),
      ];
      max = [
        Math.max(max[0], polyline[i][0], polyline[i + 1][0]),
        Math.max(max[1], polyline[i][1], polyline[i + 1][1]),
      ];
    }
  }

  const bbox = [vector.add(min, [-2, 0]), vector.add(max, [2, 2])] as const;

  // await drawField(field, bbox);
  // await drawField(field, SCENE_BBOX);
  let sand: vector.Vector2 | null = SAND_SOURCE;
  let sandCount = 1;

  while (isFree(field, SAND_SOURCE)) {
    // await delay(20);
    createPoint(field, sand, "o");
    // await updateField(field, bbox);
    // await updateField(field, SCENE_BBOX);
    const isBottom = vector.add(sand, [0, 1])[1] >= max[1] + 2;

    if (isFree(field, vector.add(sand, [0, 1])) && !isBottom) {
      removePoint(field, sand);
      sand = vector.add(sand, [0, 1]);
    } else if (isFree(field, vector.add(sand, [-1, 1])) && !isBottom) {
      removePoint(field, sand);
      sand = vector.add(sand, [-1, 1]);
    } else if (isFree(field, vector.add(sand, [1, 1])) && !isBottom) {
      removePoint(field, sand);
      sand = vector.add(sand, [1, 1]);
    } else {
      sand = SAND_SOURCE;
      sandCount++;
    }
  }

  console.log();
  console.log(sandCount - 1);
}

await main();
