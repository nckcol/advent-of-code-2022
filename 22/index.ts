import { invariant } from "../utils/invariant.ts";
import * as Matrix from "../utils/matrix.ts";
import * as Vector from "../utils/vector2.ts";
import {
  bottomRotation,
  CubeFace,
  CubeOrientation,
  getFrontFace,
  leftRotation,
  rightRotation,
  rotateCube,
  topRotation,
} from "./cube.ts";

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

function matrixVectorRotate(
  size: [number, number],
  angle: number,
  v: Vector.Vector2
): Vector.Vector2 {
  let mod = angle % 4;
  if (mod < 0) mod += 4;
  switch (mod) {
    case 0:
      return v;
    case 1:
      return [v[1], size[1] - v[0] - 1];
    case 2:
      return [size[0] - v[0] - 1, size[1] - v[1] - 1];
    case 3:
      return [size[0] - v[1] - 1, v[0]];
    default:
      throw new Error("Invalid angle");
  }
}

function matrixRotate(matrix: string[][], angle: number) {
  const size = Matrix.size(matrix);
  const newMatrix: string[][] = [];

  for (let y = 0; y < size[1]; y++) {
    for (let x = 0; x < size[0]; x++) {
      Matrix.set(
        newMatrix,
        matrixVectorRotate(size, angle, [x, y]),
        Matrix.at(matrix, [x, y])
      );
    }
  }

  return newMatrix;
}

function parseCube(map: string[][]) {
  let cellCount = 0;
  const [width, height] = Matrix.size(map);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (Matrix.at(map, [x, y])) {
        cellCount++;
      }
    }
  }
  const cubeSize = Math.sqrt(cellCount / 6);

  function isFace(map: string[][], [x, y]: Vector.Vector2) {
    return Matrix.at(map, [x * cubeSize + 1, y * cubeSize + 1]);
  }

  function parseFace(map: string[][], [x, y]: Vector.Vector2) {
    if (!isFace(map, [x, y])) {
      return undefined;
    }
    const faceMap = Matrix.create(cubeSize, cubeSize, () => ".");
    for (let fx = 0; fx < cubeSize; fx++) {
      for (let fy = 0; fy < cubeSize; fy++) {
        Matrix.set(
          faceMap,
          [fx, fy],
          Matrix.at(map, [x * cubeSize + fx + 1, y * cubeSize + fy + 1])
        );
      }
    }
    return faceMap;
  }

  console.log("Size:", cubeSize);

  const cubeOrientation: CubeOrientation = {
    rotations: [],
    axisX: [1, 0, 0],
    axisY: [0, 1, 0],
    axisZ: [0, 0, 1],
  };
  const cube: Map<CubeFace, string[][]> = new Map();
  const facePosition: Map<CubeFace, Vector.Vector2> = new Map();
  const faceRotation: Map<CubeFace, number> = new Map();
  const queue: Array<[CubeOrientation, Vector.Vector2]> = [];
  const visited: Set<string> = new Set();

  for (let x = 0; x < width / cubeSize; x++) {
    if (isFace(map, [x, 0])) {
      queue.push([cubeOrientation, [x, 0]]);
      break;
    }
  }

  while (queue.length) {
    const [cubeOrientation, position] = queue.shift()!;
    const [face, angle] = getFrontFace(cubeOrientation);
    if (visited.has(Vector.toString(position)) || cube.has(face)) {
      continue;
    }
    visited.add(Vector.toString(position));
    if (!isFace(map, position)) {
      continue;
    }

    const faceMap = parseFace(map, position);

    invariant(faceMap, "Face map should be defined");
    cube.set(face, matrixRotate(faceMap, -1 * angle));
    facePosition.set(face, [
      position[0] * cubeSize + 1,
      position[1] * cubeSize + 1,
    ]);
    faceRotation.set(face, angle);

    const top = Vector.add(position, [0, -1]);
    const left = Vector.add(position, [-1, 0]);
    const right = Vector.add(position, [1, 0]);
    const bottom = Vector.add(position, [0, 1]);

    queue.push(
      [rotateCube(cubeOrientation, topRotation(cubeOrientation)), top],
      [rotateCube(cubeOrientation, leftRotation(cubeOrientation)), left],
      [rotateCube(cubeOrientation, rightRotation(cubeOrientation)), right],
      [rotateCube(cubeOrientation, bottomRotation(cubeOrientation)), bottom]
    );
  }

  return [cube, facePosition, faceRotation] as const;
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
  console.log("__________________________");

  // part 2
  const [cube, facePosition, faceRotation] = parseCube(map);
  const cubeSize = 50;
  let cubeDirection = 0;
  let cubePosition: Vector.Vector2 = [0, 0];
  let cubeOrientation: CubeOrientation = {
    rotations: [],
    axisX: [1, 0, 0],
    axisY: [0, 1, 0],
    axisZ: [0, 0, 1],
  };

  for (const step of path) {
    switch (step) {
      case "L": {
        cubeDirection = loop(cubeDirection - 1, 4);
        continue;
      }
      case "R": {
        cubeDirection = loop(cubeDirection + 1, 4);
        continue;
      }
      default: {
        const forward = Vector.rotateQ(cubeDirection)([1, 0]);
        let stepCount = step;
        while (stepCount--) {
          let nextCubePosition = Vector.add(cubePosition, forward);
          let nextCubeOrientation = cubeOrientation;

          if (nextCubePosition[0] < 0) {
            nextCubePosition = [cubeSize - 1, nextCubePosition[1]];
            // and rotate cube left
            nextCubeOrientation = rotateCube(
              cubeOrientation,
              leftRotation(cubeOrientation)
            );
          } else if (nextCubePosition[0] >= cubeSize) {
            nextCubePosition = [0, nextCubePosition[1]];
            // and rotate cube right
            nextCubeOrientation = rotateCube(
              cubeOrientation,
              rightRotation(cubeOrientation)
            );
          } else if (nextCubePosition[1] < 0) {
            nextCubePosition = [nextCubePosition[0], cubeSize - 1];
            // and rotate cube top
            nextCubeOrientation = rotateCube(
              cubeOrientation,
              topRotation(cubeOrientation)
            );
          } else if (nextCubePosition[1] >= cubeSize) {
            nextCubePosition = [nextCubePosition[0], 0];
            // and rotate cube bottom
            nextCubeOrientation = rotateCube(
              cubeOrientation,
              bottomRotation(cubeOrientation)
            );
          }

          const [face, angle] = getFrontFace(nextCubeOrientation);
          const faceMap = cube.get(face)!;
          if (
            Matrix.at(matrixRotate(faceMap, angle), nextCubePosition) === "#"
          ) {
            break;
          }

          cubeOrientation = nextCubeOrientation;
          cubePosition = nextCubePosition;
        }
      }
    }
  }

  const [face, angle] = getFrontFace(cubeOrientation);
  console.log("Final face:", face);
  const initialRot = faceRotation.get(face)!;
  const initialPos = facePosition.get(face)!;
  const reverseRotation = initialRot + -1 * angle;
  const pos = Vector.add(
    matrixVectorRotate([cubeSize, cubeSize], reverseRotation, cubePosition),
    initialPos
  );
  const dir = loop(cubeDirection + reverseRotation, 4);
  facePosition.get(face)!;
  console.log("Position:", pos);
  console.log("Result:", 1000 * pos[1] + 4 * pos[0] + ((4 - dir) % 4));
}

await main();
