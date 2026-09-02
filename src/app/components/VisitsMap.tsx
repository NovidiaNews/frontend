"use client";

import { useEffect, useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { ISO2_TO_NUM } from "@/lib/iso2numeric";

interface CountryStat {
  code: string | null;
  country: string | null;
  count: number;
}

const WIDTH = 820;
const HEIGHT = 430;

const LIGHTEST: [number, number, number] = [223, 220, 255]; // #DFDCFF
const MAIN: [number, number, number] = [54, 49, 106]; // #36316A

const lerp = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;

// Natural Earth world map (world-atlas ~110m resolution, bundled in /public)
export default function VisitsMap({ countries }: { countries: CountryStat[] }) {
  const [paths, setPaths] = useState<{ id: string; d: string }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/world-countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const world = feature(topo as unknown as Topology, (topo as unknown as Topology).objects.countries as GeometryCollection);
        const f = world as unknown as { features: { id: unknown; geometry: unknown }[] };
        const projection = geoNaturalEarth1().fitExtent(
          [[5, 5], [WIDTH - 5, HEIGHT - 5]],
          { type: "Sphere" } as never
        );
        const p = geoPath(projection);
        if (!alive) return;
        setPaths(f.features.map((feat) => ({ id: String(feat.id), d: p(feat as never) ?? "" })));
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, []);

  const projection = useMemo(() => {
    const proj = geoNaturalEarth1().fitExtent(
      [[5, 5], [WIDTH - 5, HEIGHT - 5]],
      { type: "Sphere" } as never
    );
    proj.precision(0.1);
    return proj;
  }, []);
  const sphere = useMemo(() => geoPath(projection)({ type: "Sphere" } as never) ?? "", [projection]);
  const graticule = useMemo(() => geoPath(projection)(geoGraticule10() as never) ?? "", [projection]);

  const byNum = useMemo(() => {
    const m: Record<string, { name: string; count: number }> = {};
    for (const c of countries) {
      if (!c.code) continue;
      const num = ISO2_TO_NUM[c.code];
      if (num) m[num] = { name: c.country || c.code, count: c.count };
    }
    return m;
  }, [countries]);

  const maxCount = useMemo(() => Math.max(...countries.map((c) => c.count), 1), [countries]);
  const total = useMemo(() => countries.reduce((acc, c) => acc + c.count, 0), [countries]);

  if (failed) {
    return (
      <div className="rounded-2xl border border-edge bg-surface-raised p-6 text-center text-sm text-ink-muted">
        Nie udało się załadować danych mapy.
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-edge p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <GlobeIcon /> Mapa odwiedzin
        </h3>
        <span className="text-xs text-ink-subtle">
          {total.toLocaleString("pl-PL")} odwiedzin · {countries.length} krajów
        </span>
      </div>
      {!paths ? (
        <div className="h-64 flex items-center justify-center text-sm text-ink-subtle">
          <RefreshIcon className="animate-spin mr-2" size={14} /> Ładowanie mapy...
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto select-none" role="img" aria-label="Mapa świata odwiedzin">
            <path d={sphere} fill="#f1f0f7" stroke="none" />
            {graticule && <path d={graticule} fill="none" stroke="#e2e0ea" strokeWidth={0.35} />}
            {paths.map((c) => {
              const stat = byNum[c.id];
              const visited = !!stat;
              return (
                <path
                  key={c.id}
                  d={c.d}
                  fill={visited ? lerp(LIGHTEST, MAIN, Math.sqrt(stat.count / maxCount)) : "#e8e8ec"}
                  stroke="#ffffff"
                  strokeWidth={0.4}
                  className={visited ? "cursor-pointer transition-opacity hover:opacity-80" : ""}
                >
                  {visited && <title>{stat.name} — {stat.count.toLocaleString("pl-PL")} odwiedzin</title>}
                </path>
              );
            })}

          </svg>
          <div className="flex items-center justify-between mt-2 text-[10px] text-ink-subtle">
            <span>Natural Earth · world-atlas 110m</span>
            <div className="flex items-center gap-1.5">
              <span>0</span>
              <div className="w-28 h-1.5 rounded-full" style={{ background: `linear-gradient(to right, rgb(${LIGHTEST.join(",")}), rgb(${MAIN.join(",")}))` }} />
              <span>{maxCount.toLocaleString("pl-PL")}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#36316A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function RefreshIcon({ className, size }: { className?: string; size: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}