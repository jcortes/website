import type { Page } from "@playwright/test";

/** A labelled page section (`<section aria-labelledby>`) by its exact name. */
export const section = (page: Page, name: string) =>
  page.getByRole("region", { name, exact: true });
