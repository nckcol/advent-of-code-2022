function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((row) => parseInt(row, 10));
}

function loop(value: number, size: number) {
  const newValue = value % size;
  if (newValue <= 0) {
    return newValue + size;
  }
  return newValue;
}

const DECRYPTION_KEY = 811589153;

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const numbers = parseInput(input);

  const size = numbers.length;
  const list = numbers.map((number, index) => [number * DECRYPTION_KEY, index]);

  for (let c = 0; c < 10; c++) {
    for (let i = 0; i < size; i++) {
      const index = list.findIndex(([, index]) => index === i);
      const current = list[index];

      if (current[0] === 0) {
        continue;
      }

      list.splice(index, 1);
      list.splice(loop(index + current[0], size - 1), 0, current);
    }
  }

  const startIndex = list.findIndex(([number]) => number === 0);
  console.log(
    [1000, 2000, 3000]
      .map((pos) => loop(pos + startIndex, size))
      .map((index) => list[index][0])
      .reduce((a, b) => a + b, 0)
  );
}

await main();
