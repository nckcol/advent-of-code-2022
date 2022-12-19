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

type Material = "ore" | "clay" | "obsidian" | "geode";

type RecipeComponent = {
  material: Material;
  amount: number;
};

type Recipe = RecipeComponent[];

function parseInput(input: string) {
  return input
    .split("\n")
    .filter(Boolean)
    .map((row) => {
      let valve: string;
      let flowRate: number;
      let nextValves: string[];
      let ore: Recipe;
      let clay: Recipe;
      let obsidian: Recipe;
      let geode: Recipe;

      const acceptTitle = (input: string) =>
        pipe(
          input,
          acceptPrefix("Blueprint"),
          acceptSpacing(),
          acceptTerm([":"], () => {}),
          acceptPrefix(":")
        );

      const acceptOreRobot = (input: string) =>
        pipe(
          input,
          acceptPrefix("Each ore robot costs"),
          acceptSpacing(),
          acceptTerm(["."], (term) => {
            const recipe = term.split(" and ");
            ore = recipe.map((component) => {
              const [amount, material] = component.split(" ");
              return {
                material: material as Material,
                amount: parseInt(amount, 10),
              };
            });
          }),
          acceptPrefix(".")
        );

      const acceptClayRobot = (input: string) =>
        pipe(
          input,
          acceptPrefix("Each clay robot costs"),
          acceptSpacing(),
          acceptTerm(["."], (term) => {
            const recipe = term.split(" and ");
            clay = recipe.map((component) => {
              const [amount, material] = component.split(" ");
              return {
                material: material as Material,
                amount: parseInt(amount, 10),
              };
            });
          }),
          acceptPrefix(".")
        );

      const acceptObsidianRobot = (input: string) =>
        pipe(
          input,
          acceptPrefix("Each obsidian robot costs"),
          acceptSpacing(),
          acceptTerm(["."], (term) => {
            const recipe = term.split(" and ");
            obsidian = recipe.map((component) => {
              const [amount, material] = component.split(" ");
              return {
                material: material as Material,
                amount: parseInt(amount, 10),
              };
            });
          }),
          acceptPrefix(".")
        );

      const acceptGeodeRobot = (input: string) =>
        pipe(
          input,
          acceptPrefix("Each geode robot costs"),
          acceptSpacing(),
          acceptTerm(["."], (term) => {
            const recipe = term.split(" and ");
            geode = recipe.map((component) => {
              const [amount, material] = component.split(" ");
              return {
                material: material as Material,
                amount: parseInt(amount, 10),
              };
            });
          }),
          acceptPrefix(".")
        );

      pipe(
        row,
        acceptTitle,
        acceptSpacing(),
        acceptOreRobot,
        acceptSpacing(),
        acceptClayRobot,
        acceptSpacing(),
        acceptObsidianRobot,
        acceptSpacing(),
        acceptGeodeRobot
      );

      invariant(ore!);
      invariant(clay!);
      invariant(obsidian!);
      invariant(geode!);

      return {
        ore,
        clay,
        obsidian,
        geode,
      };
    });
}

type Blueprint = Record<Material, Recipe>;

type State = {
  robots: Record<Material, number>;
  materials: Record<Material, number>;
};

const MATERIALS = ["ore", "clay", "obsidian", "geode"] as const;

function collectMaterials() {
  return function (state: State): State {
    return {
      ...state,
      materials: MATERIALS.reduce(function (materials, material) {
        return {
          ...materials,
          [material]: state.materials[material] + state.robots[material],
        };
      }, state.materials),
    };
  };
}

function createRobot(material: Material, recipe: Recipe) {
  return function (state: State): State {
    return {
      ...state,
      robots: {
        ...state.robots,
        [material]: state.robots[material] + 1,
      },
      materials: recipe.reduce(function (materials, component) {
        return {
          ...materials,
          [component.material]:
            materials[component.material] - component.amount,
        };
      }, state.materials),
    };
  };
}

function wait() {
  return function (state: State): State {
    return state;
  };
}

function sufficientMaterials(state: State, recipe: Recipe) {
  return recipe.every(
    (component) => state.materials[component.material] >= component.amount
  );
}

function isRobotNeeded(blueprint: Blueprint, state: State, material: Material) {
  if (material === "geode") {
    return true;
  }
  const materialPerStep = state.robots[material];
  const maxRecipeMaterial = Math.max(
    ...MATERIALS.map((material) => blueprint[material]).map(
      (recipe) =>
        recipe.find((component) => component.material === material)?.amount ?? 0
    )
  );

  return materialPerStep < maxRecipeMaterial;
}

function simulate(blueprint: Blueprint, initialState: State, time: number) {
  function iterate(state: State, time: number): State {
    if (time === 0) {
      return state;
    }

    if (sufficientMaterials(state, blueprint["geode"])) {
      return iterate(
        pipe(
          state,
          collectMaterials(),
          createRobot("geode", blueprint["geode"])
        ),
        time - 1
      );
    }

    const actions = MATERIALS.map(
      (material) => [material, blueprint[material]] as const
    )
      .filter(([_material, recipe]) => sufficientMaterials(state, recipe))
      .filter(([material]) => isRobotNeeded(blueprint, state, material))
      .map(([material, recipe]) => createRobot(material, recipe));

    if (!actions.length) {
      return iterate(collectMaterials()(state), time - 1);
    }

    actions.unshift(wait());

    return actions
      .map((action) =>
        iterate(pipe(state, collectMaterials(), action), time - 1)
      )
      .reduce((stateA: State, stateB: State) => {
        if (stateA.materials.geode > stateB.materials.geode) {
          return stateA;
        }

        return stateB;
      });
  }

  return iterate(initialState, time);
}

function maximizeGeodes(
  blueprint: Blueprint,
  initialState: State,
  maxTime: number
) {
  const maxByTime: Map<number, number> = new Map();
  const queue: Array<readonly [State, number]> = [[initialState, 0] as const];
  const maxRobots: Record<Material, number> = MATERIALS.map(
    (material) => blueprint[material]
  )
    .flat()
    .reduce(
      (max, component) => {
        if (component.material === "geode") {
          return max;
        }
        return {
          ...max,
          [component.material]: Math.max(
            max[component.material],
            component.amount
          ),
        };
      },
      {
        ore: 0,
        clay: 0,
        obsidian: 0,
        geode: Infinity,
      }
    );

  while (queue.length) {
    const [state, time] = queue.shift()!;
    const maxGeodes = maxByTime.get(time) ?? 0;
    // console.log(time, state);

    if (state.materials.geode < maxGeodes) {
      continue;
    }

    maxByTime.set(time, state.materials.geode);

    if (time === maxTime) {
      continue;
    }

    if (sufficientMaterials(state, blueprint["geode"])) {
      queue.push([
        pipe(
          state,
          collectMaterials(),
          createRobot("geode", blueprint["geode"])
        ),
        time + 1,
      ]);
      continue;
    }

    for (const material of MATERIALS) {
      if (state.robots[material] >= maxRobots[material]) {
        continue;
      }

      if (sufficientMaterials(state, blueprint[material])) {
        queue.push([
          pipe(
            state,
            collectMaterials(),
            createRobot(material, blueprint[material])
          ),
          time + 1,
        ]);
      } else {
        // wait for materials to be sufficient
        let fastForwardTime = 0;
        blueprint[material].forEach((component) => {
          if (!state.robots[component.material]) {
            fastForwardTime = Infinity;
            return;
          }
          const shortage =
            component.amount - state.materials[component.material];

          fastForwardTime = Math.max(
            fastForwardTime,
            Math.ceil(shortage / state.robots[component.material])
          );
        });

        if (time + fastForwardTime + 1 > maxTime) {
          continue;
        }

        let fastForwardState: State = state;
        for (let i = 0; i < fastForwardTime; i++) {
          fastForwardState = pipe(fastForwardState, collectMaterials());
        }

        queue.push([
          pipe(
            fastForwardState,
            collectMaterials(),
            createRobot(material, blueprint[material])
          ),
          time + fastForwardTime + 1,
        ]);
      }
    }
  }

  return maxByTime.get(maxTime)!;
}

async function main() {
  const input = await Deno.readTextFile("./input.txt");
  const robotBlueprints = parseInput(input);

  const initialState: State = {
    robots: {
      ore: 1,
      clay: 0,
      obsidian: 0,
      geode: 0,
    },
    materials: {
      ore: 0,
      clay: 0,
      obsidian: 0,
      geode: 0,
    },
  };

  const sum = robotBlueprints
    .map(
      (blueprint, index) =>
        (index + 1) * maximizeGeodes(blueprint, initialState, 24)
    )
    .reduce((a, b) => a + b, 0);

  console.log("Part 1:", sum);

  const mult = robotBlueprints
    .slice(0, 3)
    .map((blueprint, index) => {
      const maxGeodes = maximizeGeodes(blueprint, initialState, 32);
      return maxGeodes;
    })
    .reduce((a, b) => a * b);

  console.log("Part 2:", mult);
}

await main();
