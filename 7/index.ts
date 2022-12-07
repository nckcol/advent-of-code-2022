import { FileSystem, FileSystemNode } from "./fs.ts";

class CommandInfo {
  output: (FileInfo | DirectoryInfo)[] = [];

  constructor(public name: string, public args: string[]) {}

  addLog(terms: string[]) {
    if (terms[0] === "dir") {
      this.output.push(new DirectoryInfo(terms[1]));
      return;
    }

    this.output.push(new FileInfo(terms[1], parseInt(terms[0], 10)));
  }
}

class FileInfo {
  constructor(public name: string, public size: number) {}
}

class DirectoryInfo {
  constructor(public name: string) {}
}

function sum(a: number, b: number) {
  return a + b;
}

function parseInput(input: string) {
  const commands: CommandInfo[] = [];

  function currentCommand() {
    return commands[commands.length - 1];
  }

  input
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const terms = line.split(" ");
      if (terms[0] === "$") {
        commands.push(new CommandInfo(terms[1], terms.slice(2)));
        return;
      }

      currentCommand().addLog(terms);
    });

  return commands;
}

function pathString(path: FileSystemNode[]) {
  return path
    .map((node) => {
      if (node.isDirectory()) {
        return `${node.name}/`;
      }

      return node.name;
    })
    .join("");
}

const MAX_DIR_SIZE = 100000;
const fs = new FileSystem();
let cwd: string[] = [];
const commandLog = parseInput(await Deno.readTextFile("./input.txt"));

for (const command of commandLog) {
  switch (command.name) {
    case "cd": {
      const directory = command.args[0];

      if (directory === "/") {
        cwd = [];
      } else if (directory === "..") {
        cwd.pop();
      } else {
        cwd.push(directory);
      }
      break;
    }
    case "ls": {
      command.output.forEach((info) => {
        if (info instanceof DirectoryInfo) {
          fs.mkdir([...cwd, info.name]);
          return;
        }

        if (info instanceof FileInfo) {
          fs.mkfile(cwd, info.name, info.size);
          return;
        }
      });
      break;
    }
  }
}

const filteredDirInfo: { path: FileSystemNode[]; size: number }[] = [];

fs.traverse((path: FileSystemNode[], sizes: number[]) => {
  const top = path.at(-1);

  if (top?.isFile()) {
    return top?.size ?? 0;
  }

  const size = sizes.reduce(sum, 0);

  if (size < MAX_DIR_SIZE) {
    filteredDirInfo.push({ path, size });
  }

  return size;
});

filteredDirInfo.forEach((info) => {
  console.log(pathString(info.path), info.size);
});

console.log("Total:", filteredDirInfo.map((info) => info.size).reduce(sum, 0));
