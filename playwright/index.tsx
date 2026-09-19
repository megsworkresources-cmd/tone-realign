import "../src/index.css";
import { useLayoutEffect, type ReactNode } from "react";
import { beforeMount } from "@playwright/experimental-ct-react/hooks";
import type { HooksConfig } from "./hooks-config";

export type { HooksConfig };

/**
 * Per-mount setup, driven by the `hooksConfig` passed to `test.mount()`:
 *  - paints a white canvas (Auth's ink/paper panels need contrast for
 *    visibility assertions on the CT default transparent body),
 *  - installs the CT use-auth stub controls into `window.__authStub`.
 *
 * The stub assignment happens during render — the stub module reads it while
 * the mounted component renders, which is before any effects run.
 */
beforeMount(async ({ hooksConfig, App }) => {
  const config = (hooksConfig ?? {}) as HooksConfig;

  const PreparedApp = ({ children }: { children?: ReactNode }) => {
    if (config.authStub) {
      window.__authStub = { controls: config.authStub, calls: [] };
    }
    useLayoutEffect(() => {
      document.body.style.background = "#ffffff";
    }, []);
    return <App>{children}</App>;
  };

  return <PreparedApp />;
});
