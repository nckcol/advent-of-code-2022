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

export function map<T1, T2>(fn: (data: T1) => T2) {
  return function (tree: Tree<T1>): Tree<T2> {
    return create(fn(tree.data), tree.children.map(map(fn)));
  };
}

export function traverse<T>(visit: (data: T) => void) {
  return function (tree: Tree<T>) {
    tree.children.forEach(traverse(visit));
    visit(tree.data);
  };
}

function foldForest<T1, T2>(
  identity: T2,
  f: (data: T1, children: T2) => T2,
  g: (left: T2, right: T2) => T2
) {
  const _fold = fold(identity, f, g);
  return function (forest: Tree<T1>[]): T2 {
    return forest.map(_fold).reduce(g, identity);
  };
}

export function fold<T1, T2>(
  identity: T2,
  f: (data: T1, children: T2) => T2,
  g: (left: T2, right: T2) => T2
) {
  const _foldForest = foldForest(identity, f, g);
  return function (tree: Tree<T1>): T2 {
    return f(tree.data, _foldForest(tree.children));
  };
}
