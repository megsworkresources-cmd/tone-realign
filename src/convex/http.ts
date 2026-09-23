import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { corsHeaders, resolveAllowedOrigin } from "../lib/cors-allowlist";

const http = httpRouter();

http.route({
  path: "/__cors",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    const origin = resolveAllowedOrigin(request.headers.get("origin"), {
      CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
      SITE_URL: process.env.SITE_URL,
    });

    if (!origin) {
      return new Response("Origin not allowed", {
        status: 403,
      });
    }

    return new Response(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }),
});

auth.addHttpRoutes(http);

export default http;
