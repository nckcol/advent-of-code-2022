import { pipe } from "https://deno.land/x/fp_ts@v2.11.4/function.ts";
import { invariant } from "../utils/invariant.ts";

function acceptPrefix(prefix: string | string[]) {
  return function (input: string) {
    if (Array.isArray(prefix)) {
      for (const p of prefix) {
        if (input.startsWith(p)) {
          return input.slice(p.length);
        }
      }
    } else {
      if (input.startsWith(prefix)) {
        return input.slice(prefix.length);
      }
    }
    return "";
  };
}

function acceptTerm(terminal: string[], callback: (term: string) => void) {
  return function (input: string) {
    const terminalPosition = terminal
      .map((term) => input.indexOf(term))
      .filter((position) => position >= 0)
      .sort((a, b) => a - b)[0];

    if (terminalPosition >= 0) {
      callback(input.slice(0, terminalPosition));
      return input.slice(terminalPosition);
    } else {
      callback(input);
      return "";
    }
  };
}

function acceptSpacing() {
  return function (input: string) {
    return input.trimStart();
  };
}

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      let valve: string;
      let flowRate: number;
      let nextValves: string[];

      pipe(
        line,
        acceptPrefix("Valve"),
        acceptSpacing(),
        acceptTerm([" "], (term) => {
          valve = term;
        }),
        acceptSpacing(),
        acceptPrefix("has flow rate="),
        acceptTerm([";"], (term) => {
          flowRate = parseInt(term, 10);
        }),
        acceptPrefix(";"),
        acceptSpacing(),
        acceptPrefix(["tunnels lead to", "tunnel leads to"]),
        acceptSpacing(),
        acceptPrefix(["valves", "valve"]),
        acceptSpacing(),
        acceptTerm([], (term) => {
          nextValves = term.split(", ");
        })
      );

      invariant(valve!);
      invariant(typeof flowRate! !== "undefined");
      invariant(!isNaN(flowRate));
      invariant(nextValves!);

      return {
        valve,
        flowRate,
        nextValves,
      };
    });
}

function getDistance<T>(graph: Map<T, T[]>, start: T, end: T) {
  const visited = new Set<T>();
  const queue: [T, number][] = [[start, 0]];

  while (queue.length > 0) {
    const [current, distance] = queue.shift()!;
    if (current === end) {
      return distance;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    const next = graph.get(current)!;
    next.forEach((next) => {
      queue.push([next, distance + 1]);
    });
  }

  return -1;
}

type State = {
  valve: string;
  elValve?: string;
  opened: Set<string>;
  time: number;
  log: string[];
};

function open() {
  return function (state: State): State {
    const opened = new Set(state.opened).add(state.valve);
    return {
      ...state,
      opened,
      time: state.time - 1,
      // log: [...state.log, `open ${state.valve}`],
    };
  };
}

function move(valve: string) {
  return function (state: State): State {
    return {
      ...state,
      valve,
      time: state.time - 1,
      // log: [...state.log, `move ${state.valve} -> ${valve}`],
    };
  };
}

function wait() {
  return function (state: State): State {
    return {
      ...state,
      time: state.time - 1,
      // log: [...state.log, `wait`],
    };
  };
}

function elOpen() {
  return function (state: State): State {
    const opened = new Set(state.opened).add(state.elValve!);
    return {
      ...state,
      opened,
    };
  };
}

function elMove(valve: string) {
  return function (state: State): State {
    return {
      ...state,
      elValve: valve,
    };
  };
}

function elWait() {
  return function (state: State): State {
    return state;
  };
}

function wanderAround(
  graph: Map<string, string[]>,
  flow: Map<string, number>,
  start: string,
  timeLeft: number
) {
  const cache: Map<string, readonly [number, string[]]> = new Map();

  function serialize(state: State) {
    return [
      state.valve,
      state.time,
      Array.from(state.opened).sort().join(","),
    ].join(":");
  }

  function iterate(state: State): readonly [number, string[]] {
    if (state.time === 0) {
      return [0, state.log] as const;
    }

    if (cache.has(serialize(state))) {
      return cache.get(serialize(state))!;
    }

    const rate = Array.from(state.opened.keys())
      .map((valve) => flow.get(valve)!)
      .reduce((a, b) => a + b, 0);

    if (
      Array.from(graph.keys())
        .filter((valve) => flow.get(valve)! > 0)
        .every((valve) => state.opened.has(valve))
    ) {
      const result = iterate(wait()(state));
      return [result[0] + rate, result[1]] as const;
    }

    const next = graph.get(state.valve)!;
    const results = next.map((v) => iterate(move(v)(state)));

    if (!state.opened.has(state.valve) && flow.get(state.valve)! > 0) {
      results.push(iterate(open()(state)));
    }

    const result = results.reduce((a, b) => {
      if (a[0] >= b[0]) {
        return a;
      }
      return b;
    });

    const cached = [result[0] + rate, result[1]] as const;
    cache.set(serialize(state), cached);
    return cached;
  }

  return iterate({
    valve: start,
    opened: new Set(),
    time: timeLeft,
    log: [],
  });
}

function wanderAroundWithElephant(
  graph: Map<string, string[]>,
  flow: Map<string, number>,
  start: string,
  timeLeft: number
) {
  const cache: Map<
    string,
    Map<string, readonly [number, string[]]>
  > = new Map();

  function serializeHash(state: State) {
    return [state.valve, state.elValve].join(":");
  }

  function serialize(state: State) {
    return [state.time, Array.from(state.opened).sort().join(",")].join(":");
  }

  function iterate(state: State): readonly [number, string[]] {
    if (state.time === 0) {
      return [0, state.log] as const;
    }

    if (cache.has(serializeHash(state))) {
      const table = cache.get(serializeHash(state))!;
      if (table.has(serialize(state))) {
        return table.get(serialize(state))!;
      }
    }

    const rate = Array.from(state.opened.keys())
      .map((valve) => flow.get(valve)!)
      .reduce((a, b) => a + b, 0);

    if (
      Array.from(graph.keys())
        .filter((valve) => flow.get(valve)! > 0)
        .every((valve) => state.opened.has(valve))
    ) {
      const result = iterate(pipe(state, wait(), elWait()));
      return [result[0] + rate, result[1]] as const;
    }

    const actions: Array<(state: State) => State> = [];
    const elActions: Array<(state: State) => State> = [];

    // my actions
    const next = graph.get(state.valve)!;
    actions.push(...next.map(move));

    if (!state.opened.has(state.valve) && flow.get(state.valve)! > 0) {
      actions.push(open());
    }

    // elephant actions
    const nextEl = graph.get(state.elValve!)!;
    elActions.push(...nextEl.map(elMove));

    if (
      !state.opened.has(state.elValve!) &&
      flow.get(state.elValve!)! > 0 &&
      // don't open the same valve
      state.valve !== state.elValve
    ) {
      elActions.push(elOpen());
    }

    const results = [];

    for (const action of actions) {
      for (const elAction of elActions) {
        results.push(iterate(pipe(state, action, elAction)));
      }
    }

    const result = results.reduce((a, b) => {
      if (a[0] >= b[0]) {
        return a;
      }
      return b;
    });

    const cached = [result[0] + rate, result[1]] as const;

    if (!cache.has(serializeHash(state))) {
      cache.set(serializeHash(state), new Map());
    }
    cache.get(serializeHash(state))!.set(serialize(state), cached);

    return cached;
  }

  return iterate({
    valve: start,
    elValve: start,
    opened: new Set(),
    time: timeLeft,
    log: [],
  });
}

async function main() {
  const input = await Deno.readTextFile("input.txt");
  const valves = parseInput(input);

  const graph = new Map<string, string[]>();
  const flow = new Map<string, number>();

  valves.forEach(function (valve) {
    graph.set(valve.valve, valve.nextValves);
    flow.set(valve.valve, valve.flowRate);
  });

  // const [result, log] = wanderAround(graph, flow, "AA", 30);
  // somehow log is BSing me, do not wanna debug it
  // console.log(log.join("\n"));
  // console.log(result);
  // console.log();

  console.log("With helpful elephant:");
  const [resultWithElephant, logWithElephant] = wanderAroundWithElephant(
    graph,
    flow,
    "AA",
    26
  );
  console.log(logWithElephant.join("\n"));
  console.log(resultWithElephant);
}

await main();
