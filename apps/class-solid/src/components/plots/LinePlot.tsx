import * as d3 from "d3";
import { For } from "solid-js";
import { AxisBottom, AxisLeft, getNiceAxisLimits } from "./Axes";
import type { ChartData } from "./Base";
import { ChartContainer, useChartContext } from "./ChartContainer";
import { Legend } from "./Legend";

export interface Point {
  x: number;
  y: number;
}

function Line(d: ChartData<Point>) {
  const [chart, updateChart] = useChartContext();

  const l = d3.line<Point>(
    (d) => chart.scaleX(d.x),
    (d) => chart.scaleY(d.y),
  );
  return (
    <path
      fill="none"
      stroke={d.color}
      stroke-dasharray={d.linestyle}
      stroke-width="3"
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
}: { data: () => ChartData<Point>[]; xlabel?: string; ylabel?: string }) {
  const xLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.x)));
  const yLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.y)));
  return (
    <ChartContainer title="Vertical profile plot">
      <Legend entries={data} />
      <AxisBottom domain={xLim} label={xlabel} />
      <AxisLeft domain={yLim} label={ylabel} />
      <For each={data()}>{(d) => Line(d)}</For>
    </ChartContainer>
  );
}
