import { invariant } from "../utils/invariant.ts";

/*
  Unfolded representation:

             x
  +----------->
  |    [C]
  | [D][A][B]
  |    [E]
y |    [F]
  v

*/

/*
  Faces:

       x         z         x         z         x         x
  +----->   +-----<   +----->   +----->   +----->   +----->
  | [A]     | [B]     | [C]     | [D]     | [E]     | [F]
y |       y |       z |       y |       z |       y |
  v         v         v         v         ʌ         ʌ

*/

type Vector3 = [number, number, number];

export enum CubeFace {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
}

export type CubeOrientation = {
  rotations: Array<CubeRotation>;
  axisX: Vector3;
  axisY: Vector3;
  axisZ: Vector3;
};

export const CUBE_FACE_ORIENTATION = {
  [CubeFace.A]: [0, 0, 1],
  [CubeFace.B]: [1, 0, 0],
  [CubeFace.C]: [0, -1, 0],
  [CubeFace.D]: [-1, 0, 0],
  [CubeFace.E]: [0, 1, 0],
  [CubeFace.F]: [0, 0, -1],
} as const;

export const CUBE_FACE_ROTATION = {
  [CubeFace.A]: {
    [0]: [1, 0, 0],
    [1]: [0, 1, 0],
    [2]: [-1, 0, 0],
    [3]: [0, -1, 0],
  },
  [CubeFace.B]: {
    [0]: [0, 0, -1],
    [1]: [0, 1, 0],
    [2]: [0, 0, 1],
    [3]: [0, -1, 0],
  },
  [CubeFace.C]: {
    [0]: [1, 0, 0],
    [1]: [0, 0, 1],
    [2]: [-1, 0, 0],
    [3]: [0, 0, -1],
  },
  [CubeFace.D]: {
    [0]: [0, 0, 1],
    [1]: [0, 1, 0],
    [2]: [0, 0, -1],
    [3]: [0, -1, 0],
  },
  [CubeFace.E]: {
    [0]: [1, 0, 0],
    [1]: [0, 0, -1],
    [2]: [-1, 0, 0],
    [3]: [0, 0, 1],
  },
  [CubeFace.F]: {
    [0]: [1, 0, 0],
    [1]: [0, -1, 0],
    [2]: [-1, 0, 0],
    [3]: [0, 1, 0],
  },
} as const;

export enum CubeRotation {
  XCW = "XCW",
  XCCW = "XCCW",
  YCW = "YCW",
  YCCW = "YCCW",
  ZCW = "ZCW",
  ZCCW = "ZCCW",
}

function dotProduct(a: Vector3, b: Vector3) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function crossProduct(a: Vector3, b: Vector3) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function rotateY(angle: number) {
  let mod = angle % 4;
  if (mod < 0) mod += 4;
  return function ([x, y, z]: Vector3): Vector3 {
    switch (mod) {
      case 0:
        return [x, y, z];
      case 1:
        return [z, y, -x];
      case 2:
        return [-x, y, -z];
      case 3:
        return [-z, y, x];
      default:
        throw new Error("Invalid angle");
    }
  };
}

function rotateX(angle: number) {
  let mod = angle % 4;
  if (mod < 0) mod += 4;
  return function ([x, y, z]: Vector3): Vector3 {
    switch (mod) {
      case 0:
        return [x, y, z];
      case 1:
        return [x, -z, y];
      case 2:
        return [x, -y, -z];
      case 3:
        return [x, z, -y];
      default:
        throw new Error("Invalid angle");
    }
  };
}

function rotateZ(angle: number) {
  let mod = angle % 4;
  if (mod < 0) mod += 4;
  return function ([x, y, z]: Vector3): Vector3 {
    switch (mod) {
      case 0:
        return [x, y, z];
      case 1:
        return [y, -x, z];
      case 2:
        return [-x, -y, z];
      case 3:
        return [-y, x, z];
      default:
        throw new Error("Invalid angle");
    }
  };
}

export function rightRotation(orientation: CubeOrientation): CubeRotation {
  const Y: Vector3 = [0, 1, 0];
  const product = [
    dotProduct(orientation.axisX, Y),
    dotProduct(orientation.axisY, Y),
    dotProduct(orientation.axisZ, Y),
  ];

  if (product[0] === 1) {
    return CubeRotation.XCW;
  } else if (product[0] === -1) {
    return CubeRotation.XCCW;
  } else if (product[1] === 1) {
    return CubeRotation.YCW;
  } else if (product[1] === -1) {
    return CubeRotation.YCCW;
  } else if (product[2] === 1) {
    return CubeRotation.ZCW;
  } else if (product[2] === -1) {
    return CubeRotation.ZCCW;
  }

  throw new Error("Wrong angle");
}

export function topRotation(orientation: CubeOrientation): CubeRotation {
  const X: Vector3 = [1, 0, 0];
  const product = [
    dotProduct(orientation.axisX, X),
    dotProduct(orientation.axisY, X),
    dotProduct(orientation.axisZ, X),
  ];

  if (product[0] === 1) {
    return CubeRotation.XCW;
  } else if (product[0] === -1) {
    return CubeRotation.XCCW;
  } else if (product[1] === 1) {
    return CubeRotation.YCW;
  } else if (product[1] === -1) {
    return CubeRotation.YCCW;
  } else if (product[2] === 1) {
    return CubeRotation.ZCW;
  } else if (product[2] === -1) {
    return CubeRotation.ZCCW;
  }

  throw new Error("Wrong angle");
}

export function leftRotation(orientation: CubeOrientation): CubeRotation {
  const Y: Vector3 = [0, 1, 0];
  const product = [
    dotProduct(orientation.axisX, Y),
    dotProduct(orientation.axisY, Y),
    dotProduct(orientation.axisZ, Y),
  ];

  if (product[0] === 1) {
    return CubeRotation.XCCW;
  } else if (product[0] === -1) {
    return CubeRotation.XCW;
  } else if (product[1] === 1) {
    return CubeRotation.YCCW;
  } else if (product[1] === -1) {
    return CubeRotation.YCW;
  } else if (product[2] === 1) {
    return CubeRotation.ZCCW;
  } else if (product[2] === -1) {
    return CubeRotation.ZCW;
  }

  throw new Error("Wrong angle");
}

export function bottomRotation(orientation: CubeOrientation): CubeRotation {
  const X: Vector3 = [1, 0, 0];
  const product = [
    dotProduct(orientation.axisX, X),
    dotProduct(orientation.axisY, X),
    dotProduct(orientation.axisZ, X),
  ];

  if (product[0] === 1) {
    return CubeRotation.XCCW;
  } else if (product[0] === -1) {
    return CubeRotation.XCW;
  } else if (product[1] === 1) {
    return CubeRotation.YCCW;
  } else if (product[1] === -1) {
    return CubeRotation.YCW;
  } else if (product[2] === 1) {
    return CubeRotation.ZCCW;
  } else if (product[2] === -1) {
    return CubeRotation.ZCW;
  }

  throw new Error("Wrong angle");
}

export function rotateVector(
  orientation: CubeOrientation,
  rotation: CubeRotation,
  v: Vector3
): Vector3 {
  const [axis, multiplier] = (() => {
    switch (rotation) {
      case CubeRotation.XCCW:
        return [orientation.axisX, 1];
      case CubeRotation.XCW:
        return [orientation.axisX, -1];
      case CubeRotation.YCCW:
        return [orientation.axisY, 1];
      case CubeRotation.YCW:
        return [orientation.axisY, -1];
      case CubeRotation.ZCCW:
        return [orientation.axisZ, 1];
      case CubeRotation.ZCW:
        return [orientation.axisZ, -1];
    }
  })();

  const product = [
    dotProduct(axis, [1, 0, 0]),
    dotProduct(axis, [0, 1, 0]),
    dotProduct(axis, [0, 0, 1]),
  ];

  if (product[0] !== 0) {
    return rotateX(multiplier * product[0])(v);
  } else if (product[1] !== 0) {
    return rotateY(multiplier * product[1])(v);
  } else if (product[2] !== 0) {
    return rotateZ(multiplier * product[2])(v);
  }
  throw new Error("Wrong angle");
}

export function rotateCube(
  orientation: CubeOrientation,
  rotation: CubeRotation
): CubeOrientation {
  return {
    ...orientation,
    rotations: [...orientation.rotations, rotation],
    axisX: rotateVector(orientation, rotation, orientation.axisX),
    axisY: rotateVector(orientation, rotation, orientation.axisY),
    axisZ: rotateVector(orientation, rotation, orientation.axisZ),
  };
}

export function getFrontFace(orientation: CubeOrientation): [CubeFace, number] {
  const Z: Vector3 = [0, 0, 1];
  const X: Vector3 = [1, 0, 0];

  const componentZ: Vector3 = [
    dotProduct(orientation.axisX, Z),
    dotProduct(orientation.axisY, Z),
    dotProduct(orientation.axisZ, Z),
  ];

  const componentX: Vector3 = [
    dotProduct(orientation.axisX, X),
    dotProduct(orientation.axisY, X),
    dotProduct(orientation.axisZ, X),
  ];

  const face = Object.entries(CUBE_FACE_ORIENTATION).find(
    ([_, faceOrientation]) =>
      dotProduct(faceOrientation as Vector3, componentZ) === 1
  )?.[0];

  invariant(face, "Wrong angle");

  const angle = Object.entries(CUBE_FACE_ROTATION[face as CubeFace]).find(
    ([_, faceRotation]) => dotProduct(faceRotation as Vector3, componentX) === 1
  )?.[0];

  invariant(angle, "Wrong angle");

  return [face as CubeFace, parseInt(angle, 10)];
}
