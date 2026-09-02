import React, { useEffect, useRef } from "react";

const POINTS = 20;
const BASE_R = 46;

function ringPath(amp: number, time: number) {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= POINTS; i++) {
    const a = (i / POINTS) * Math.PI * 2;
    const wave =
      Math.sin(a * 3 + time * 2.4) * amp * 2.6 +
      Math.sin(a * 5 + time * 1.15) * amp * 1.1;
    const r = BASE_R + wave;
    pts.push([50 + Math.cos(a) * r, 50 + Math.sin(a) * r]);
  }

  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const cpx = (curr[0] + next[0]) / 2;
    const cpy = (curr[1] + next[1]) / 2;
    d += ` Q ${curr[0].toFixed(2)} ${curr[1].toFixed(2)} ${cpx.toFixed(2)} ${cpy.toFixed(2)}`;
  }
  d += " Z";
  return d;
}

/**
 * Surface of the mist orb. Restlessness on hold travels as a rim wave
 * instead of shaking the whole cloud. The loop only runs while the wave
 * has amplitude — no extra rAF on a still session.
 */
export function HaloRipple({
  size,
  color,
  amplitude,
}: {
  size: number;
  color: string;
  amplitude: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const ampRef = useRef(0);
  const targetRef = useRef(amplitude);
  const kickRef = useRef<() => void>(() => {});
  targetRef.current = amplitude;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    path.setAttribute("d", ringPath(0, 0));
    if (reduce.matches) return;

    let raf = 0;
    let running = true;
    let last = performance.now();
    let time = 0;

    const frame = (now: number) => {
      if (!running) return;
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;
      ampRef.current += (targetRef.current - ampRef.current) * 0.12;

      const live =
        !document.hidden &&
        (ampRef.current >= 0.012 || targetRef.current >= 0.012);

      if (!live) {
        ampRef.current = 0;
        path.setAttribute("d", ringPath(0, 0));
        raf = 0;
        return;
      }

      time += dt;
      path.setAttribute("d", ringPath(ampRef.current, time));
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!running || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    kickRef.current = kick;

    if (targetRef.current > 0.01) kick();

    const onVis = () => {
      if (!document.hidden && targetRef.current > 0.01) kick();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      kickRef.current = () => {};
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (amplitude > 0.01) kickRef.current();
  }, [amplitude]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="absolute pointer-events-none"
      aria-hidden="true"
    >
      <path
        ref={pathRef}
        fill="none"
        stroke={color}
        strokeWidth="1.15"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

export default HaloRipple;
