/**
 * Static background decorative: 5 concentric circles
 * No props / no state — hoisted outside component (Vercel rendering-hoist-jsx).
 */
const circles = [160, 240, 320, 400, 480] as const;

export function ConcentricCircles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[calc(50%+40px)] flex h-[480px] w-[480px] items-center justify-center"
    >
      {circles.map((size) => (
        <div
          key={size}
          className="absolute rounded-full border border-black opacity-[0.03]"
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}
