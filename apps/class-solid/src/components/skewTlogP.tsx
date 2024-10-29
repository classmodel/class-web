// Code modified from https://github.com/rsobash/d3-skewt/ (MIT license)
import * as d3 from "d3";
import { For } from "solid-js";
import { AxisBottom, AxisLeft } from "./Axes";

export function SkewTPlot() {
  const m = [30, 40, 20, 45];
  const w = 500 - m[1] - m[3];
  const h = 500 - m[0] - m[2];

  const deg2rad = Math.PI / 180;
  const tan = Math.tan(55 * deg2rad);
  const basep = 1050;
  const topPressure = 100;
  const pressureLines = [1000, 850, 700, 500, 300, 200, 100];
  const temperatureLines = d3.range(-100, 45, 10);

  // Dry adiabats (lines of constant potential temperature): array of lines of [p, T]
  const pressurePoints = d3.range(topPressure, basep + 1, 10);
  const temperaturePoints = d3.range(-30, 240, 20);
  const dryAdiabats: [number, number][][] = temperaturePoints.map(
    (temperature) => pressurePoints.map((pressure) => [pressure, temperature]),
  );

  // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
  const x = d3.scaleLinear().range([0, w]).domain([-45, 50]);
  const y = d3.scaleLog().range([0, h]).domain([topPressure, basep]);

  //   // various path generators
  //   const line = d3
  //     .line()
  //     // .interpolate("linear")
  //     .x((d, i) => x(d.temp) + (y(basep) - y(d.press)) / tan)
  //     //.x(function(d,i) { return x(d.temp); })
  //     .y((d, i) => y(d.press));

  //   const line2 = d3
  //     .line()
  //     // .interpolate("linear")
  //     .x((d, i) => x(d.dwpt) + (y(basep) - y(d.press)) / tan)
  //     .y((d, i) => y(d.press));

  //   // bisector function for tooltips
  //   const bisectTemp = d3.bisector((d) => d.press).left;

  const dryline = d3
    .line()
    .x(
      (d) =>
        x((273.15 + d[1]) / (1000 / d[0]) ** 0.286 - 273.15) +
        (y(basep) - y(d[0])) / tan,
    )
    .y((d) => y(d[0]));

  return (
    <div id="mainbox">
      {/* Create svg container for sounding */}
      <svg width={w + m[1] + m[3]} height={h + m[0] + m[2]}>
        <title>Skew-T log(p) plot</title>
        <g transform={`translate(${m[3]},${m[0]})`}>
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
            />
            <AxisLeft
              scale={y}
              transform="translate(-0.5,0)"
              tickValues={pressureLines}
              tickFormat={d3.format(".0d")}
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
