import { makePage } from "@keystatic/astro/ui";
import config from "../../keystatic.config";

/** The Keystatic admin app, a client-only React component. */
export const Keystatic = makePage(config);
