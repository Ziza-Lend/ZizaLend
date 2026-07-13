module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 120],
    "header-max-length": [2, "always", 100],
    "scope-enum": [
      2,
      "always",
      [
        "frontend",
        "backend",
        "contracts",
        "scripts",
        "docs",
        "readme",
        "e2e",
        "sdk",
        "infra",
        "ci",
        "deps",
        "release",
      ],
    ],
  },
};
