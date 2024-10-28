import * as d3 from "d3";
import { For } from "solid-js";
import { AxisBottom, AxisLeft } from "./Axes";

export interface ChartData {
  label: string;
  x: number[];
  y: number[];
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

/**
 * Zip x and y such that we can iterate over pairs of [x, y] in d3.line
 */
function zipXY(data: ChartData): [number, number][] {
  const length = data.x.length;
  return Array.from({ length }, (_, i) => [data.x[i], data.y[i]]);
}

export default function LinePlot({ data }: { data: ChartData[] }) {
  console.log(data);
  // TODO: Make responsive
  const width = 450;
  const height = 400;
  const [marginTop, marginRight, marginBottom, marginLeft] = [50, 50, 50, 50];

  const xLim = getNiceAxisLimits(data.flatMap((d) => d.x));
  const yLim = getNiceAxisLimits(data.flatMap((d) => d.y));
  const scaleX = d3.scaleLinear(xLim, [marginLeft, width - marginRight]);
  const scaleY = d3.scaleLinear(yLim, [height - marginBottom, marginTop]);

  // const l = d3.line((d, i) => scaleX(x[i]), scaleY);
  const l = d3.line(
    (d) => scaleX(d[0]),
    (d) => scaleY(d[1]),
  );

  return (
    <svg width={width} height={height} class="">
      <title>Vertical profile plot</title>

      {/* Axes */}
      <AxisBottom
        scale={scaleX}
        transform={`translate(0, ${height - marginBottom})`}
      />
      <AxisLeft scale={scaleY} transform={`translate(${marginLeft}, 0)`} />

      {/* Line */}
      <For each={data}>
        {(d) => (
          <path
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            d={l(zipXY(d))}
          />
        )}
      </For>

      {/* Points */}
      {/* <g fill="white" stroke="currentColor" stroke-width="1.5">
        {y.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <circle key={i} cx={scaleX(x[i])} cy={scaleY(d)} r="2.5" />
        ))}
      </g> */}
    </svg>
  );
}
