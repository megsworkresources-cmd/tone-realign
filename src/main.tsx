import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import "./types/global.d.ts";
import { trackPageview } from "@/lib/analytics";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const HowItWorks = lazy(() => import("./pages/HowItWorks.tsx"));
const ToneCheck = lazy(() => import("./pages/ToneCheck.tsx"));
const DrillsPage = lazy(() => import("./pages/Drills.tsx"));
const Watch = lazy(() => import("./pages/Watch.tsx"));
const Library = lazy(() => import("./pages/Library.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Gym = lazy(() => import("./pages/Gym.tsx"));
const Calm = lazy(() => import("./pages/Calm.tsx"));
const Progress = lazy(() => import("./pages/Progress.tsx"));
const Practice = lazy(() => import("./pages/Practice.tsx"));
const Reframe = lazy(() => import("./pages/Reframe.tsx"));
const Quiz = lazy(() => import("./pages/Quiz.tsx"));
const Translate = lazy(() => import("./pages/Translate.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

// The Convex deployment the platform manages and pushes this project's
// functions to (bun convex dev --once targets it; the URL is public by design
// — it appears in every build log — so embedding it is safe).
//
// We deliberately do NOT read VITE_CONVEX_URL here: the value configured on
// the hosting target points at a retired deployment (happy-otter-123) that no
// longer serves the API, which broke every client at boot. Hardcoding the
// live deployment makes the build correct regardless of the host's env.
// To restore env-based overrides, fix VITE_CONVEX_URL first, then reintroduce
// `(import.meta.env.VITE_CONVEX_URL as string | undefined) ||` above the URL.
const CONVEX_URL = "https://amiable-shrimp-189.convex.cloud";

const convex = new ConvexReactClient(CONVEX_URL);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <RouteSyncer />
          <ScrollToTop />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/how" element={<HowItWorks />} />
              <Route path="/tone-check" element={<ToneCheck />} />
              <Route path="/drills" element={<DrillsPage />} />
              <Route path="/watch" element={<Watch />} />
              <Route path="/library" element={<Library />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/gym"
                element={
                  <RequireAuth>
                    <Gym />
                  </RequireAuth>
                }
              />
              <Route
                path="/calm"
                element={
                  <RequireAuth>
                    <Calm />
                  </RequireAuth>
                }
              />
              <Route
                path="/progress"
                element={
                  <RequireAuth>
                    <Progress />
                  </RequireAuth>
                }
              />
              <Route
                path="/practice/:drillId"
                element={
                  <RequireAuth>
                    <Practice />
                  </RequireAuth>
                }
              />
              <Route
                path="/reframe"
                element={
                  <RequireAuth>
                    <Reframe />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz"
                element={
                  <RequireAuth>
                    <Quiz />
                  </RequireAuth>
                }
              />
              <Route
                path="/translate"
                element={
                  <RequireAuth>
                    <Translate />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
    <Analytics />
  </StrictMode>,
);
