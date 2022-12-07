export class FileSystem {
  root: FileSystemNode;

  constructor() {
    this.root = new FileSystemNode("");
  }

  mkdir(path: string[]) {
    let current = this.root;
    for (const name of path) {
      if (!current.children.has(name)) {
        current.children.set(name, new FileSystemNode(name));
      }

      current = current.children.get(name)!;
    }
  }

  mkfile(path: string[], name: string, size: number) {
    let currentDirectory = this.root;

    for (const directoryName of path) {
      if (!currentDirectory.children.has(directoryName)) {
        throw new Error("Directory does not exist");
      } else {
        if (currentDirectory.isFile()) {
          throw new Error("Cannot use file as directory");
        }
      }

      currentDirectory = currentDirectory.children.get(directoryName)!;
    }

    currentDirectory.children.set(name, new FileSystemNode(name, "file", size));
  }

  traverse<T>(fn: (path: FileSystemNode[], children: T[]) => T) {
    function traverseNode(path: FileSystemNode[]): T {
      const node = path.at(-1);
      const children =
        (node?.isDirectory() && Array.from(node.children.values())) || [];

      return fn(
        path,
        children.map((childNode) => traverseNode([...path, childNode]))
      );
    }

    return traverseNode([this.root]);
  }
}

export class FileSystemNode {
  name: string;
  type: "file" | "directory";
  size: number | undefined;
  children: Map<string, FileSystemNode> = new Map();

  constructor(
    name: string,
    type: "file" | "directory" = "directory",
    size?: number
  ) {
    this.name = name;
    this.type = type;

    if (type === "file") {
      this.size = size ?? 0;
    }
  }

  isFile() {
    return this.type === "file";
  }

  isDirectory() {
    return this.type === "directory";
  }
}
