function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => Array.from(line).map((n) => parseInt(n, 10)));
}

const input = await Deno.readTextFile("./input.txt");
const trees = parseInput(input);
const height = trees.length;
const width = trees[0].length;
let maxScenicScore = 0;

for (let i = 1; i < height - 1; i += 1) {
  for (let j = 1; j < width - 1; j += 1) {
    const treeHeight = trees[i][j];

    let leftDistance = j;
    let rightDistance = width - j - 1;
    let topDistance = i;
    let bottomDistance = height - i - 1;

    for (let l = 1; l < j; l += 1) {
      if (trees[i][j - l] >= treeHeight) {
        leftDistance = l;
        break;
      }
    }

    for (let l = 1; l < width - j; l += 1) {
      if (trees[i][j + l] >= treeHeight) {
        rightDistance = l;
        break;
      }
    }

    for (let k = 1; k < i; k += 1) {
      if (trees[i - k][j] >= treeHeight) {
        topDistance = k;
        break;
      }
    }

    for (let k = 1; k < height - i; k += 1) {
      if (trees[i + k][j] >= treeHeight) {
        bottomDistance = k;
        break;
      }
    }

    const scenicScore =
      leftDistance * rightDistance * topDistance * bottomDistance;

    if (scenicScore > maxScenicScore) {
      maxScenicScore = scenicScore;
    }
  }
}

console.log(maxScenicScore);
