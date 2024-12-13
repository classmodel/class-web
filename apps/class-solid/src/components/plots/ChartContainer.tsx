import * as d3 from "d3";
import type { JSX } from "solid-js";
import { createContext, createEffect, useContext } from "solid-js";
import { type SetStoreFunction, createStore } from "solid-js/store";

type SupportedScaleTypes =
  | d3.ScaleLinear<number, number, never>
  | d3.ScaleLogarithmic<number, number, never>;
const supportedScales = {
  linear: d3.scaleLinear<number, number, never>,
  log: d3.scaleLog<number, number, never>,
};

type ScaleProps = {
  domain: [number, number];
  range: [number, number];
  type: keyof typeof supportedScales;
};

interface Chart {
  width: number;
  height: number;
  margin: [number, number, number, number];
  innerWidth: number;
  innerHeight: number;
  scalePropsX: ScaleProps;
  scalePropsY: ScaleProps;
  scaleX: SupportedScaleTypes;
  scaleY: SupportedScaleTypes;
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
  const initialScale = d3.scaleLinear<number, number, never>();
  const [chart, updateChart] = createStore<Chart>({
    width,
    height,
    margin,
    innerHeight,
    innerWidth,
    scalePropsX: { type: "linear", domain: [0, 1], range: [0, innerWidth] },
    scalePropsY: { type: "linear", domain: [0, 1], range: [innerHeight, 0] },
    scaleX: initialScale,
    scaleY: initialScale,
  });
  createEffect(() => {
    // Update scaleXInstance when scaleX props change
    const scaleX = supportedScales[chart.scalePropsX.type]()
      .range(chart.scalePropsX.range)
      .domain(chart.scalePropsX.domain);
    updateChart("scaleX", () => scaleX);
  });

  createEffect(() => {
    // Update scaleYInstance when scaleY props change
    const scaleY = supportedScales[chart.scalePropsY.type]()
      .range(chart.scalePropsY.range)
      .domain(chart.scalePropsY.domain);
    updateChart("scaleY", () => scaleY);
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
export interface ChartData<T> {
  label: string;
  color: string;
  linestyle: string;
  data: T[];
}

// export function scale(props: ScaleProps): SupportedScaleTypes {
//   const scale = supportedScales[props.type]()
//     .range(props.range)
//     .domain(props.domain);
//   return scale;
// }
