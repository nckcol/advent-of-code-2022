import { pipe } from "https://deno.land/x/fp_ts@v2.11.4/function.ts";
import * as vector from "../utils/vector2.ts";
import { invariant } from "../utils/invariant.ts";

function acceptPrefix(prefix: string) {
  return function (input: string) {
    if (input.startsWith(prefix)) {
      return input.slice(prefix.length);
    }
    return "";
  };
}

function acceptTerm(terminal: string[], callback: (term: string) => void) {
  return function (input: string) {
    const terminalPosition = terminal
      .map((term) => input.indexOf(term))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b)[0];

    if (terminalPosition >= 0) {
      callback(input.slice(0, terminalPosition));
      return input.slice(terminalPosition);
    } else {
      callback(input);
      return "";
    }
  };
}

function acceptSpacing() {
  return function (input: string) {
    return input.trimStart();
  };
}

function parseXY(input: string) {
  const [xInput, yInput] = input.split(", ");
  const x = parseInt(acceptPrefix("x=")(xInput), 10);
  const y = parseInt(acceptPrefix("y=")(yInput), 10);
  invariant(!isNaN(x));
  invariant(!isNaN(y));
  return [x, y] as const;
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      let sensor: vector.Vector2;
      let beacon: vector.Vector2;

      pipe(
        line,
        acceptPrefix("Sensor at"),
        acceptSpacing(),
        acceptTerm([":"], (term) => {
          sensor = parseXY(term);
        }),
        acceptPrefix(":"),
        acceptSpacing(),
        acceptPrefix("closest beacon is at"),
        acceptSpacing(),
        acceptTerm([":"], (term) => {
          beacon = parseXY(term);
        })
      );

      invariant(sensor!);
      invariant(beacon!);

      return { sensor, beacon };
    });
}

function createCircle(
  field: string[][],
  center: vector.Vector2,
  radius: number
) {
  for (let x = center[0] - radius; x <= center[0] + radius; x++) {
    const rest = Math.abs(radius - center[0]);
    for (let y = center[1] - rest; y <= center[1] + rest; y++) {
      field[x][x] = "#";
    }
  }
}

function vertical(x: number) {
  return [
    [x, 0],
    [x, 1],
  ] as const;
}

function horizontal(y: number) {
  return [
    [0, y],
    [1, y],
  ] as const;
}

function circle(center: vector.Vector2, radius: number) {
  return [center, radius] as const;
}

function inside(
  circle: readonly [vector.Vector2, number],
  point: vector.Vector2
) {
  const d = vector.diff(circle[0], point);
  return Math.abs(d[0]) + Math.abs(d[1]) <= circle[1];
}

function circumference(circle: readonly [vector.Vector2, number]) {
  const [center, radius] = circle;
  const points: vector.Vector2[] = [
    vector.add(center, [-radius, 0]),
    vector.add(center, [radius, 0]),
  ];

  for (let x = -radius + 1; x <= radius - 1; x++) {
    const rest = Math.abs(radius - x);
    points.push(vector.add(center, [x, -rest]), vector.add(center, [x, rest]));
  }

  return points;
}

function orientation(line: readonly [vector.Vector2, vector.Vector2]) {
  const diff = vector.diff(line[1], line[0]);

  return diff[1] === 0 ? 1 : 0; // 0 = along y, 1 = along x
}

function distance(
  point: vector.Vector2,
  line: readonly [vector.Vector2, vector.Vector2]
): number {
  const o = orientation(line);
  const dist = vector.diff(point, line[0]);

  return Math.abs(dist[o]);
}

function intersection(
  line: readonly [vector.Vector2, vector.Vector2],
  circle: readonly [vector.Vector2, number]
): readonly [vector.Vector2, vector.Vector2] | null {
  const dist = distance(circle[0], line);
  // console.log(dist);
  const rest = circle[1] - dist;
  // console.log(rest);
  const o = orientation(line);
  // console.log(o);

  if (dist > circle[1]) {
    return null;
  }

  if (o === 0) {
    return [
      [line[0][0], circle[0][1] - rest],
      [line[0][0], circle[0][1] + rest],
    ] as const;
  } else {
    return [
      [circle[0][0] - rest, line[0][1]],
      [circle[0][0] + rest, line[0][1]],
    ];
  }
}

function overlapping(
  line1: readonly [vector.Vector2, vector.Vector2],
  line2: readonly [vector.Vector2, vector.Vector2]
): readonly [vector.Vector2, vector.Vector2] | null {
  const o1 = orientation(line1);
  const o2 = orientation(line2);

  if (o1 !== o2) {
    return null;
  }

  if (o1 === 1) {
    const line1x = [line1[0][0], line1[1][0]].sort((a, b) => a - b);
    const line2x = [line2[0][0], line2[1][0]].sort((a, b) => a - b);

    if (
      (line1x[0] < line2x[1] && line1x[1] >= line2x[0]) ||
      (line1x[1] > line2x[0] && line1x[0] <= line2x[1]) ||
      (line1x[0] <= line2x[0] && line1x[1] >= line2x[1]) ||
      (line1x[0] >= line2x[0] && line1x[1] <= line2x[1])
    ) {
      return [
        [Math.min(line1x[0], line1x[1], line2x[0], line2x[1]), line1[0][1]],
        [Math.max(line1x[0], line1x[1], line2x[0], line2x[1]), line1[0][1]],
      ] as const;
    } else {
      return null;
    }
  } else {
    throw new Error("Not implemented");
  }
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const positions = parseInput(input);

  // const row10 = horizontal(10);
  const row2000000 = horizontal(2000000);
  let intersections: Array<readonly [vector.Vector2, vector.Vector2]> = [];

  const circles: Array<readonly [vector.Vector2, number]> = [];

  for (const { sensor, beacon } of positions) {
    const diff = vector.diff(sensor, beacon);
    const radius = Math.abs(diff[0]) + Math.abs(diff[1]);
    console.log(`Sensor at ${sensor} is ${radius} away from ${beacon}`);

    circles.push(circle(sensor, radius));

    let inter = intersection(row2000000, circle(sensor, radius));

    console.log(inter);

    if (inter) {
      const newIntersections = [];
      for (const i of [...intersections]) {
        const o = overlapping(i, inter);
        if (!o) {
          newIntersections.push(i);
        } else {
          inter = o;
        }
      }
      newIntersections.push(inter);
      intersections = newIntersections;
    }
  }

  console.log(
    intersections
      .map((i) => Math.abs(vector.diff(i[0], i[1])[0]))
      .reduce((a, b) => a + b, 0)
  );

  let tuning;

  for (const ci of circles) {
    const c = circumference(circle(ci[0], ci[1] + 1));
    for (const point of c) {
      if (
        point[0] < 0 ||
        point[0] > 4000000 ||
        point[1] < 0 ||
        point[1] > 4000000
      ) {
        continue;
      }
      if (circles.every((cj) => !inside(cj, point))) {
        tuning = point[0] * 4000000 + point[1];
        break;
      }
    }
    if (tuning) {
      break;
    }
  }

  console.log("Beacon tuning is", tuning);
}

await main();
