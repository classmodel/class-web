import * as d3 from "d3";
import type { JSX } from "solid-js";
import {
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import { type SetStoreFunction, createStore } from "solid-js/store";

export type SupportedScaleTypes =
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
  formatX: (value: number) => string;
  formatY: (value: number) => string;
  transformX?: (x: number, y: number, scaleY: SupportedScaleTypes) => number;
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
    formatX: d3.format(".4"),
    formatY: d3.format(".4"),
  });
  createEffect(() => {
    // Update scaleXInstance when scaleX props change
    const scaleX = supportedScales[chart.scalePropsX.type]()
      .range(chart.scalePropsX.range)
      .domain(chart.scalePropsX.domain);
    // .nice(); // TODO: could use this instead of getNiceAxisLimits but messes up skewT
    updateChart("scaleX", () => scaleX);
  });

  createEffect(() => {
    // Update scaleYInstance when scaleY props change
    const scaleY = supportedScales[chart.scalePropsY.type]()
      .range(chart.scalePropsY.range)
      .domain(chart.scalePropsY.domain);
    // .nice();
    updateChart("scaleY", () => scaleY);
  });
  return (
    <ChartContext.Provider value={[chart, updateChart]}>
      <figure>{props.children}</figure>
    </ChartContext.Provider>
  );
}

/** Container for chart elements such as axes and lines */
export function Chart(props: {
  children: JSX.Element;
  title?: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  transformX?: (x: number, y: number, scaleY: SupportedScaleTypes) => number;
}) {
  const [hovering, setHovering] = createSignal(false);
  const [coords, setCoords] = createSignal<[number, number]>([0, 0]);
  const [chart, updateChart] = useChartContext();
  const title = props.title || "Default chart";
  const [marginTop, _, __, marginLeft] = chart.margin;

  if (props.formatX) {
    updateChart("formatX", () => props.formatX);
  }
  if (props.formatY) {
    updateChart("formatY", () => props.formatY);
  }
  if (props.transformX) {
    updateChart("transformX", () => props.transformX);
  }

  const onMouseMove = (e: MouseEvent) => {
    let x = e.offsetX - marginLeft;
    const y = e.offsetY - marginTop;

    if (chart.transformX) {
      x = chart.transformX(x, y, chart.scaleY);
    }

    setCoords([chart.scaleX.invert(x), chart.scaleY.invert(y)]);
  };

  const renderXCoord = () =>
    hovering() ? `x: ${chart.formatX(coords()[0])}` : "";
  const renderYCoord = () =>
    hovering() ? `y: ${chart.formatY(coords()[1])}` : "";

  return (
    <svg
      width={chart.width}
      height={chart.height}
      class="text-slate-500 text-xs tracking-wide"
      onmouseover={() => setHovering(true)}
      onmousemove={onMouseMove}
      onmouseout={() => setHovering(false)}
    >
      <title>{title}</title>
      <g transform={`translate(${marginLeft},${marginTop})`}>
        {props.children}
        <text x="5" y="5">
          {renderXCoord()}
        </text>
        <text x="5" y="20">
          {renderYCoord()}
        </text>
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
