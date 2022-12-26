export type Vector2 = readonly [number, number];

export function eq([ax, ay]: Vector2, [bx, by]: Vector2): boolean {
  return ax === bx && ay === by;
}

export function add([ax, ay]: Vector2, [bx, by]: Vector2): Vector2 {
  return [ax + bx, ay + by];
}

export function diff([ax, ay]: Vector2, [bx, by]: Vector2): Vector2 {
  return [ax - bx, ay - by];
}

export function scale([x, y]: Vector2, s: number): Vector2 {
  return [x * s, y * s];
}

export function sig(x: number): number {
  if (x === 0) {
    return 0;
  }

  if (x < 0) {
    return -1;
  }

  return 1;
}

export function modSq([x, y]: Vector2): number {
  return x * x + y * y;
}

export function translate(t: Vector2) {
  return function (x: Vector2) {
    return add(x, t);
  };
}
// quarter rotate (0 -> 0, 1 -> 90, 2 -> 180, 3 -> 270 degrees);
export function rotateQ(angle: number): (v: Vector2) => Vector2 {
  angle = angle % 4;
  if (angle < 0) {
    angle += 4;
  }

  switch (angle) {
    case 0:
      return function (v: Vector2) {
        return v;
      };
    case 1:
      return function ([x, y]: Vector2) {
        return [-y, x];
      };
    case 2:
      return function ([x, y]: Vector2) {
        return [-x, -y];
      };
    case 3:
      return function ([x, y]: Vector2) {
        return [y, -x];
      };
    default:
      throw new Error("Invalid angle");
  }
}

export const rotateQuarter = rotateQ(1);

export function toString(v: Vector2): string {
  return `(${v[0]},${v[1]})`;
}
