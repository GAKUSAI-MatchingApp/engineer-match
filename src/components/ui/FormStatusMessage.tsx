import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type FormMessageStatus = "error" | "success" | null;

interface FormStatusMessageProps {
  message: string | null;
  status: FormMessageStatus;
  className?: string;
}

/**
 * Standard form-level status banner (RD #28): one shared presentational
 * component so every form's post-submit error/success message renders with
 * the same box, position (directly before the submit/save button), and ARIA
 * semantics. Renders nothing when `message` is null/empty -- callers keep
 * owning their own message/status state and validation.
 */
export const FormStatusMessage = forwardRef<HTMLDivElement, FormStatusMessageProps>(
  function FormStatusMessage({ message, status, className }, ref) {
    if (!message) return null;

    const isError = status === "error";

    return (
      <div
        ref={ref}
        tabIndex={-1}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className={cn(
          "rounded-xl px-4 py-3 text-sm font-medium focus:outline-none",
          isError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700",
          className,
        )}
      >
        {message}
      </div>
    );
  },
);
