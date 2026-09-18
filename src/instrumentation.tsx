import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";
import { ChevronDown, ExternalLink } from "lucide-react";
import React, { useEffect, useState } from "react";
import { isRuntimeError, normalizeRejection } from "@/lib/error-report";

type SyncError = {
  error: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
};

type AsyncError = {
  error: string;
  stack: string;
};

type GenericError = SyncError | AsyncError;

async function reportErrorToVly(errorData: {
  error: string;
  stackTrace?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  if (!import.meta.env.VITE_VLY_APP_ID || !import.meta.env.VITE_VLY_MONITORING_URL) {
    return;
  }

  try {
    await fetch(import.meta.env.VITE_VLY_MONITORING_URL, {
      method: "POST",
      body: JSON.stringify({
        ...errorData,
        url: window.location.href,
        projectSemanticIdentifier: import.meta.env.VITE_VLY_APP_ID,
      }),
    });
  } catch {
    // Reporting is best-effort — never surface monitor failures to users.
  }
}

function ErrorDialog({
  error,
  setError,
}: {
  error: GenericError;
  setError: (error: GenericError | null) => void;
}) {
  return (
    <Dialog
      defaultOpen={true}
      onOpenChange={() => {
        setError(null);
      }}
    >
      <DialogContent className="bg-coral text-ink max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display">Something went sideways</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed">
          An unexpected error interrupted the page. It has been logged — reload
          to pick up where you left off. Your saved takes and progress are safe.
        </p>
        <div className="mt-4">
          <Collapsible>
            <CollapsibleTrigger className="cursor-pointer">
              <div className="flex items-center font-bold underline decoration-ink/40 underline-offset-4">
                See error details <ChevronDown className="ml-1" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="max-w-[460px]">
              <div className="mt-2 p-3 bg-ink/90 rounded text-paper text-sm overflow-x-auto max-h-60 max-w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <pre className="whitespace-pre">{error.stack || error.error}</pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter>
          <Button onClick={() => window.location.reload()} className="bg-ink text-paper border-ink hover:bg-ink/90">
            Reload ShiftedTone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ErrorBoundaryState = {
  hasError: boolean;
  error: GenericError | null;
};

class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportErrorToVly({
      error: error.message,
      stackTrace: error.stack,
    });
    trackEvent("runtime_error", {
      source: "boundary",
      message: error.message.slice(0, 120),
    });
    this.setState({
      hasError: true,
      error: {
        error: error.message,
        stack: info.componentStack ?? error.stack ?? "",
      },
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <ErrorDialog
          error={
            this.state.error ?? {
              error: "An error occurred",
              stack: "",
            }
          }
          setError={() => {}}
        />
      );
    }

    return this.props.children;
  }
}

export function InstrumentationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [error, setError] = useState<GenericError | null>(null);

  useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      // Resource-loading failures (img/css/script — e.g. a blocked YouTube
      // thumbnail) also surface here, without an Error object. They are not
      // runtime errors and shouldn't pop the dialog.
      if (!isRuntimeError(event)) return;
      try {
        event.preventDefault();
        setError({
          error: event.message,
          stack: event.error?.stack || "",
          filename: event.filename || "",
          lineno: event.lineno,
          colno: event.colno,
        });

        trackEvent("runtime_error", {
          source: "window",
          message: event.message.slice(0, 120),
        });

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: event.message,
            stackTrace: event.error?.stack,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          });
        }
      } catch (innerError) {
        // The handler itself must never become the crash.
        console.error("Error handler failure:", innerError);
      }
    };

    const handleRejection = async (event: PromiseRejectionEvent) => {
      try {
        event.preventDefault();

        const { error: message, stack } = normalizeRejection(event.reason);

        trackEvent("runtime_error", {
          source: "promise",
          message: message.slice(0, 120),
        });

        if (import.meta.env.VITE_VLY_APP_ID) {
          await reportErrorToVly({
            error: message,
            stackTrace: stack,
          });
        }

        setError({
          error: message,
          stack,
        });
      } catch (innerError) {
        // The handler itself must never become the crash.
        console.error("Rejection handler failure:", innerError);
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);
  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
      {error && <ErrorDialog error={error} setError={setError} />}
    </>
  );
}
