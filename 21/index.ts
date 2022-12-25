import { invariant } from "../utils/invariant.ts";
import * as tree from "../utils/tree.ts";

type NumberExpression = {
  number: number;
};

type OperationExpression = {
  operation: string;
  monkeys: string[];
};

function parseInput(input: string) {
  const monkeys: Map<string, NumberExpression | OperationExpression> =
    new Map();

  input
    .split("\n")
    .filter(Boolean)
    .forEach((row) => {
      const [name, expression] = row.split(": ");
      const number = parseInt(expression, 10);
      if (!isNaN(number)) {
        monkeys.set(name, { number });
        return;
      }

      const [left, operation, right] = expression.split(" ");

      monkeys.set(name, { operation, monkeys: [left, right] });
    });

  return monkeys;
}

function isOperation(
  expression: OperationExpression | NumberExpression
): expression is OperationExpression {
  return "operation" in expression;
}

function draw<T>(tree: tree.Tree<T>, indentation = "") {
  let image = tree.data.name + "\n";
  tree.children.forEach((childTree, index) => {
    const isLast = index === tree.children.length - 1;
    image +=
      indentation +
      (isLast ? "└" : "├") +
      "─ " +
      draw(childTree, indentation + (isLast ? "   " : "│  "));
  });

  return image;
}

export function fold<T, G, H>(
  tree: tree.Tree<T>,
  f: (data: T, children: G) => H,
  g: (x: H[]) => G
) {
  function foldRose(tree: tree.Tree<T>): H {
    return f(tree.data, foldForest(tree.children));
  }

  function foldForest(forest: tree.Tree<T>[]): G {
    return g(forest.map(foldRose));
  }

  return foldRose(tree);
}

function calculate(
  root: tree.Tree<{
    name: string;
    expression?: NumberExpression | OperationExpression;
  }>
) {
  return fold(
    root,
    (data, children: number[]) => {
      // console.log(data.name, data.expression, children);
      invariant(data.expression);
      if (isOperation(data.expression)) {
        switch (data.expression.operation) {
          case "+":
            return {
              name: data.name,
              expression: {
                number: children[0] + children[1],
              },
            };
          case "*":
            return {
              name: data.name,
              expression: {
                number: children[0] * children[1],
              },
            };
          case "-":
            return {
              name: data.name,
              expression: {
                number: children[0] - children[1],
              },
            };
          case "/":
            return {
              name: data.name,
              expression: {
                number: children[0] / children[1],
              },
            };
          default:
            throw new Error("Unknown operation");
        }
      }

      // return data.expression.number;
      return {
        name: data.name,
        expression: {
          number: data.expression.number,
        },
      };
    },
    (children: Array<{ name: string; expression: NumberExpression }>) =>
      children.map((child) => child.expression.number)
  ).expression.number;
}

function solve(
  root: tree.Tree<{
    name: string;
    expression?: NumberExpression | OperationExpression;
  }>,
  humn: tree.Tree<{
    name: string;
    expression?: NumberExpression | OperationExpression;
  }>,
  value: number
) {
  humn.data.expression = { number: value };
  return calculate(root);
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const monkeys = parseInput(input);

  const lookup: Map<
    string,
    tree.Tree<{
      name: string;
      expression?: NumberExpression | OperationExpression;
    }>
  > = new Map();
  const orphans = new Set();

  for (const [name, expression] of monkeys) {
    if (!lookup.has(name)) {
      lookup.set(name, tree.create({ name }));
      orphans.add(name);
    }

    const t = lookup.get(name)!;
    t.data.expression = expression;

    if (isOperation(expression)) {
      const [left, right] = expression.monkeys;
      if (!lookup.has(left)) {
        lookup.set(left, tree.create({ name: left }));
      }
      if (!lookup.has(right)) {
        lookup.set(right, tree.create({ name: right }));
      }
      tree.addChild(t, lookup.get(left)!);
      tree.addChild(t, lookup.get(right)!);

      orphans.delete(left);
      orphans.delete(right);
    }
  }

  invariant(orphans.size === 1, "Expected exactly one root orphan");

  const root = lookup.get("root")!;

  const result = calculate(root);

  // console.log(draw(root));
  console.log(result);

  invariant(root.data.expression);
  invariant("operation" in root.data.expression);
  root.data.expression.operation = "-";

  const humn = lookup.get("humn")!;
  humn.children = [];

  let left = [0, solve(root, humn, 0)];
  let right = [1, solve(root, humn, 1)];
  let mid;
  while (Math.sign(left[1]) === Math.sign(right[1])) {
    left = right;
    right = [right[0] * 2, solve(root, humn, right[0] * 2)];
  }

  while (1) {
    const midValue = Math.ceil((left[0] + right[0]) / 2);
    mid = [midValue, solve(root, humn, midValue)];
    if (mid[1] === 0) {
      break;
    }
    if (Math.sign(left[1]) === Math.sign(mid[1])) {
      left = mid;
    } else {
      right = mid;
    }
  }

  invariant(mid);

  console.log(mid[0]);
}

await main();
