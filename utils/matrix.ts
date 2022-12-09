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
