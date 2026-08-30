/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    {
      name: "no-unresolved-imports",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-runtime-circular-dependencies",
      severity: "error",
      from: {},
      to: {
        circular: true,
        viaOnly: { dependencyTypesNot: ["type-only"] },
      },
    },
    {
      name: "no-production-to-test-spec",
      severity: "error",
      from: { path: "^src/" },
      to: {
        path: "(^|/)(?:tests?|specs?)(?:/|$)|[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$",
      },
    },
    {
      name: "no-production-runtime-to-dev-dependency",
      severity: "error",
      from: { path: "^src/" },
      to: {
        dependencyTypes: ["npm-dev"],
        dependencyTypesNot: ["type-only"],
      },
    },
    {
      name: "no-undeclared-external-package",
      severity: "error",
      from: {},
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: "specify",
    skipAnalysisNotInRules: true,
  },
};
