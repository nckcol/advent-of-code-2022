import { invariant } from "../utils/invariant.ts";
import * as Matrix from "../utils/matrix.ts";
import * as Vector from "../utils/vector2.ts";

function parseInput(input: string) {
  const [mapInput, pathInput] = input.split("\n\n").filter(Boolean);

  const map: string[][] = [];

  mapInput.split("\n").forEach((row, rowIndex) => {
    Array.from(row).forEach((col, colIndex) => {
      if (col === " ") {
        return;
      }
      Matrix.set(map, [colIndex + 1, rowIndex + 1], col);
    });
  });

  const path: Array<number | "L" | "R"> = [];
  let number = 0;

  Array.from(pathInput).forEach((char) => {
    switch (char) {
      case "L": {
        path.push(number);
        path.push("L");
        number = 0;
        return;
      }
      case "R": {
        path.push(number);
        path.push("R");
        number = 0;
        return;
      }
      default: {
        const digit = parseInt(char, 10);
        if (isNaN(digit)) {
          return;
        }
        number = number * 10 + digit;
      }
    }
  });
  if (number > 0) {
    path.push(number);
  }

  return { map, path };
}

function loop(value: number, size: number) {
  const newValue = value % size;
  if (newValue < 0) {
    return newValue + size;
  }
  return newValue;
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const { map, path } = parseInput(input);
  const size: Vector.Vector2 = Matrix.size(map);
  let direction = 0;
  let position: Vector.Vector2 = [1, 1];

  while (!Matrix.at(map, position)) {
    position = Vector.add(position, [1, 0]);
  }

  console.log(position);

  for (const step of path) {
    switch (step) {
      case "L": {
        direction = loop(direction - 1, 4);
        continue;
      }
      case "R": {
        direction = loop(direction + 1, 4);
        continue;
      }
      default: {
        const forward = Vector.rotateQ(direction)([1, 0]);
        let stepCount = step;
        while (stepCount--) {
          let nextPosition = position;
          do {
            nextPosition = Vector.add(nextPosition, forward);
            nextPosition = [
              loop(nextPosition[0], size[0]),
              loop(nextPosition[1], size[1]),
            ];
          } while (!Matrix.at(map, nextPosition));

          if (Matrix.at(map, nextPosition) === "#") {
            break;
          }

          position = nextPosition;
        }
      }
    }
  }

  console.log(position, direction);
  console.log(1000 * position[1] + 4 * position[0] + ((4 - direction) % 4));
}

await main();
