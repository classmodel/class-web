import * as d3 from "d3";
import { createSignal } from "solid-js";
import type { ChartData } from "./ChartContainer";
import { useChartContext } from "./ChartContainer";

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
