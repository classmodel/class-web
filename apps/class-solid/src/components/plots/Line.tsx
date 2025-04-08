import * as d3 from "d3";
import { createSignal } from "solid-js";
import type { ChartData } from "./ChartContainer";
import { highlight, useChartContext } from "./ChartContainer";

export interface Point {
  x: number;
  y: number;
}

export function Line(d: ChartData<Point>) {
  const [chart, _updateChart] = useChartContext();
  const [hovered, setHovered] = createSignal(false);

  const l = d3.line<Point>(
    (d) => chart.scaleX(d.x),
    (d) => chart.scaleY(d.y),
  );

  const stroke = () => (hovered() ? highlight(d.color) : d.color);

  return (
    <path
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      fill="none"
      stroke={stroke()}
      stroke-dasharray={d.linestyle}
      stroke-width="3"
      d={l(d.data) || ""}
    >
      <title>{d.label}</title>
    </path>
  );
}
