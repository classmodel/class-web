// Code modified from https://github.com/rsobash/d3-skewt/ (MIT license)
import * as d3 from "d3";
import { For, createSignal } from "solid-js";
import { AxisBottom, AxisLeft } from "./Axes";
import type { ChartData } from "./ChartContainer";
import { Chart, ChartContainer, useChartContext } from "./ChartContainer";
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

function ClipPath() {
  const [chart, updateChart] = useChartContext();

  return (
    <clipPath id="clipper">
      <rect x="0" y="0" width={chart.innerWidth} height={chart.innerHeight} />
    </clipPath>
  );
}

function SkewTGridLine(temperature: number) {
  const [chart, updateChart] = useChartContext();
  const x = chart.scaleX;
  const y = chart.scaleY;
  return (
    <line
      x1={x(temperature) - 0.5 + (y(basep) - y(100)) / tan}
      x2={x(temperature) - 0.5}
      y1="0"
      y2={chart.innerHeight}
      clip-path="url(#clipper)"
      stroke="#dfdfdf"
      stroke-width="0.75px"
      fill="none"
    />
  );
}

function LogPGridLine(pressure: number) {
  const [chart, updateChart] = useChartContext();
  const x = chart.scaleX;
  const y = chart.scaleY;
  return (
    <line
      x1="0"
      x2={chart.innerWidth}
      y1={y(pressure)}
      y2={y(pressure)}
      stroke="#dfdfdf"
      stroke-width="0.75px"
      fill="none"
    />
  );
}

/** Dry adiabats (lines of constant potential temperature): array of lines of [p, T] */
function DryAdiabat(d: [number, number][]) {
  const [chart, updateChart] = useChartContext();
  const x = chart.scaleX;
  const y = chart.scaleY;

  const dryline = d3
    .line()
    .x(
      (d) =>
        x((273.15 + d[1]) / (1000 / d[0]) ** 0.286 - 273.15) +
        (y(basep) - y(d[0])) / tan,
    )
    .y((d) => y(d[0]));
  return (
    <path
      d={dryline(d) || ""}
      clip-path="url(#clipper)"
      stroke="#dfdfdf"
      stroke-width="0.75px"
      fill="none"
    />
  );
}

function Sounding(data: ChartData<SoundingRecord>) {
  const [chart, updateChart] = useChartContext();
  const [hovered, setHovered] = createSignal(false);

  // Scales and axes. Note the inverted domain for the y-scale: bigger is up!
  const x = chart.scaleX;
  const y = chart.scaleY;

  const temperatureLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.T - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  const dewpointLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.Td - 273.15) + (y(basep) - y(d.p)) / tan)
    .y((d) => y(d.p));

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <title>{data.label}</title>
      <path
        d={temperatureLine(data.data) || ""}
        clip-path="url(#clipper)"
        stroke={data.color}
        stroke-dasharray={data.linestyle}
        stroke-width={hovered() ? 5 : 3}
        fill="none"
      />
      <path
        d={dewpointLine(data.data) || ""}
        clip-path="url(#clipper)"
        stroke={data.color}
        stroke-dasharray={data.linestyle}
        stroke-width={hovered() ? 5 : 3}
        fill="none"
      />
    </g>
  );
}

// Note: using temperatures in Kelvin as that's easiest to get from CLASS, but
// perhaps not the most interoperable with other sounding data sources.
export function SkewTPlot({
  data,
}: { data: () => ChartData<SoundingRecord>[] }) {
  const pressureLines = [1000, 850, 700, 500, 300, 200, 100];
  const temperatureLines = d3.range(-100, 45, 10);

  const pressureGrid = d3.range(topPressure, basep + 1, 10);
  const temperatureGrid = d3.range(-30, 240, 20);
  const dryAdiabats: [number, number][][] = temperatureGrid.map((temperature) =>
    pressureGrid.map((pressure) => [pressure, temperature]),
  );

  return (
    <ChartContainer>
      <Legend entries={data} />
      <Chart title="Thermodynamic diagram">
        <AxisBottom
          domain={() => [-45, 50]}
          tickValues={temperatureLines}
          tickFormat={d3.format(".0d")}
          label="Temperature [°C]"
        />
        <AxisLeft
          type="log"
          domain={() => [basep, topPressure]}
          tickValues={pressureLines}
          tickFormat={d3.format(".0d")}
          label="Pressure [hPa]"
        />
        <ClipPath />
        <For each={temperatureLines}>{(t) => SkewTGridLine(t)}</For>
        <For each={pressureLines}>{(p) => LogPGridLine(p)}</For>
        <For each={dryAdiabats}>{(d) => DryAdiabat(d)}</For>
        <For each={data()}>{(d) => Sounding(d)}</For>
      </Chart>
    </ChartContainer>
  );
}
