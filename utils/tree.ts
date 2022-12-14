export type Tree<T> = {
  data: T;
  children: Tree<T>[];
};

export function create<T>(data: T, children: Tree<T>[] = []): Tree<T> {
  return {
    data,
    children,
  };
}

export function addChild<T>(tree: Tree<T>, child: Tree<T>): void {
  tree.children.push(child);
}

export function removeChild<T>(tree: Tree<T>, child: Tree<T>): void {
  tree.children = tree.children.filter((c) => c !== child);
}

export function find<T>(
  tree: Tree<T>,
  fn: (tree: Tree<T>) => boolean
): Tree<T> | undefined {
  if (fn(tree)) {
    return tree;
  }

  for (const child of tree.children) {
    const result = find(child, fn);
    if (result) {
      return result;
    }
  }
}

export function parent<T>(tree: Tree<T>, child: Tree<T>): Tree<T> | undefined {
  return find(tree, (tree) => tree.children.includes(child));
}
