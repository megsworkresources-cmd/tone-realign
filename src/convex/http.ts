import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { SOURCE_ZIP_B64 } from "./_sourceSnapshot";

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
  handler: httpAction(async (_ctx, request) => {
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
  }),
});

auth.addHttpRoutes(http);

/**
 * Ops route: serves the packaged source snapshot (shiftedtone-source.zip)
 * so it can be downloaded by the Codespace push flow without any preview
 * URL or GitHub token. Unauthenticated by design (the zip contains no
 * secrets — see scripts/make-source-zip.py); remove together with the
 * /push-source tooling after the source lands (LAUNCH.md §5).
 */
http.route({
  path: "/source-zip",
  method: "GET",
  handler: httpAction(async () => {
    // No Buffer in the default V8 runtime — decode base64 via web APIs.
    const bin = atob(SOURCE_ZIP_B64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="shiftedtone-source.zip"',
        "Content-Length": String(bytes.length),
        "Cache-Control": "no-store",
      },
    });
  }),
});

export default http;
