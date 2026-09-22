import { httpRouter } from "convex/server";
import { auth } from "./auth";

const ALLOWED_ORIGINS = new Set([
  "https://shiftedtone.com",
  "https://www.shiftedtone.com",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
]);

function resolveAllowedOrigin(request: Request): string | null {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return null;

  try {
    const origin = new URL(originHeader).origin;
    if (ALLOWED_ORIGINS.has(origin)) return origin;

    const configuredSite = process.env.CONVEX_SITE_URL ?? process.env.SITE_URL;
    if (configuredSite && origin === new URL(configuredSite).origin) {
      return origin;
    }

    return null;
  } catch {
    return null;
  }
}

const http = httpRouter();

http.route({
  path: "/__cors",
  method: "OPTIONS",
  handler: async (_ctx, request) => {
    const origin = resolveAllowedOrigin(request);

    if (!origin) {
      return new Response("Origin not allowed", {
        status: 403,
      });
    }

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  },
});

auth.addHttpRoutes(http);

export default http;
