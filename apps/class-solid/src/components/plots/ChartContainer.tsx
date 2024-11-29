import * as d3 from "d3";
import type { JSX } from "solid-js";
import { createContext, useContext } from "solid-js";
import { type SetStoreFunction, createStore } from "solid-js/store";

interface Chart {
  width: number;
  height: number;
  margin: [number, number, number, number];
  innerWidth: number;
  innerHeight: number;
  scaleX: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>;
  scaleY: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number>;
}
type SetChart = SetStoreFunction<Chart>;
const ChartContext = createContext<[Chart, SetChart]>();

/** Container and context manager for chart + legend */
export function ChartContainer(props: {
  children: JSX.Element;
  width?: number;
  height?: number;
  margin?: [number, number, number, number];
}) {
  const width = props.width || 500;
  const height = props.height || 500;
  const margin = props.margin || [20, 20, 35, 55];
  const [marginTop, marginRight, marginBottom, marginLeft] = margin;
  const innerHeight = height - marginTop - marginBottom;
  const innerWidth = width - marginRight - marginLeft;
  const [chart, updateChart] = createStore<Chart>({
    width,
    height,
    margin,
    innerHeight,
    innerWidth,
    scaleX: d3.scaleLinear().range([0, innerWidth]),
    scaleY: d3.scaleLinear().range([innerHeight, 0]),
  });
  return (
    <ChartContext.Provider value={[chart, updateChart]}>
      <figure>{props.children}</figure>
    </ChartContext.Provider>
  );
}

/** Container for chart elements such as axes and lines */
export function Chart(props: { children: JSX.Element; title?: string }) {
  const [chart, updateChart] = useChartContext();
  const title = props.title || "Default chart";
  const [marginTop, _, __, marginLeft] = chart.margin;

  return (
    <svg
      width={chart.width}
      height={chart.height}
      class="text-slate-500 text-xs tracking-wide"
    >
      <title>{title}</title>
      <g transform={`translate(${marginLeft},${marginTop})`}>
        {props.children}
        {/* Line along right edge of plot
        <line
          x1={chart.innerWidth - 0.5}
          x2={chart.innerWidth - 0.5}
          y1="0"
          y2={chart.innerHeight}
          stroke="#dfdfdf"
          stroke-width="0.75px"
          fill="none"
        /> */}
      </g>
    </svg>
  );
}

export function useChartContext() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error(
      "useChartContext must be used within a ChartProvider; typically by wrapping your components in a ChartContainer.",
    );
  }
  return context;
}
