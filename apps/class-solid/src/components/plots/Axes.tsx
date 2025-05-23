// Code generated by AI and checked/modified for correctness

import { For, createEffect } from "solid-js";
import { useChartContext } from "./ChartContainer";

type AxisProps = {
  type?: "linear" | "log";
  domain?: () => [number, number]; // TODO: is this needed for reactivity?
  label?: string;
  tickValues?: number[];
};

export const AxisBottom = (props: AxisProps) => {
  const [chart, updateChart] = useChartContext();
  createEffect(() => {
    props.domain && updateChart("scalePropsX", { domain: props.domain() });
    props.type && updateChart("scalePropsX", { type: props.type });
  });

  const ticks = () => props.tickValues || generateTicks(chart.scaleX.domain());
  return (
    <g transform={`translate(0,${chart.innerHeight - 0.5})`}>
      <line x1="0" x2={chart.innerWidth} y1="0" y2="0" stroke="currentColor" />
      <For each={ticks()}>
        {(tick) => (
          <g transform={`translate(${chart.scaleX(tick)}, 0)`}>
            <line y2="6" stroke="currentColor" />
            <text y="9" dy="0.71em" text-anchor="middle">
              {chart.formatX(tick)}
            </text>
          </g>
        )}
      </For>
      <text x={chart.innerWidth} y="9" dy="2em" text-anchor="end">
        {props.label}
      </text>
    </g>
  );
};

export const AxisLeft = (props: AxisProps) => {
  const [chart, updateChart] = useChartContext();
  createEffect(() => {
    props.domain && updateChart("scalePropsY", { domain: props.domain() });
    props.type && updateChart("scalePropsY", { type: props.type });
  });

  const ticks = () => props.tickValues || generateTicks(chart.scaleY.domain());
  return (
    <g transform="translate(-0.5,0)">
      <line
        x1={0}
        x2={0}
        y1={chart.scaleY.range()[0]}
        y2={chart.scaleY.range()[1]}
        stroke="currentColor"
      />
      <For each={ticks()}>
        {(tick) => (
          <g transform={`translate(0, ${chart.scaleY(tick)})`}>
            <line x2="-6" stroke="currentColor" />
            <text x="-9" dy="0.32em" text-anchor="end">
              {chart.formatY(tick)}
            </text>
          </g>
        )}
      </For>
      <text y="0" text-anchor="end" transform="translate(-45, 0) rotate(-90)">
        {props.label}
      </text>
    </g>
  );
};

/**
 * Calculate a "nice" step size by rounding up to the nearest power of 10
 * Snap the min and max to the nearest multiple of step
 */
export function getNiceAxisLimits(
  data: number[],
  extraMargin = 0,
  roundTo?: number, // Optional rounding step, e.g. 600 for 10 minutes
): [number, number] {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Avoid NaNs on axis for constant values
  if (range === 0) return [min - 1, max + 1];

  const step = roundTo ?? 10 ** Math.floor(Math.log10(range));

  const niceMin = Math.floor(min / step) * step - extraMargin * step;
  const niceMax = Math.ceil(max / step) * step + extraMargin * step;

  return [niceMin, niceMax];
}

/** Generate evenly space tick values for a linear scale */
const generateTicks = (domain = [0, 1], tickCount = 5) => {
  const step = (domain[1] - domain[0]) / (tickCount - 1);
  return [...Array(10).keys()].map((i) => domain[0] + i * step);
};
