import { useState } from "react";
import { useMutation } from "convex/react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – generated at runtime by `convex dev`
import { api } from "@/convex/_generated/api";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – generated at runtime by `convex dev`
import type { Id } from "@/convex/_generated/dataModel";

type Phase = "idle" | "loading" | "success" | "error";

interface ConvertToJobCardButtonProps {
  estimateId: Id<"estimates">;
  /** Called with the new jobCard ID once conversion succeeds */
  onSuccess?: (jobCardId: Id<"jobCards">) => void;
  className?: string;
}

export function ConvertToJobCardButton({
  estimateId,
  onSuccess,
  className = "",
}: ConvertToJobCardButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const convertToJobCard = useMutation(api.estimates.convertToJobCard);

  async function handleClick() {
    if (phase !== "idle") return;
    setPhase("loading");
    try {
      const jobCardId = await convertToJobCard({ id: estimateId });
      setPhase("success");
      // Stay on success state for 2.2 s, then call onSuccess
      setTimeout(() => {
        onSuccess?.(jobCardId as Id<"jobCards">);
      }, 2200);
    } catch {
      setPhase("error");
      setTimeout(() => setPhase("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={phase !== "idle"}
      aria-label={
        phase === "loading"
          ? "Converting to job card…"
          : phase === "success"
            ? "Converted to job card"
            : phase === "error"
              ? "Conversion failed — try again"
              : "Convert estimate to job card"
      }
      className={[
        "relative inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-200 select-none",
        phase === "idle" &&
          "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
        phase === "loading" && "bg-blue-500 text-white cursor-wait",
        phase === "success" && "bg-emerald-500 text-white cursor-default",
        phase === "error" && "bg-red-500 text-white cursor-default",
        "disabled:opacity-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Spinner — visible only while loading */}
      {phase === "loading" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <Spinner />
        </span>
      )}

      {/* Animated green checkmark — visible only on success */}
      {phase === "success" && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <CheckmarkBurst />
        </span>
      )}

      {/* Default label — hidden while loading or success so the icon fills the space */}
      <span
        className={
          phase === "loading" || phase === "success"
            ? "opacity-0 pointer-events-none"
            : ""
        }
      >
        {phase === "error" ? "Try again" : "Convert to Job Card"}
      </span>
    </button>
  );
}

/* ─── Sub-components ───────────────────────────────────────── */

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

function CheckmarkBurst() {
  return (
    <span className="relative flex items-center justify-center">
      {/* Ripple ring */}
      <span
        className="absolute h-10 w-10 rounded-full bg-emerald-300 opacity-0"
        style={{ animation: "ripple 0.6s ease-out forwards" }}
      />
      {/* Checkmark SVG with draw animation */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline
          points="4 13 9 18 20 7"
          style={{
            strokeDasharray: 22,
            strokeDashoffset: 22,
            animation: "draw-check 0.45s ease-out 0.05s forwards",
          }}
        />
      </svg>

      {/* Keyframes injected once into the document head */}
      <AnimationStyles />
    </span>
  );
}

let stylesInjected = false;
function AnimationStyles() {
  if (stylesInjected) return null;
  stylesInjected = true;
  return (
    <style>{`
      @keyframes draw-check {
        to { stroke-dashoffset: 0; }
      }
      @keyframes ripple {
        0%   { transform: scale(0.6); opacity: 0.55; }
        100% { transform: scale(2);   opacity: 0; }
      }
    `}</style>
  );
}
