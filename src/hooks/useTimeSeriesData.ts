import { useMemo } from "react";

/** Generate deterministic mock time-series data for charts */
export function useTimeSeriesData(points: number, seed: number = 42) {
  return useMemo(() => {
    let s = seed;
    const rng = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };

    const now = Date.now();
    const interval = (24 * 60 * 60 * 1000) / points;

    return Array.from({ length: points }, (_, i) => {
      const time = new Date(now - (points - 1 - i) * interval);
      const hour = time.getHours();
      const label = `${hour.toString().padStart(2, "0")}:00`;
      const threats = Math.floor(rng() * 15 + (hour > 8 && hour < 20 ? 8 : 2));
      const traffic = Math.floor(rng() * 80 + 40 + (hour > 9 && hour < 18 ? 50 : 0));
      const blocked = Math.floor(threats * (0.4 + rng() * 0.4));
      return { label, threats, traffic, blocked };
    });
  }, [points, seed]);
}
