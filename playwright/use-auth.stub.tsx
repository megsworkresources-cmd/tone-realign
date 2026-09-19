import { useState } from "react";

export interface AuthStubUser {
  name?: string;
  email?: string;
}

export interface AuthStubState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthStubUser | null;
}

/**
 * signIn behaviors. All plain strings — hooksConfig must survive Playwright's
 * serialization across the test-runner → browser boundary.
 *  - "ok" (default): resolves
 *  - "error": rejects (drives the friendly-error paths)
 *  - "error-on-second-call": rejects exactly the second call for that provider
 *    (send-code succeeds, verify-code fails, retry succeeds)
 */
export type SignInBehavior = "ok" | "error" | "error-on-second-call";

/**
 * CT-only stand-in for the real `@/hooks/use-auth` (Convex Auth), wired in via
 * the vite alias in playwright-ct.config.ts. Behavior is driven per mount
 * through hooksConfig → window.__authStub (installed by playwright/index.tsx).
 */
export interface AuthStubControls {
  /** Initial auth state when the component mounts. */
  initial: Partial<AuthStubState>;
  /** Behavior per provider id ("email-otp" | "anonymous"). */
  signIn: Record<string, SignInBehavior>;
}

declare global {
  interface Window {
    __authStub?: {
      controls: AuthStubControls;
      /**
       * Every signIn call, with FormData fields pre-extracted into plain
       * values so tests can assert on them via page.evaluate (FormData
       * itself cannot cross the Playwright serialization boundary).
       */
      calls: Array<{ provider: string; email?: string | null; code?: string | null }>;
    };
  }
}

const defaultState: AuthStubState = {
  isLoading: false,
  isAuthenticated: false,
  user: null,
};

export function useAuth() {
  const controls = window.__authStub!.controls;
  const calls = window.__authStub!.calls;
  const [state] = useState<AuthStubState>({ ...defaultState, ...controls.initial });

  const signIn = async (provider: string, ...args: unknown[]) => {
    const priorCount = calls.filter((c) => c.provider === provider).length;
    const record: { provider: string; email?: string | null; code?: string | null } = {
      provider,
    };
    const formData = args.find((a) => a instanceof FormData) as FormData | undefined;
    if (formData) {
      const email = formData.get("email");
      const code = formData.get("code");
      record.email = email === null ? null : String(email);
      record.code = code === null ? null : String(code);
    }
    calls.push(record);

    const behavior = controls.signIn[provider] ?? "ok";
    if (behavior === "error") {
      throw new Error(`stub signIn(${provider}) failed`);
    }
    if (behavior === "error-on-second-call" && priorCount === 1) {
      // Neutral message (no "expired"/"rate" keywords) so Auth's mapping
      // falls through to the generic OTP copy.
      throw new Error("Invalid code");
    }
  };

  const signOut = async () => {};

  return {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    signIn,
    signOut,
  };
}

export default useAuth;
