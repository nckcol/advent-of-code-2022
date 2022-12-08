function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => Array.from(line).map((n) => parseInt(n, 10)));
}

function createMatrix<T>(
  width: number,
  height: number,
  value: (x: number, y: number) => T
) {
  const matrix: T[][] = [];
  for (let i = 0; i < height; i++) {
    matrix[i] ??= [];
    for (let j = 0; j < width; j++) {
      matrix[i][j] = value(j, i);
    }
  }

  return matrix;
}

const input = await Deno.readTextFile("./input.txt");
const trees = parseInput(input);
const height = trees.length;
const width = trees[0].length;

const maxHeightTop: number[][] = createMatrix(width, height, () => 0);
const maxHeightLeft: number[][] = createMatrix(width, height, () => 0);
const maxHeightBottom: number[][] = createMatrix(width, height, () => 0);
const maxHeightRight: number[][] = createMatrix(width, height, () => 0);

for (let i = 1; i < width - 1; i++) {
  maxHeightTop[0][i] = trees[0][i];
  maxHeightBottom[height - 1][i] = trees[height - 1][i];
}

for (let i = 1; i < height - 1; i++) {
  maxHeightLeft[i][0] = trees[i][0];
  maxHeightRight[i][width - 1] = trees[i][width - 1];
}

for (let i = 1; i < height - 1; i++) {
  for (let j = 1; j < width - 1; j++) {
    // iterate from top left
    maxHeightTop[i][j] = Math.max(trees[i][j], maxHeightTop[i - 1][j]);
    maxHeightLeft[i][j] = Math.max(trees[i][j], maxHeightLeft[i][j - 1]);

    // iterate from bottom right
    const k = height - 1 - i;
    const l = width - 1 - j;
    maxHeightBottom[k][l] = Math.max(trees[k][l], maxHeightBottom[k + 1][l]);
    maxHeightRight[k][l] = Math.max(trees[k][l], maxHeightRight[k][l + 1]);
  }
}

let visibleTrees = 2 * (width + height) - 4;

for (let i = 1; i < height - 1; i++) {
  for (let j = 1; j < width - 1; j++) {
    const minHeight = Math.min(
      maxHeightTop[i - 1][j],
      maxHeightLeft[i][j - 1],
      maxHeightBottom[i + 1][j],
      maxHeightRight[i][j + 1]
    );

    if (minHeight < trees[i][j]) {
      visibleTrees += 1;
    }
  }
}

console.log(visibleTrees);
