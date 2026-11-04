import type { APIRoute } from "astro";
import { cvResponse } from "../../../cv/endpoint";

export const GET: APIRoute = () => cvResponse("en");
