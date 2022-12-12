import * as tree from "../utils/tree.ts";
import { invariant } from "../utils/invariant.ts";

const MAGIC_NUMBER = 2 * 3 * 5 * 7 * 11 * 13 * 17 * 19;

function calculateIndent(row: string) {
  let indent;

  for (indent = 0; indent < row.length; indent += 1) {
    if (row[indent] !== " ") {
      break;
    }
  }

  if (indent === row.length) {
    return 0;
  }

  return indent;
}

function top<T>(list: Array<T>): T {
  return list[list.length - 1];
}

function parseInput(input: string) {
  const indent = [0];
  const ast = tree.create("");
  let node = ast;

  input
    .split("\n")
    .filter(Boolean)
    .forEach((row) => {
      const currentIndent = calculateIndent(row);
      if (currentIndent > top(indent)) {
        indent.push(currentIndent);
        node = node.children.at(-1)!;
      } else if (currentIndent < top(indent)) {
        do {
          indent.pop();
          node = tree.parent(ast, node)!;
        } while (currentIndent < top(indent));
      }

      tree.addChild(node, tree.create(row));
    });

  const monkeys: Monkey[] = ast.children.map((monkeyAst) => {
    const monkey: Partial<Monkey> = {
      inspections: 0,
    };

    monkeyAst.children.forEach((property) => {
      const [titleString, valueString] = property.data.split(": ");
      const title = titleString.trim().toLowerCase();

      switch (title) {
        case "starting items": {
          monkey.items = parseNumberList(valueString);
          return;
        }
        case "operation": {
          const [_, expressionString] = valueString.split("=");
          const [operand1, operator, operand2] = expressionString
            .trim()
            .split(" ");

          const operand1Fn = parseOperand(operand1);
          const operand2Fn = parseOperand(operand2);
          const operatorFn = parseOperator(operator);

          monkey.operation = (old: number) =>
            operatorFn(operand1Fn(old), operand2Fn(old));
          return;
        }
        case "test": {
          const testParts = valueString.split(" ");

          switch (testParts[0]) {
            case "divisible": {
              const mod = parseNumber(testParts[2]);
              monkey.test = (x: number) => x % mod === 0;
              break;
            }
          }

          const [trueAst, falseAst] = property.children;
          const trueMonkey = parseInt(trueAst.data.split(" ").at(-1) ?? "", 10);
          const falseMonkey = parseInt(
            falseAst.data.split(" ").at(-1) ?? "",
            10
          );
          monkey.next = (test: boolean) => (test ? trueMonkey : falseMonkey);
        }
      }
    });

    validateMonkey(monkey);

    return monkey;
  });

  return monkeys;
}

function parseNumber(number: string): number {
  return parseInt(number, 10);
}

function parseNumberList(list: string): number[] {
  return list.split(", ").map(parseNumber);
}

function validateMonkey(monkey: Partial<Monkey>): asserts monkey is Monkey {
  invariant(monkey.items, "Invalid items");
  invariant(monkey.operation, "Invalid operation");
  invariant(monkey.test, "Invalid test");
}

type Monkey = {
  items: number[];
  operation: (old: number) => number;
  test: (x: number) => boolean;
  next: (test: boolean) => number;
  inspections: number;
};

function identity<T>(value: T): T {
  return value;
}

function constant<T>(value: T): () => T {
  return () => value;
}

function add(a: number, b: number): number {
  return a + b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

function parseOperand(operand: string): (old: number) => number {
  switch (operand) {
    case "old":
      return identity;
    default:
      return constant(parseNumber(operand));
  }
}

function parseOperator(operator: string): (a: number, b: number) => number {
  switch (operator) {
    case "+":
      return add;
    case "*":
      return multiply;
    default:
      throw new Error(`Invalid operator: ${operator}`);
  }
}

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const monkeys = parseInput(input);

  for (let i = 0; i < 10000; i++) {
    for (let m = 0; m < monkeys.length; m++) {
      const monkey = monkeys[m];
      while (monkey.items.length > 0) {
        const item = monkey.items.shift()!;
        monkey.inspections += 1;
        const newItem = Math.trunc(monkey.operation(item)) % MAGIC_NUMBER;
        // console.log("Monkey", m, "item", item, "->", newItem);
        const nextMonkey = monkey.next(monkey.test(newItem));
        // console.log("Next monkey", nextMonkey);
        monkeys[nextMonkey].items.push(newItem);
      }
    }
  }

  console.log();
  monkeys.forEach((monkey, index) =>
    console.log(`Monkey ${index}:`, monkey.items.join(", "))
  );

  console.log();
  monkeys.forEach((monkey, index) =>
    console.log(`Monkey ${index}:`, monkey.inspections, "inspections")
  );
}

await main();
