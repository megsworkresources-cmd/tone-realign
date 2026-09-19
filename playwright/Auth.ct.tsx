import { MemoryRouter, Route, Routes } from "react-router";
import AuthPage from "@/pages/Auth";
import { GUEST_UNAVAILABLE_ERROR } from "@/lib/auth-errors";
import { test, expect } from "@playwright/experimental-ct-react";
import type { AuthStubControls } from "./use-auth.stub";
import type { HooksConfig } from "./hooks-config";

/**
 * Component tests for src/pages/Auth.tsx against a stubbed useAuth — no
 * Convex backend, no real provider. The stub is installed per-mount through
 * hooksConfig (playwright/index.tsx → window.__authStub) and records every
 * signIn call for assertion.
 *
 * The MemoryRouter + Routes harness mirrors main.tsx: post-auth navigation
 * leaves /auth for the destination route, so tests can assert the real
 * navigation instead of a leftover form.
 */

const DESTINATION_TESTID = "post-auth-destination";

function SignedInDestination() {
  return <div data-testid={DESTINATION_TESTID}>Signed in — dashboard</div>;
}

function hooksConfigFor(
  overrides: Partial<AuthStubControls>,
): { hooksConfig: HooksConfig } {
  return {
    hooksConfig: {
      authStub: {
        initial: { isLoading: false, isAuthenticated: false, user: null },
        signIn: {},
        ...overrides,
      },
    },
  };
}

/** The mounted element plus its mount options, kept together. */
function authStory(
  overrides: Partial<AuthStubControls> = {},
  props: { redirectAfterAuth?: string } = { redirectAfterAuth: "/dashboard" },
) {
  return {
    element: (
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage {...props} />} />
          <Route path="/dashboard" element={<SignedInDestination />} />
        </Routes>
      </MemoryRouter>
    ),
    options: hooksConfigFor(overrides),
  };
}

const emailInput = (page: import("@playwright/experimental-ct-react").Page) =>
  page.getByPlaceholder("name@example.com");
const continueButton = (page: import("@playwright/experimental-ct-react").Page) =>
  // Exact match: /continue/i alone also hits the guest button.
  page.getByRole("button", { name: "Continue", exact: true });
const verifyButton = (page: import("@playwright/experimental-ct-react").Page) =>
  page.getByRole("button", { name: /that's the one/i });
const otpInput = (page: import("@playwright/experimental-ct-react").Page) =>
  page.locator("[data-input-otp]");

const recordedCalls = (page: import("@playwright/experimental-ct-react").Page) =>
  page.evaluate(() => window.__authStub?.calls ?? []);

test.describe("Auth page (component tests)", () => {
  test("email step: happy path moves to the OTP screen", async ({ mount }) => {
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await expect(emailInput(page)).toBeVisible();
    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();

    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(page.getByText(/rider@example\.com/)).toBeVisible();
  });

  test("email step: address that passes native validation but fails the app's check shows the friendly error", async ({
    mount,
  }) => {
    // "a@b" is accepted by the browser's type=email validation but rejected
    // by the defensive EMAIL_PATTERN — exactly the layer the handler adds.
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await emailInput(page).fill("a@b");
    await continueButton(page).click();

    await expect(page.getByText(/doesn't look right/i)).toBeVisible();
    expect(await recordedCalls(page)).toHaveLength(0);
    // Still on the email step.
    await expect(emailInput(page)).toBeVisible();
  });

  test("email step: send failure shows friendly error and the button recovers", async ({
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { "email-otp": "error" },
    });
    const { page } = await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();

    await expect(
      page.getByText(/Something went wrong sending your verification code/i),
    ).toBeVisible();
    // finally-reset: never stuck in the loading state.
    await expect(continueButton(page)).toBeEnabled();
    await expect(emailInput(page)).toBeVisible();
    // Only the failed attempt was recorded; no navigation happened.
    expect(await recordedCalls(page)).toHaveLength(1);
    await expect(page.getByTestId(DESTINATION_TESTID)).toBeHidden();
  });

  test("OTP step: Verify enables only at six digits and submits the code", async ({
    mount,
  }) => {
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();

    await expect(verifyButton(page)).toBeDisabled();
    await otpInput(page).pressSequentially("1234");
    await expect(verifyButton(page)).toBeDisabled(); // four digits is not enough
    await otpInput(page).pressSequentially("56");
    await expect(verifyButton(page)).toBeEnabled();

    await verifyButton(page).click();
    const calls = await recordedCalls(page);
    expect(calls).toHaveLength(2); // send + verify
    expect(calls[0]).toMatchObject({
      provider: "email-otp",
      email: "rider@example.com",
    });
    expect(calls[1]).toMatchObject({
      provider: "email-otp",
      email: "rider@example.com",
      code: "123456",
    });
  });

  test("OTP step: wrong code shows friendly error, clears, then retry succeeds", async ({
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { "email-otp": "error-on-second-call" },
    });
    const { page } = await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();

    await otpInput(page).pressSequentially("000000");
    await verifyButton(page).click();

    await expect(page.getByText(/That code didn't work/i)).toBeVisible();
    await expect(otpInput(page)).toHaveValue(""); // cleared for the retry

    await otpInput(page).pressSequentially("123456");
    await verifyButton(page).click();
    await expect(page.getByText(/That code didn't work/i)).toBeHidden();
    const calls = await recordedCalls(page);
    expect(calls).toHaveLength(3); // send, failed verify, successful retry
  });

  test("OTP step: Enter submits only with six digits", async ({ mount }) => {
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();

    await otpInput(page).pressSequentially("123");
    await otpInput(page).press("Enter");
    let calls = await recordedCalls(page);
    expect(calls).toHaveLength(1); // only the send call — Enter was a no-op

    await otpInput(page).pressSequentially("456");
    await otpInput(page).press("Enter");
    calls = await recordedCalls(page);
    expect(calls).toHaveLength(2);
    expect(calls[1].code).toBe("123456");
  });

  test("OTP step: go back returns to a clean email form", async ({ mount }) => {
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    await otpInput(page).pressSequentially("999");

    await page.getByRole("button", { name: /go back/i }).click();

    await expect(emailInput(page)).toBeVisible();
    // Returning to the email screen and coming back starts with an empty code.
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(verifyButton(page)).toBeDisabled();
    expect(await recordedCalls(page)).toHaveLength(2); // two sends, no verifies
  });

  test("guest login: success navigates to the post-auth destination", async ({
    mount,
  }) => {
    const { element, options } = authStory();
    const { page } = await mount(element, options);

    await page.getByRole("button", { name: /continue as guest/i }).click();

    const calls = await recordedCalls(page);
    expect(calls).toHaveLength(1);
    expect(calls[0].provider).toBe("anonymous");
    await expect(page.getByTestId(DESTINATION_TESTID)).toBeVisible();
  });

  test("guest login: unavailable shows the clean message, not the raw error", async ({
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { anonymous: "error" },
    });
    const { page } = await mount(element, options);

    await page.getByRole("button", { name: /continue as guest/i }).click();

    await expect(page.getByText(GUEST_UNAVAILABLE_ERROR)).toBeVisible();
    await expect(page.getByText(/stub signIn/)).toBeHidden();
    await expect(page.getByTestId(DESTINATION_TESTID)).toBeHidden();
  });

  test("already signed in: leaves /auth instead of showing the email form", async ({
    mount,
  }) => {
    const { element, options } = authStory({
      initial: { isLoading: false, isAuthenticated: true, user: null },
    });
    const { page } = await mount(element, options);

    await expect(page.getByTestId(DESTINATION_TESTID)).toBeVisible();
    await expect(emailInput(page)).toBeHidden();
  });
});
