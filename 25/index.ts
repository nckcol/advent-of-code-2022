function parseInput(input: string) {
  return input.split("\n").filter(Boolean);
}

function fromSnafuDigit(digit: string): number {
  switch (digit) {
    case "=":
      return -2;
    case "-":
      return -1;
    case "0":
      return 0;
    case "1":
      return 1;
    case "2":
      return 2;
    default:
      throw new Error("Invalid digit");
  }
}

function toSnafuDigit(digit: number): string {
  switch (digit) {
    case -2:
      return "=";
    case -1:
      return "-";
    case 0:
      return "0";
    case 1:
      return "1";
    case 2:
      return "2";
    default:
      throw new Error("Invalid digit");
  }
}

function fromSnafu(number: string): number {
  if (!number.length) {
    return 0;
  }

  return (
    fromSnafu(number.slice(0, -1)) * 5 +
    fromSnafuDigit(number.charAt(number.length - 1))
  );
}

function toSnafu(number: number): string {
  if (number === 0) {
    return "";
  }

  const rest = ((number + 2) % 5) - 2;
  const next = Math.floor((number + 2) / 5);

  return toSnafu(next).concat(toSnafuDigit(rest));
}

function sum(a: number, b: number) {
  return a + b;
}

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const numbers = parseInput(input);

  console.log(toSnafu(numbers.map(fromSnafu).reduce(sum)));
}

await main();
