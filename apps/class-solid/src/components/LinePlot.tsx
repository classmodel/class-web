import * as d3 from "d3";
import { For } from "solid-js";
import { cn } from "~/lib/utils";
import { AxisBottom, AxisLeft } from "./Axes";

export interface ChartData<T> {
  label: string;
  color: string;
  linestyle: string;
  data: T[];
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculate a "nice" step size by rounding up to the nearest power of 10
 * Snap the min and max to the nearest multiple of step
 */
function getNiceAxisLimits(data: number[]): [number, number] {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;
  const step = 10 ** Math.floor(Math.log10(range));

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  return [niceMin, niceMax];
}

export interface LegendProps<T> {
  entries: () => ChartData<T>[];
  width: string;
}

export function Legend<T>(props: LegendProps<T>) {
  return (
    // {/* Legend */}
    <div
      class={cn(
        "flex flex-wrap justify-end text-sm tracking-tight",
        props.width,
      )}
    >
      <For each={props.entries()}>
        {(d) => (
          <>
            <span class="flex items-center">
              <svg
                width="1.5rem"
                height="1rem"
                overflow="visible"
                viewBox="0 0 50 20"
              >
                <title>legend</title>
                <path
                  fill="none"
                  stroke={d.color}
                  stroke-dasharray={d.linestyle}
                  stroke-width="4"
                  d="M 0 12 L 45 12"
                />
              </svg>
              <p style={`color: ${d.color}`}>{d.label}</p>
            </span>
          </>
        )}
      </For>
    </div>
  );
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
