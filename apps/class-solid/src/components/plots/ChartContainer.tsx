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

export function useChartContext() {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error(
      "useChartContext must be used within a ChartProvider; typically by wrapping your components in a ChartContainer.",
    );
  }
  return context;
}

function Child() {
  const [chart, updateChart] = useChartContext();
  console.log(chart);
  console.log("test");
  return <p>test</p>;
}

export function ChartContainer({
  width = 500,
  height = 500,
  margin = [20, 20, 35, 55],
  title = "Default chart",
  children,
}: {
  width?: number;
  height?: number;
  margin?: [number, number, number, number];
  title?: string;
  children: JSX.Element;
}) {
  const [marginTop, marginRight, marginBottom, marginLeft] = margin;
  const innerHeight = height - marginTop - marginBottom;
  const innerWidth = width - marginRight - marginLeft;
  const dummy = [
    { color: "blue", label: "blue", linestyle: "--", data: [{ x: 10, y: 10 }] },
  ];
  const [chart, updateChart] = createStore<Chart>({
    width: width,
    height,
    margin,
    innerHeight,
    innerWidth,
    scaleX: d3.scaleLinear().range([0, innerWidth]),
    scaleY: d3.scaleLinear().range([innerHeight, 0]),
  });
  return (
    <ChartContext.Provider value={[chart, updateChart]}>
      <figure>
        <svg
          width={width}
          height={height}
          class="text-slate-500 text-xs tracking-wide"
        >
          <title>{title}</title>
          <g transform={`translate(${marginLeft},${marginTop})`}>
            <Child />
            {children}
          </g>
        </svg>
      </figure>
    </ChartContext.Provider>
  );
}
