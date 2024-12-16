import * as d3 from "d3";
import { For, createSignal } from "solid-js";
import { AxisBottom, AxisLeft, getNiceAxisLimits } from "./Axes";
import type { ChartData } from "./ChartContainer";
import { Chart, ChartContainer, useChartContext } from "./ChartContainer";
import { Legend } from "./Legend";

export interface Point {
  x: number;
  y: number;
}

export function Line(d: ChartData<Point>) {
  const [chart, updateChart] = useChartContext();
  const [hovered, setHovered] = createSignal(false);

  const l = d3.line<Point>(
    (d) => chart.scaleX(d.x),
    (d) => chart.scaleY(d.y),
  );
  return (
    <path
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      fill="none"
      stroke={d.color}
      stroke-dasharray={d.linestyle}
      stroke-width={hovered() ? 5 : 3}
      d={l(d.data) || ""}
    >
      <title>{d.label}</title>
    </path>
  );
}

export default function LinePlot({
  data,
  xlabel,
  ylabel,
}: {
  data: () => ChartData<Point>[];
  xlabel?: () => string;
  ylabel?: () => string;
}) {
  const xLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.x)));
  const yLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.y)));
  return (
    <ChartContainer>
      <Legend entries={data} />
      <Chart title="Vertical profile plot">
        <AxisBottom domain={xLim} label={xlabel ? xlabel() : ""} />
        <AxisLeft domain={yLim} label={ylabel ? ylabel() : ""} />
        <For each={data()}>{(d) => Line(d)}</For>
      </Chart>
    </ChartContainer>
  );
}
