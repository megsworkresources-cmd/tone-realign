import { test, expect } from "@playwright/experimental-ct-react";
import type { Page } from "@playwright/experimental-ct-react";
import AuthStory from "./auth-story";
import type { AuthStubControls } from "./use-auth.stub";
import type { HooksConfig } from "./hooks-config";

/**
 * Component tests for src/pages/Auth.tsx against a stubbed useAuth — no
 * Convex backend, no real provider. The stub is installed per mount through
 * hooksConfig (playwright/index.tsx → window.__authStub) and records every
 * signIn call for assertion.
 */

const DESTINATION = "post-auth-destination";

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

function authStory(overrides: Partial<AuthStubControls> = {}) {
  return {
    element: <AuthStory redirectAfterAuth="/dashboard" />,
    options: hooksConfigFor(overrides),
  };
}

const emailInput = (page: Page) => page.getByPlaceholder("name@example.com");
const continueButton = (page: Page) =>
  // Exact match: /continue/i alone also hits the guest button.
  page.getByRole("button", { name: "Continue", exact: true });
const verifyButton = (page: Page) =>
  page.getByRole("button", { name: /that's the one/i });
const otpInput = (page: Page) => page.locator("[data-input-otp]");

const recordedCalls = (page: Page) =>
  page.evaluate(() => window.__authStub?.calls ?? []);

test.describe("Auth page (component tests)", () => {
  test("email step: happy path moves to the OTP screen", async ({ page, mount }) => {
    const { element, options } = authStory();
    await mount(element, options);

    await expect(emailInput(page)).toBeVisible();
    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();

    await expect(page.getByText("Check your email")).toBeVisible();
    await expect(page.getByText(/rider@example\.com/)).toBeVisible();
  });

  test("email step: address passing native validation but failing the app check shows the friendly error", async ({
    page,
    mount,
  }) => {
    // "a@b" passes the browser's type=email validation but fails the
    // defensive EMAIL_PATTERN — exactly the layer the handler adds.
    const { element, options } = authStory();
    await mount(element, options);

    await emailInput(page).fill("a@b");
    await continueButton(page).click();

    await expect(
      page.getByText(
        "That email address doesn't look right. Please check it and try again.",
      ),
    ).toBeVisible();
    expect(await recordedCalls(page)).toHaveLength(0);
    await expect(emailInput(page)).toBeVisible();
  });

  test("email step: send failure shows friendly error and the button recovers", async ({
    page,
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { "email-otp": "error" },
    });
    await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();

    await expect(
      page.getByText(/Something went wrong sending your verification code/i),
    ).toBeVisible();
    // finally-reset: never stuck in the loading state.
    await expect(continueButton(page)).toBeEnabled();
    await expect(emailInput(page)).toBeVisible();
    expect(await recordedCalls(page)).toHaveLength(1);
    await expect(page.getByTestId(DESTINATION)).toBeHidden();
  });

  test("OTP step: Verify enables only at six digits and submits the code", async ({
    page,
    mount,
  }) => {
    const { element, options } = authStory();
    await mount(element, options);

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
    page,
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { "email-otp": "error-on-second-call" },
    });
    await mount(element, options);

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

  test("OTP step: Enter submits only with six digits", async ({ page, mount }) => {
    const { element, options } = authStory();
    await mount(element, options);

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

  test("OTP step: go back returns to a clean email form", async ({ page, mount }) => {
    const { element, options } = authStory();
    await mount(element, options);

    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    await otpInput(page).pressSequentially("999");

    await page.getByRole("button", { name: /go back/i }).click();

    await expect(emailInput(page)).toBeVisible();
    // The form comes back empty (fresh remount) — refill and re-send.
    await emailInput(page).fill("rider@example.com");
    await continueButton(page).click();
    await expect(page.getByText("Check your email")).toBeVisible();
    // Re-entering the OTP step starts from an empty code.
    await expect(verifyButton(page)).toBeDisabled();
    expect(await recordedCalls(page)).toHaveLength(2); // two sends, no verifies
  });

  test("guest login: success navigates to the post-auth destination", async ({
    page,
    mount,
  }) => {
    const { element, options } = authStory();
    await mount(element, options);

    await page.getByRole("button", { name: /continue as guest/i }).click();

    const calls = await recordedCalls(page);
    expect(calls).toHaveLength(1);
    expect(calls[0].provider).toBe("anonymous");
    await expect(page.getByTestId(DESTINATION)).toBeVisible();
  });

  test("guest login: unavailable shows the clean message, not the raw error", async ({
    page,
    mount,
  }) => {
    const { element, options } = authStory({
      signIn: { anonymous: "error" },
    });
    await mount(element, options);

    await page.getByRole("button", { name: /continue as guest/i }).click();

    await expect(
      page.getByText(
        "Guest access isn't available right now. Please continue with your email.",
      ),
    ).toBeVisible();
    await expect(page.getByText(/stub signIn/)).toBeHidden();
    await expect(page.getByTestId(DESTINATION)).toBeHidden();
  });

  test("already signed in: leaves /auth instead of showing the email form", async ({
    page,
    mount,
  }) => {
    const { element, options } = authStory({
      initial: { isLoading: false, isAuthenticated: true, user: null },
    });
    await mount(element, options);

    await expect(page.getByTestId(DESTINATION)).toBeVisible();
    await expect(emailInput(page)).toBeHidden();
  });
});
