// Code modified from https://github.com/rsobash/d3-skewt/ (MIT license)
import * as d3 from "d3";
import { For, Show, createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { AxisBottom, AxisLeft } from "./Axes";
import type { ChartData, SupportedScaleTypes } from "./ChartContainer";
import {
  Chart,
  ChartContainer,
  highlight,
  useChartContext,
} from "./ChartContainer";
import { Legend } from "./Legend";
interface SoundingRecord {
  p: number;
  T: number;
  Td: number;
}

const deg2rad = Math.PI / 180;
const tan = Math.tan(55 * deg2rad);

function getTempAtCursor(x: number, y: number, scaleY: SupportedScaleTypes) {
  const basep = () => scaleY.domain()[0];
  return x - (scaleY(basep()) - y) / tan;
}

function SkewTGridLine(temperature: number) {
  const [chart, updateChart] = useChartContext();
  const x = (temp: number) => chart.scaleX(temp);
  const y = (pres: number) => chart.scaleY(pres);
  const basep = () => chart.scaleY.domain()[0];
  const topPressure = () => chart.scaleY.domain()[1];
  return (
    <line
      x1={x(temperature) + (y(basep()) - y(topPressure())) / tan}
      x2={x(temperature)}
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
  const x = (temp: number) => chart.scaleX(temp);
  const y = (pres: number) => chart.scaleY(pres);
  return (
    <line
      x1="0"
      x2={chart.innerWidth}
      y1={y(pressure)}
      y2={y(pressure)}
      stroke="#dfdfdf"
      stroke-width="0.75px"
      fill="none"
      clip-path="url(#clipper)"
    />
  );
}

/** Dry adiabats (lines of constant potential temperature): array of lines of [p, T] */
function DryAdiabat(d: [number, number][]) {
  const [chart, updateChart] = useChartContext();
  const x = (temp: number) => chart.scaleX(temp);
  const y = (pres: number) => chart.scaleY(pres);
  const basep = () => chart.scaleY.domain()[0];
  const dryline = d3
    .line()
    .x(
      (d) =>
        x((273.15 + d[1]) / (1000 / d[0]) ** 0.286 - 273.15) +
        (y(basep()) - y(d[0])) / tan,
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
  const x = (temp: number) => chart.scaleX(temp);
  const y = (pres: number) => chart.scaleY(pres);
  const basep = () => chart.scaleY.domain()[0];

  const temperatureLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.T - 273.15) + (y(basep()) - y(d.p)) / tan)
    .y((d) => y(d.p));

  const dewpointLine = d3
    .line<SoundingRecord>()
    .x((d) => x(d.Td - 273.15) + (y(basep()) - y(d.p)) / tan)
    .y((d) => y(d.p));

  const titleT = () => `${data.label} T`;
  const titleTd = () => `${data.label} Td`;

  const stroke = () => (hovered() ? highlight(data.color) : data.color);

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <path
        d={temperatureLine(data.data) || ""}
        clip-path="url(#clipper)"
        stroke={stroke()}
        stroke-dasharray={data.linestyle}
        stroke-width={2}
        fill="none"
        class="cursor-pointer"
      >
        <title>{titleT()}</title>
      </path>
      <path
        d={dewpointLine(data.data) || ""}
        clip-path="url(#clipper)"
        stroke={stroke()}
        stroke-dasharray="5,5"
        stroke-width={2}
        fill="none"
        class="cursor-pointer"
      >
        <title>{titleTd()}</title>
      </path>
    </g>
  );
}

// Note: using temperatures in Kelvin as that's easiest to get from CLASS, but
// perhaps not the most interoperable with other sounding data sources.
export function SkewTPlot(props: {
  data: () => ChartData<SoundingRecord>[];
  id: string;
}) {
  const pressureLines = [1000, 850, 700, 500, 300, 200, 100];
  const temperatureLines = d3.range(-100, 45, 10);

  const initialBasePressure = 1050;
  const initialTopPressure = 100;

  const pressureGrid = d3.range(
    initialTopPressure,
    initialBasePressure + 1,
    10,
  );
  const temperatureGrid = d3.range(-30, 240, 20);
  const dryAdiabats: [number, number][][] = temperatureGrid.map((temperature) =>
    pressureGrid.map((pressure) => [pressure, temperature]),
  );

  const [toggles, setToggles] = createStore<Record<string, boolean>>({});

  // Initialize all lines as visible
  createEffect(() => {
    for (const d of props.data()) {
      setToggles(d.label, true);
    }
  });

  function toggleLine(label: string, value: boolean) {
    setToggles(label, value);
  }

  function showSounding(i: number) {
    const cd = props.data()[i];
    if (!toggles || !cd) {
      return true;
    }
    return toggles[cd.label];
  }

  return (
    <ChartContainer>
      <Legend entries={props.data} toggles={toggles} onChange={toggleLine} />
      <Chart
        id={props.id}
        title="Thermodynamic diagram"
        formatX={() => d3.format(".0d")}
        formatY={() => d3.format(".0d")}
        transformX={getTempAtCursor}
      >
        <AxisBottom
          domain={() => [-45, 50]}
          tickValues={temperatureLines}
          label="Temperature [°C]"
        />
        <AxisLeft
          type="log"
          domain={() => [initialBasePressure, initialTopPressure]}
          tickValues={pressureLines}
          label="Pressure [hPa]"
        />
        <For each={temperatureLines}>{(t) => SkewTGridLine(t)}</For>
        <For each={pressureLines}>{(p) => LogPGridLine(p)}</For>
        <For each={dryAdiabats}>{(d) => <DryAdiabat {...d} />}</For>
        <For each={props.data()}>
          {(d, i) => (
            <Show when={showSounding(i())}>
              <Sounding {...d} />
            </Show>
          )}
        </For>
      </Chart>
    </ChartContainer>
  );
}
