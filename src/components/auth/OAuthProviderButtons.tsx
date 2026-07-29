import type { ComponentProps } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type OAuthProvider = "google" | "github";

interface OAuthProviderButtonsProps {
  dividerLabel: string;
  googleLabel: string;
  githubLabel: string;
  loadingProvider: OAuthProvider | null;
  disabled?: boolean;
  onProviderClick: (provider: OAuthProvider) => void;
}

function GoogleIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3a7.15 7.15 0 0 1-10.65-3.76H1.4v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.41 14.33a7.2 7.2 0 0 1 0-4.62V6.62H1.4a12 12 0 0 0 0 10.8l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.4 11.4 0 0 0 12 0 12 12 0 0 0 1.4 6.62l4.01 3.09A7.15 7.15 0 0 1 12 4.77Z"
      />
    </svg>
  );
}

function GitHubIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.11.78-.25.78-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.4-5.25 5.68.42.36.78 1.07.78 2.16 0 1.56-.01 2.82-.01 3.2 0 .3.21.67.79.55A10.51 10.51 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

export function OAuthProviderButtons({
  dividerLabel,
  googleLabel,
  githubLabel,
  loadingProvider,
  disabled = false,
  onProviderClick,
}: OAuthProviderButtonsProps) {
  const buttonsDisabled = disabled || loadingProvider !== null;

  return (
    <>
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-xs text-white/50">{dividerLabel}</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => onProviderClick("google")}
          disabled={buttonsDisabled}
          aria-busy={loadingProvider === "google"}
          className="h-12 w-full rounded-xl border border-white/40 bg-white/90 text-sm font-semibold text-[#111827] hover:bg-white disabled:opacity-70"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          {googleLabel}
        </Button>
        <Button
          type="button"
          onClick={() => onProviderClick("github")}
          disabled={buttonsDisabled}
          aria-busy={loadingProvider === "github"}
          className="h-12 w-full rounded-xl border border-white/40 bg-white/90 text-sm font-semibold text-[#111827] hover:bg-white disabled:opacity-70"
        >
          {loadingProvider === "github" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GitHubIcon className="h-4 w-4" />
          )}
          {githubLabel}
        </Button>
      </div>
    </>
  );
}
