import { describe, expect, test } from "bun:test";
import {
  APP_ORDER,
  NAV_ITEMS,
  PAGE_ORDER,
  PUBLIC_ROUTES,
  appTourStops,
  tourStops,
} from "./site-nav";
import { readFileSync } from "node:fs";

describe("site nav config", () => {
  test("nav labels and paths are unique and well-formed", () => {
    const paths = NAV_ITEMS.map((n) => n.to);
    const labels = NAV_ITEMS.map((n) => n.label);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(labels).size).toBe(labels.length);
    for (const p of paths) {
      expect(p).toMatch(/^\/[a-z-]+$/);
    }
  });

  test("accent dots come from the theme palette", () => {
    const palette = /^bg-(sun|mint|coral|paper|card|secondary|ink)$/;
    for (const n of NAV_ITEMS) {
      expect(n.dot).toMatch(palette);
    }
  });
});

describe("page tour (back/forward pager)", () => {
  test("tour covers every public route exactly once, in order", () => {
    const tourPaths = PAGE_ORDER.map((p) => p.to);
    expect(new Set(tourPaths).size).toBe(tourPaths.length);
    expect(tourPaths).toEqual(PUBLIC_ROUTES);
  });

  test("every tour stop has a label and a blurb", () => {
    for (const stop of PAGE_ORDER) {
      expect(stop.label.length).toBeGreaterThan(0);
      expect(stop.blurb.length).toBeGreaterThan(0);
    }
  });

  test("tourStops: middle page has both neighbors", () => {
    const { prev, next } = tourStops("/tone-check");
    expect(prev?.to).toBe("/how");
    expect(next?.to).toBe("/drills");
  });

  test("tourStops: home opens the tour (no back), library closes it (no next)", () => {
    const home = tourStops("/");
    expect(home.prev).toBeNull();
    expect(home.next?.to).toBe("/how");
    const library = tourStops("/library");
    expect(library.prev?.to).toBe("/watch");
    expect(library.next).toBeNull();
  });

  test("watch sits between drills and library", () => {
    const watch = tourStops("/watch");
    expect(watch.prev?.to).toBe("/drills");
    expect(watch.next?.to).toBe("/library");
    const drills = tourStops("/drills");
    expect(drills.next?.to).toBe("/watch");
  });

  test("every public page renders the pager", () => {
    for (const page of ["Home", "HowItWorks", "ToneCheck", "Drills", "Watch", "Library"]) {
      const src = readFileSync(new URL(`../pages/${page}.tsx`, import.meta.url), "utf8");
      expect(src).toContain("PagePager");
    }
  });
});

describe("app tour (signed-in pager)", () => {
  test("app tour covers the seven nav destinations exactly once", () => {
    const paths = APP_ORDER.map((p) => p.to);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toEqual([
      "/dashboard",
      "/gym",
      "/calm",
      "/translate",
      "/quiz",
      "/reframe",
      "/progress",
    ]);
  });

  test("every stop has a label and a blurb", () => {
    for (const stop of APP_ORDER) {
      expect(stop.label.length).toBeGreaterThan(0);
      expect(stop.blurb.length).toBeGreaterThan(0);
    }
  });

  test("appTourStops: middle pages get their neighbors", () => {
    expect(appTourStops("/gym").prev?.to).toBe("/dashboard");
    expect(appTourStops("/gym").next?.to).toBe("/calm");
    expect(appTourStops("/translate").prev?.to).toBe("/calm");
    expect(appTourStops("/translate").next?.to).toBe("/quiz");
    expect(appTourStops("/quiz").prev?.to).toBe("/translate");
    expect(appTourStops("/quiz").next?.to).toBe("/reframe");
    expect(appTourStops("/reframe").next?.to).toBe("/progress");
  });

  test("the circuit wraps: dashboard's back is progress, progress's next is dashboard", () => {
    expect(appTourStops("/dashboard").prev?.to).toBe("/progress");
    expect(appTourStops("/progress").next?.to).toBe("/dashboard");
  });

  test("practice routes resolve via prefix: back to dashboard, next to gym", () => {
    const { prev, next } = appTourStops("/practice/steady-ground");
    expect(prev?.to).toBe("/dashboard");
    expect(next?.to).toBe("/gym");
  });

  test("unknown routes get no pager (renders nothing)", () => {
    const { prev, next } = appTourStops("/nowhere");
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  test("AppShell renders the pager on every signed-in page", () => {
    for (const page of ["Dashboard", "Gym", "Calm", "Practice", "Translate", "Quiz", "Reframe", "Progress"]) {
      const src = readFileSync(new URL(`../pages/${page}.tsx`, import.meta.url), "utf8");
      expect(src).toContain("AppShell");
    }
  });
});

describe("nav ↔ router parity", () => {
  test("every nav path is registered as a route in main.tsx", () => {
    const main = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
    for (const path of PUBLIC_ROUTES) {
      const routeDecl = path === "/" ? 'path="/"' : `path="${path}"`;
      expect(main).toContain(routeDecl);
    }
  });

  test("the authed routes still exist (no accidental removal)", () => {
    const main = readFileSync(new URL("../main.tsx", import.meta.url), "utf8");
    for (const path of ["/auth", "/dashboard", "/gym", "/calm", "/progress", "/reframe", "/quiz", "/practice/:drillId"]) {
      expect(main).toContain(`path="${path}"`);
    }
  });
});

describe("layout wiring", () => {
  test("PublicLayout is used by all six public pages", () => {
    for (const page of ["Home", "HowItWorks", "ToneCheck", "Drills", "Watch", "Library"]) {
      const src = readFileSync(
        new URL(`../pages/${page}.tsx`, import.meta.url),
        "utf8",
      );
      expect(src).toContain("PublicLayout");
    }
  });

  test("Landing remains a pure re-export of Home (the / route contract)", () => {
    const src = readFileSync(new URL("../pages/Landing.tsx", import.meta.url), "utf8");
    expect(src.trim()).toBe('export { default } from "./Home";');
  });
});
