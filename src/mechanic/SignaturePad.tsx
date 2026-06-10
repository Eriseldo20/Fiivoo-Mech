import { useEffect, useRef, useState } from "react";
import { Eraser } from "lucide-react";

type SignaturePadProps = {
  onChange: (hasInk: boolean) => void;
};

export type SignaturePadHandle = {
  isEmpty: () => boolean;
  toBlob: () => Promise<Blob | null>;
  clear: () => void;
};

/**
 * A lightweight canvas signature pad. Captures pointer/touch strokes and can
 * export a PNG blob for upload. Designed for finger signing on a phone/tablet.
 */
export function SignaturePad({
  onChange,
  innerRef,
}: SignaturePadProps & { innerRef: React.MutableRefObject<SignaturePadHandle | null> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);

  // Size the canvas to its container with devicePixelRatio for crisp lines.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#0a0a0a";
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk.current) {
      hasInk.current = true;
      setEmpty(false);
      onChange(true);
    }
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
    setEmpty(true);
    onChange(false);
  };

  innerRef.current = {
    isEmpty: () => !hasInk.current,
    clear,
    toBlob: () =>
      new Promise<Blob | null>((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) return resolve(null);
        canvas.toBlob((b) => resolve(b), "image/png");
      }),
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-44 w-full touch-none rounded-md border border-border bg-card"
        aria-label="Signature drawing area"
      />
      <button
        type="button"
        onClick={clear}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Eraser className="size-3.5" aria-hidden="true" />
        Clear
      </button>
      {empty && (
        <span className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground">
          Customer signs above
        </span>
      )}
    </div>
  );
}
