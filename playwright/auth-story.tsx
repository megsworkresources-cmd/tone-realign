import { MemoryRouter, Route, Routes } from "react-router";
import AuthPage from "@/pages/Auth";

/**
 * Where post-auth navigation should land. Lives in its own module (not the
 * test file) because the CT serializer can only mount components that are
 * importable through the component registry.
 */
export function PostAuthDestination() {
  return (
    <div data-testid="post-auth-destination">
      Signed in — dashboard
    </div>
  );
}

/**
 * Mountable harness mirroring main.tsx's route structure: /auth plus the
 * redirectAfterAuth destination, so component tests can assert the real
 * navigation instead of a leftover form.
 */
export default function AuthStory({ redirectAfterAuth = "/dashboard" }: { redirectAfterAuth?: string }) {
  return (
    <MemoryRouter initialEntries={["/auth"]}>
      <Routes>
        <Route
          path="/auth"
          element={<AuthPage redirectAfterAuth={redirectAfterAuth} />}
        />
        <Route path="/dashboard" element={<PostAuthDestination />} />
      </Routes>
    </MemoryRouter>
  );
}
