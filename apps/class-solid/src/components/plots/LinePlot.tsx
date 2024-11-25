import * as d3 from "d3";
import { For } from "solid-js";
import { AxisBottom, AxisLeft, getNiceAxisLimits } from "./Axes";
import type { ChartData } from "./Base";
import { Legend } from "./Legend";

export interface Point {
  x: number;
  y: number;
}

export default function LinePlot({
  data,
  xlabel,
  ylabel,
}: { data: () => ChartData<Point>[]; xlabel?: string; ylabel?: string }) {
  // TODO: Make responsive
  // const margin = [30, 40, 20, 45]; // reference from skew-T
  const [marginTop, marginRight, marginBottom, marginLeft] = [20, 20, 35, 55];
  const width = 500;
  const height = 500;
  const w = 500 - marginRight - marginLeft;
  const h = 500 - marginTop - marginBottom;

  const xLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.x)));
  const yLim = () =>
    getNiceAxisLimits(data().flatMap((d) => d.data.flatMap((d) => d.y)));
  const scaleX = () => d3.scaleLinear(xLim(), [0, w]);
  const scaleY = () => d3.scaleLinear(yLim(), [h, 0]);

  const l = d3.line<Point>(
    (d) => scaleX()(d.x),
    (d) => scaleY()(d.y),
  );

  return (
    <figure>
      <Legend entries={data} width={`w-[${width}px]`} />
      {/* Plot */}
      <svg
        width={width}
        height={height}
        class="text-slate-500 text-xs tracking-wide"
      >
        <g transform={`translate(${marginLeft},${marginTop})`}>
          <title>Vertical profile plot</title>
          {/* Axes */}
          <AxisBottom
            scale={scaleX()}
            transform={`translate(0,${h - 0.5})`}
            label={xlabel}
          />
          <AxisLeft
            scale={scaleY()}
            transform="translate(-0.5,0)"
            label={ylabel}
          />

          {/* Line */}
          <For each={data()}>
            {(d) => (
              <path
                fill="none"
                stroke={d.color}
                stroke-dasharray={d.linestyle}
                stroke-width="3"
                d={l(d.data) || ""}
              >
                <title>{d.label}</title>
              </path>
            )}
          </For>
        </g>
      </svg>
    </figure>
  );
}
