import type { AuthStubControls } from "./use-auth.stub";

/**
 * What tests pass as hooksConfig to test.mount(). The wrapper in index.tsx
 * installs it into window.__authStub before the mounted component renders.
 */
export interface HooksConfig {
  authStub?: AuthStubControls;
}
