import { NBButton, NBPanel } from "@/components/nb";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { friendlyEmailError, friendlyOtpError, GUEST_UNAVAILABLE_ERROR } from "@/lib/auth-errors";
import { resolveRedirectAfterAuth } from "@/lib/redirect";
import logo from "@/assets/logo.svg";
import { ArrowRight, AudioWaveform, Loader2, UserX } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface AuthProps {
  redirectAfterAuth?: string;
}

/**
 * Pragmatic email shape check. The input's native `type="email"` validation is
 * the first line of defense; this is the defensive second layer (native
 * validation can be skipped by programmatic submits).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(
    searchParams.get("returnTo"),
    redirectAfterAuth,
  );
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** In-flight guard: one auth request at a time, no matter how many clicks. */
  const submittingRef = useRef(false);

  // Signed-in users never stay on /auth. `replace` keeps /auth out of the
  // history stack so back-buttoning out of the app can't loop them here.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const email = String(
      new FormData(event.currentTarget).get("email") ?? "",
    ).trim();
    if (!EMAIL_PATTERN.test(email)) {
      setError(
        "That email address doesn't look right. Please check it and try again.",
      );
      return;
    }
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      // Normalized copy of the form data (trimmed email) into the existing
      // signIn("email-otp", formData) flow — first call sends the code.
      const formData = new FormData();
      formData.set("email", email);
      await signIn("email-otp", formData);
      setStep({ email });
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(friendlyEmailError(err));
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || step === "signIn") return;
    // Require exactly 6 digits — the button is disabled until then, but the
    // handler must not trust that (Enter key, autofill, rapid double-tap).
    if (!/^\d{6}$/.test(otp)) return;
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", step.email);
      formData.set("code", otp);
      await signIn("email-otp", formData);
      navigate(redirect, { replace: true });
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(friendlyOtpError(err));
      // A wrong code must never survive into the retry — clear the boxes.
      setOtp("");
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect, { replace: true });
    } catch (err) {
      console.error("Guest login error:", err);
      // Anonymous may be unavailable/disabled — never surface the raw error.
      setError(GUEST_UNAVAILABLE_ERROR);
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  // Returning to the email screen must clear the stale code and any error
  // from the previous attempt, so the form starts clean.
  const handleBackToEmail = () => {
    setStep("signIn");
    setOtp("");
    setError(null);
  };

  return (
    <div className="nb-dots flex min-h-screen bg-paper">
      {/* Left brand panel */}
      <div className="nb-stripes hidden w-[42%] flex-col justify-between border-r-2 border-ink bg-ink p-10 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <img src={logo} alt="ShiftedTone" width={40} height={40} className="nb size-10 bg-ink" />
          <span className="font-display text-lg">
            Shifted<span className="text-sun">Tone</span>
          </span>
        </div>
        <div>
          <h2 className="font-display text-4xl leading-tight text-balance">
            The voice is honest.
            <br />
            <span className="text-sun">
              <span className="italic">Train</span> it.
            </span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper/70">
            Sign in so your takes, streak, and reframes are here when you come
            back. ShiftedTone never saves your audio — tone scores are
            computed on your device. On some browsers, an optional live
            transcript of your take is generated by your browser's built-in
            speech service and stored with your take so the coach can use it.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 items-end gap-1" aria-hidden>
              {[40, 75, 55, 90, 45, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-mint"
                  style={{
                    height: `${h}%`,
                    animation: `nb-eq ${0.9 + i * 0.15}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
            <AudioWaveform className="size-5 text-sun" />
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-paper/50">
          Calm is a skill · Practice the pause
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <NBPanel className="w-full max-w-md">
          {step === "signIn" ? (
            <>
              <div className="border-b-2 border-ink bg-sun px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logo}
                    alt="ShiftedTone"
                    width={40}
                    height={40}
                    className="nb size-10 bg-ink cursor-pointer lg:hidden"
                    onClick={() => navigate("/")}
                  />
                  <div>
                    <p className="font-display text-xl leading-none">
                      Welcome in
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Log in or make an account — it's free
                    </p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleEmailSubmit}>
                <div className="flex flex-col gap-4 p-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest">
                      Email
                    </label>
                    <Input
                      name="email"
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      className="nb h-11 rounded-none bg-card px-3 shadow-none focus-visible:ring-2 focus-visible:ring-sun"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  {error && (
                    <p className="nb bg-coral px-3 py-2 text-sm font-medium" role="alert">
                      {error}
                    </p>
                  )}
                  <NBButton
                    type="submit"
                    variant="ink"
                    disabled={isLoading}
                    className="w-full py-3"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        Continue <ArrowRight className="size-4" />
                      </>
                    )}
                  </NBButton>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t-2 border-dashed border-ink/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <NBButton
                    type="button"
                    variant="paper"
                    className="w-full py-3"
                    onClick={handleGuestLogin}
                    disabled={isLoading}
                  >
                    <UserX className="size-4" /> Just looking — continue as guest
                  </NBButton>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="border-b-2 border-ink bg-mint px-6 py-4">
                <p className="font-display text-xl leading-none">Check your email</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Just sent a 6-digit code to {step.email}
                </p>
              </div>
              <form onSubmit={handleOtpSubmit}>
                <div className="flex flex-col gap-5 p-6">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      // Digit-only at the component level: letters can never fill the
                      // slots, so an enabled Verify button always means six digits —
                      // and the handler's /^\d{6}$/ guard can never silently swallow
                      // a submit. inputMode + one-time-code give iOS the numeric pad
                      // and Mail/Messages autofill.
                      pattern={REGEXP_ONLY_DIGITS}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          otp.length === 6 &&
                          !isLoading
                        ) {
                          const form = (e.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {error && (
                    <p className="nb bg-coral px-3 py-2 text-center text-sm font-medium" role="alert">
                      {error}
                    </p>
                  )}
                  <NBButton
                    type="submit"
                    variant="ink"
                    className="w-full py-3"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Verifying…
                      </>
                    ) : (
                      <>
                        That's the one <ArrowRight className="size-4" />
                      </>
                    )}
                  </NBButton>
                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-ink"
                  >
                    ← Wrong email? Go back
                  </button>
                </div>
              </form>
            </>
          )}
        </NBPanel>
      </div>
    </div>
  );
}

/** Minimal branded loading state — a slow chunk never renders a blank screen. */
function AuthFallback() {
  return (
    <div className="nb-dots flex min-h-screen items-center justify-center bg-paper">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense fallback={<AuthFallback />}>
      <Auth {...props} />
    </Suspense>
  );
}
