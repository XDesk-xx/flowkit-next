import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const PRODUCTION_ROOTS = [
  "src/cli/entrypoint.ts",
  "src/domain/index.ts",
];

const CURRENT_FILE = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(CURRENT_FILE), "..");

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function requireObject(value, message) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(message);
  }
  return value;
}

export function analyzeProductionReachability(graph, roots = PRODUCTION_ROOTS) {
  const graphObject = requireObject(
    graph,
    "dependency-cruiser graph must be an object",
  );
  if (!Array.isArray(graphObject.modules)) {
    throw new Error("dependency-cruiser graph.modules must be an array");
  }

  const modules = new Map();

  for (const rawModule of graphObject.modules) {
    const module = requireObject(
      rawModule,
      "dependency-cruiser module must be an object",
    );
    if (typeof module.source !== "string" || module.source.length === 0) {
      throw new Error(
        "dependency-cruiser module.source must be a non-empty string",
      );
    }
    if (!Array.isArray(module.dependencies)) {
      throw new Error(
        `dependency-cruiser module.dependencies must be an array: ${module.source}`,
      );
    }

    const source = normalizePath(module.source);
    if (!source.startsWith("src/")) continue;
    if (modules.has(source)) {
      throw new Error(
        `dependency-cruiser graph contains duplicate module: ${source}`,
      );
    }

    const dependencies = [];
    for (const rawDependency of module.dependencies) {
      const dependency = requireObject(
        rawDependency,
        `dependency-cruiser dependency must be an object: ${source}`,
      );
      if (dependency.resolved === undefined || dependency.resolved === null)
        continue;
      if (typeof dependency.resolved !== "string") {
        throw new Error(
          `dependency-cruiser dependency.resolved must be a string: ${source}`,
        );
      }

      const resolved = normalizePath(dependency.resolved);
      if (resolved.startsWith("src/")) dependencies.push(resolved);
    }

    modules.set(source, dependencies);
  }

  const normalizedRoots = roots.map(normalizePath);
  for (const root of normalizedRoots) {
    if (!modules.has(root)) {
      throw new Error(`production root missing from dependency graph: ${root}`);
    }
  }

  const reachable = new Set();
  const pending = [...normalizedRoots];

  while (pending.length > 0) {
    const source = pending.pop();
    if (reachable.has(source)) continue;

    const dependencies = modules.get(source);
    if (!dependencies) {
      throw new Error(
        `reachable local src dependency missing from graph: ${source}`,
      );
    }

    reachable.add(source);
    for (const dependency of dependencies) {
      if (!modules.has(dependency)) {
        throw new Error(
          `resolved local src dependency missing from graph: ${dependency}`,
        );
      }
      if (!reachable.has(dependency)) pending.push(dependency);
    }
  }

  const allSources = [...modules.keys()].sort();
  const unreachable = allSources.filter((source) => !reachable.has(source));

  return {
    total: allSources.length,
    reachable: [...reachable].sort(),
    unreachable,
  };
}

export function readDependencyGraph(projectRoot = PROJECT_ROOT) {
  const dependencyCruiserCli = path.join(
    projectRoot,
    "node_modules",
    "dependency-cruiser",
    "bin",
    "dependency-cruise.mjs",
  );

  const result = spawnSync(
    process.execPath,
    [
      dependencyCruiserCli,
      "--config",
      "dependency-cruiser.config.mjs",
      "--output-type",
      "json",
      "src",
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 16 * 1024 * 1024,
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = (
      result.stderr ||
      result.stdout ||
      "dependency-cruiser failed"
    ).trim();
    throw new Error(`dependency-cruiser graph extraction failed: ${detail}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`dependency-cruiser returned malformed JSON: ${detail}`);
  }
}

export function runEntropyCheck(projectRoot = PROJECT_ROOT) {
  const graph = readDependencyGraph(projectRoot);
  return analyzeProductionReachability(graph);
}

function main() {
  try {
    const result = runEntropyCheck();
    if (result.unreachable.length > 0) {
      process.stderr.write("Unreachable production source modules:\n");
      for (const source of result.unreachable)
        process.stderr.write(`- ${source}\n`);
      process.exitCode = 1;
      return;
    }

    process.stdout.write(
      `Repository entropy hygiene: ${result.reachable.length}/${result.total} production modules reachable.\n`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `Repository entropy hygiene failed closed: ${message}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  main();
}
