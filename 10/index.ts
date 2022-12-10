import { isEnumValue } from "../utils/enum.ts";
import { invariant } from "../utils/invariant.ts";
import * as matrix from "../utils/matrix.ts";

enum Instruction {
  Noop = "noop",
  Addx = "addx",
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [instructionString, valueString] = line.split(" ");
      const value = valueString ? parseInt(valueString, 10) : 0;

      invariant(isEnumValue(Instruction, instructionString), "Invalid way");
      invariant(!isNaN(value), "Invalid value");

      return [instructionString, value] as const;
    });
}

const crtWidth = 40;
const crtHeight = 6;
const crt: string[][] = matrix.create(crtWidth, crtHeight, () => " ");

const LIT_PIXEL = "#";
const DARK_PIXEL = ".";

const X_REF = 0;
const registers: number[] = [];
let cycle = 0;

let pointer = 0;
let timer = 0;

let bufferRef = -1;
let buffer = 0;

function reset() {
  cycle = 0;
  registers[X_REF] = 1;
}

function writeBuffer(buffer: number) {
  if (bufferRef >= 0) {
    registers[bufferRef] = buffer;
    bufferRef = -1;
  }
}

function drawCrtPixel(cycle: number) {
  const x = (cycle - 1) % crtWidth;
  const y = Math.floor((cycle - 1) / crtWidth) % crtHeight;

  const lit = Math.abs(x - registers[X_REF]) <= 1;
  crt[y][x] = lit ? LIT_PIXEL : DARK_PIXEL;
}

function noop() {
  timer = 0;
}

function addx(value: number) {
  if (timer === 0) {
    timer = 2;
  }
  // imitate step-by-step execution
  switch (timer) {
    case 2: {
      bufferRef = X_REF;
      buffer = registers[bufferRef];
      timer = 1;
      break;
    }
    case 1: {
      buffer += value;
      timer = 0;
      break;
    }
  }
}

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const instructions = parseInput(input);

  reset();

  while (pointer < instructions.length) {
    const [instruction, value] = instructions[pointer];
    cycle += 1;

    switch (instruction) {
      case Instruction.Noop:
        noop();
        break;
      case Instruction.Addx:
        addx(value);
        break;
      default:
        throw new Error("Invalid instruction");
    }

    drawCrtPixel(cycle);

    if (timer <= 0) {
      writeBuffer(buffer);
      pointer += 1;
    }
  }

  console.log(crt.map((row) => row.join("")).join("\n"));
}

await main();
