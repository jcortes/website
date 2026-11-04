import type { GitHubConfig } from "@keystatic/core";

/**
 * Where the online admin panel commits: this repository's default branch,
 * whose pushes CI deploys (docs/adr/0004-keystatic-admin-in-github-mode.md).
 * Shared by keystatic.config.ts and the API function, which needs only this.
 */
export const githubStorage = {
  kind: "github",
  repo: { owner: "jcortes", name: "website" },
} satisfies GitHubConfig["storage"];
