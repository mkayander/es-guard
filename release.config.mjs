const config = {
  branches: ["main", "next"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
      },
    ],
    "@semantic-release/npm",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "pnpm-lock.lock"],
      },
    ],
    "@semantic-release/github",
  ],
};

export default config;
