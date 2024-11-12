// Code modified from https://github.com/rsobash/d3-skewt/ (MIT license)
import * as d3 from "d3";
import { For } from "solid-js";
import { AxisBottom, AxisLeft } from "./Axes";

type SoundingRecord = { p: number; T: number; Td: number };

const deg2rad = Math.PI / 180;
const tan = Math.tan(55 * deg2rad);
const basep = 1050;
const topPressure = 100;

// Dummy data from https://github.com/rsobash/d3-skewt/blob/master/data_OUN.js
const exampleSounding: SoundingRecord[] = [
  { p: 962, T: 280, Td: 219 },
  { p: 954, T: 276, Td: 215 },
  { p: 944, T: 269, Td: 211 },
  { p: 931, T: 258, Td: 208 },
  { p: 915, T: 244, Td: 205 },
  { p: 896, T: 224, Td: 201 },
  { p: 874, T: 221, Td: 178 },
  { p: 845, T: 239, Td: 37 },
  { p: 814, T: 229, Td: -42 },
  { p: 779, T: 196, Td: -25 },
  { p: 741, T: 160, Td: -41 },
  { p: 701, T: 119, Td: -70 },
  { p: 658, T: 71, Td: -104 },
  { p: 614, T: 17, Td: -115 },
  { p: 569, T: -40, Td: -86 },
  { p: 526, T: -86, Td: -107 },
  { p: 488, T: -134, Td: -162 },
  { p: 451, T: -175, Td: -244 },
  { p: 416, T: -217, Td: -297 },
  { p: 383, T: -261, Td: -334 },
  { p: 353, T: -302, Td: -387 },
  { p: 325, T: -347, Td: -407 },
  { p: 298, T: -396, Td: -463 },
  { p: 272, T: -444, Td: -512 },
  { p: 249, T: -489, Td: -551 },
  { p: 227, T: -533, Td: -594 },
  { p: 206, T: -576, Td: -628 },
  { p: 186, T: -609, Td: -655 },
  { p: 171, T: -625, Td: -679 },
  { p: 156, T: -593, Td: -703 },
  { p: 140, T: -577, Td: -752 },
  { p: 126, T: -593, Td: -788 },
  { p: 114, T: -621, Td: -804 },
  { p: 102, T: -638, Td: -804 },
  { p: 91, T: -644, Td: -804 },
  { p: 80, T: -645, Td: -804 },
  { p: 70, T: -638, Td: -804 },
  { p: 62, T: -626, Td: -804 },
  { p: 53, T: -59, Td: -804 },
];

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
      />
      <AxisLeft
        scale={y}
        transform="translate(-0.5,0)"
        tickValues={pressureLines}
        tickFormat={d3.format(".0d")}
      />
    </g>
  );
}

export function SkewTPlot({
  soundingData,
}: { soundingData: SoundingRecord[] }) {
  const m = [30, 40, 20, 45];
  const w = 500 - m[1] - m[3];
  const h = 500 - m[0] - m[2];

  // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
  const x = d3.scaleLinear().range([0, w]).domain([-45, 50]);
  const y = d3.scaleLog().range([0, h]).domain([topPressure, basep]);

  // TODO: temperature divided by 10 because sample data comes with 1 decimal but without decimal comma/point
  // Is that standard (e.g. also for EWED)? Should CLASS also provide data like this? Or modify the data instead?
  const temperatureLine = d3
    .line<SoundingRecord>()
    // TODO what should be the units of temperature? K, or C, or C/10?
    .x((d) => x(d.T - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  const dewpointLine = d3
    .line<SoundingRecord>()
    // TODO what should be the units of temperature? K, or C, or C/10?
    .x((d) => x(d.Td - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  //   // bisector function for tooltips
  //   const bisectTemp = d3.bisector((d) => d.press).left;

  return (
    <div id="mainbox">
      {/* Create svg container for sounding */}
      <svg width={w + m[1] + m[3]} height={h + m[0] + m[2]}>
        <title>Thermodynamic diagram</title>
        <g transform={`translate(${m[3]},${m[0]})`}>
          <SkewTBackGround w={w} h={h} x={x} y={y} />
          <g class="skewt">
            <path
              d={temperatureLine(soundingData) || ""}
              clip-path="url(#clipper)"
              stroke="red"
              stroke-width="2.5px"
              fill="none"
            />
            <path
              d={dewpointLine(soundingData) || ""}
              clip-path="url(#clipper)"
              stroke="green"
              stroke-width="2.5px"
              fill="none"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
