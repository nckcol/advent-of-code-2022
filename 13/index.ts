import * as tree from "../utils/tree.ts";
import { invariant } from "../utils/invariant.ts";

function parsePacketInput(packetInput: string) {
  let packetTree: tree.Tree<number | null> | undefined;
  let node: tree.Tree<number | null> | undefined;
  let term = "";

  for (const char of packetInput) {
    switch (char) {
      case "[": {
        const newNode = tree.create(null);
        if (packetTree && node) {
          tree.addChild(node, newNode);
        } else {
          packetTree = newNode;
        }
        node = newNode;
        break;
      }
      case "]": {
        invariant(packetTree, "invalid packet");
        invariant(node, "invalid packet");
        if (term) {
          tree.addChild(node, tree.create(parseInt(term, 10)));
          term = "";
        }
        node = tree.parent(packetTree, node)!;
        break;
      }
      case ",": {
        invariant(packetTree, "invalid packet");
        invariant(node, "invalid packet");
        if (term) {
          tree.addChild(node, tree.create(parseInt(term, 10)));
          term = "";
        }
        break;
      }
      default: {
        invariant(packetTree, "invalid packet");
        invariant(node, "invalid packet");
        term += char;
      }
    }
  }

  return packetTree;
}

function parseInput(input: string) {
  return input
    .split("\n\n")
    .filter(Boolean)
    .map((packetPairInput) => {
      const [left, right] = packetPairInput.split("\n").map(parsePacketInput);
      invariant(left, "invalid packet");
      invariant(right, "invalid packet");
      return { left, right };
    });
}

function compare(
  left: tree.Tree<number | null>,
  right: tree.Tree<number | null>
): number {
  if (left.data !== null && right.data !== null) {
    return right.data - left.data;
  }

  if (left.data === null && right.data === null) {
    for (let i = 0; i < left.children.length; i++) {
      if (!right.children[i]) {
        return -1;
      }
      const comparison = compare(left.children[i], right.children[i]);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return right.children.length - left.children.length;
  }

  return compare(
    left.data !== null ? tree.create(null, [left]) : left,
    right.data !== null ? tree.create(null, [right]) : right
  );
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const packetPairList = parseInput(input);

  const validPackets = packetPairList
    .map((pair, index) => [pair, index + 1] as const)
    .filter(([{ left, right }]) => compare(left, right) >= 0);

  console.log(validPackets.map(([_, index]) => index).join(","));
  console.log(
    validPackets.map(([_, index]) => index).reduce((a, b) => a + b, 0)
  );

  const divider1: tree.Tree<number | null> = tree.create(null, [
    tree.create(null, [tree.create(2)]),
  ]);
  const divider2: tree.Tree<number | null> = tree.create(null, [
    tree.create(null, [tree.create(6)]),
  ]);

  const packetList = [divider1, divider2];
  packetPairList.forEach(({ left, right }) => {
    packetList.push(left, right);
  });
  const sortedPacketList = packetList.sort(compare).reverse();
  const divider1Index = sortedPacketList.indexOf(divider1) + 1;
  const divider2Index = sortedPacketList.indexOf(divider2) + 1;
  console.log(divider1Index, divider2Index, divider1Index * divider2Index);
}

await main();
