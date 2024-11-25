// Code modified from https://github.com/rsobash/d3-skewt/ (MIT license)
import * as d3 from "d3";
import { For, createSignal } from "solid-js";
import { AxisBottom, AxisLeft } from "./Axes";
import type { ChartData } from "./Base";
import { Legend } from "./Legend";

interface SoundingRecord {
  p: number;
  T: number;
  Td: number;
}

const deg2rad = Math.PI / 180;
const tan = Math.tan(55 * deg2rad);
const basep = 1050;
const topPressure = 100;

function SkewTBackGround({
  w,
  h,
  x,
  y,
}: {
  w: number;
  h: number;
  x: d3.ScaleLinear<number, number, never>;
  y: d3.ScaleLogarithmic<number, number, never>;
}) {
  const pressureLines = [1000, 850, 700, 500, 300, 200, 100];
  const temperatureLines = d3.range(-100, 45, 10);

  // Dry adiabats (lines of constant potential temperature): array of lines of [p, T]
  const pressurePoints = d3.range(topPressure, basep + 1, 10);
  const temperaturePoints = d3.range(-30, 240, 20);
  const dryAdiabats: [number, number][][] = temperaturePoints.map(
    (temperature) => pressurePoints.map((pressure) => [pressure, temperature]),
  );

  const dryline = d3
    .line()
    .x(
      (d) =>
        x((273.15 + d[1]) / (1000 / d[0]) ** 0.286 - 273.15) +
        (y(basep) - y(d[0])) / tan,
    )
    .y((d) => y(d[0]));
  return (
    <g class="skewtbg">
      <clipPath id="clipper">
        <rect x="0" y="0" width={w} height={h} />
      </clipPath>
      {/* Add grid */}
      {/* Temperature lines */}
      <For each={temperatureLines}>
        {(tline) => (
          <line
            x1={x(tline) - 0.5 + (y(basep) - y(100)) / tan}
            x2={x(tline) - 0.5}
            y1="0"
            y2={h}
            clip-path="url(#clipper)"
            stroke="#dfdfdf"
            stroke-width="0.75px"
            fill="none"
          />
        )}
      </For>
      {/* Pressure lines */}
      <For each={pressureLines}>
        {(pline) => (
          <line
            x1="0"
            x2={w}
            y1={y(pline)}
            y2={y(pline)}
            stroke="#dfdfdf"
            stroke-width="0.75px"
            fill="none"
          />
        )}
      </For>
      {/* Dry Adiabats */}
      <For each={dryAdiabats}>
        {(d) => (
          <path
            d={dryline(d) || ""}
            clip-path="url(#clipper)"
            stroke="#dfdfdf"
            stroke-width="0.75px"
            fill="none"
          />
        )}
      </For>
      {/* Line along right edge of plot */}
      <line
        x1={w - 0.5}
        x2={w - 0.5}
        y1="0"
        y2={h}
        stroke="#dfdfdf"
        stroke-width="0.75px"
        fill="none"
      />

      <AxisBottom
        scale={x}
        tickCount={10}
        transform={`translate(0,${h - 0.5})`}
        tickValues={temperatureLines}
        tickFormat={d3.format(".0d")}
        label="Temperature [°C]"
      />
      <AxisLeft
        scale={y}
        transform="translate(-0.5,0)"
        tickValues={pressureLines}
        tickFormat={d3.format(".0d")}
        label="Pressure [hPa]"
        decreasing
      />
    </g>
  );
}

// Note: using temperatures in Kelvin as that's easiest to get from CLASS, but
// perhaps not the most interoperable with other sounding data sources.
export function SkewTPlot({
  data,
}: { data: () => ChartData<SoundingRecord>[] }) {
  const [hovered, setHovered] = createSignal<number | null>(null);
  const width = 500;
  const height = 500;
  const [marginTop, marginRight, marginBottom, marginLeft] = [20, 20, 35, 55];
  const w = 500 - marginRight - marginLeft;
  const h = 500 - marginTop - marginBottom;

  // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
  const x = d3.scaleLinear().range([0, w]).domain([-45, 50]);
  const y = d3.scaleLog().range([0, h]).domain([topPressure, basep]);

  const temperatureLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.T - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  const dewpointLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.Td - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  //   // bisector function for tooltips
  //   const bisectTemp = d3.bisector((d) => d.press).left;

  return (
    <figure>
      <Legend entries={data} width={`w-[${width}px]`} />
      {/* Create svg container for sounding */}
      <svg
        width={width}
        height={height}
        class="text-slate-500 text-xs tracking-wide"
      >
        <title>Thermodynamic diagram</title>
        <g transform={`translate(${marginLeft},${marginTop})`}>
          <SkewTBackGround w={w} h={h} x={x} y={y} />
          <For each={data()}>
            {(d, index) => (
              <g
                // class="opacity-50 hover:opacity-100 stroke-[3px] hover:stroke-[5px]"
                onMouseEnter={() => setHovered(index())}
                onMouseLeave={() => setHovered(null)}
              >
                <title>{d.label}</title>
                <path
                  d={temperatureLine(d.data) || ""}
                  clip-path="url(#clipper)"
                  stroke={d.color}
                  stroke-dasharray={d.linestyle}
                  stroke-width={index() === hovered() ? 5 : 3}
                  fill="none"
                />
                <path
                  d={dewpointLine(d.data) || ""}
                  clip-path="url(#clipper)"
                  stroke={d.color}
                  stroke-dasharray={d.linestyle}
                  stroke-width={index() === hovered() ? 5 : 3}
                  fill="none"
                />
              </g>
            )}
          </For>
        </g>
      </svg>
    </figure>
  );
}
