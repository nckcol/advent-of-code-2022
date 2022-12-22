export function create<T>(
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

export function at<T>(matrix: T[][], position: readonly [number, number]) {
  return matrix[position[1]]?.[position[0]];
}

export function set<T>(
  matrix: T[][],
  position: readonly [number, number],
  value: T
) {
  matrix[position[1]] ??= [];
  matrix[position[1]][position[0]] = value;
}

export function size<T>(matrix: T[][]) {
  const size: [number, number] = [0, matrix.length];
  for (let i = 0; i < matrix.length; i++) {
    if (!matrix[i]) {
      continue;
    }
    size[0] = Math.max(size[0], matrix[i].length);
  }
  return size;
}
