import * as d3 from "d3";
import type { JSX } from "solid-js";
import {
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import { type SetStoreFunction, createStore, produce } from "solid-js/store";

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
  zoom: number;
  pan: [number, number];
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
    zoom: 1,
    pan: [0, 0],
  });

  // Update scales when props change
  createEffect(() => {
    const [minX, maxX] = chart.scalePropsX.domain;
    const [minY, maxY] = chart.scalePropsY.domain;
    const [panX, panY] = chart.pan;
    const zoom = chart.zoom;

    const zoomedXDomain = getZoomedAndPannedDomainLinear(
      minX,
      maxX,
      panX,
      zoom,
    );
    const scaleX = supportedScales[chart.scalePropsX.type]()
      .range(chart.scalePropsX.range)
      .domain(zoomedXDomain);

    const zoomedYDomain =
      chart.scalePropsY.type === "log"
        ? getZoomedAndPannedDomainLog(minY, maxY, panY, zoom)
        : getZoomedAndPannedDomainLinear(minY, maxY, panY, zoom);

    const scaleY = supportedScales[chart.scalePropsY.type]()
      .range(chart.scalePropsY.range)
      .domain(zoomedYDomain);

    updateChart(
      produce((prev) => {
        prev.scaleX = scaleX;
        prev.scaleY = scaleY;
      }),
    );
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
  const [panning, setPanning] = createSignal(false);
  const [dataCoords, setDataCoords] = createSignal<[number, number]>([0, 0]);
  const [chart, updateChart] = useChartContext();
  const title = props.title || "Default chart";
  const [marginTop, _, __, marginLeft] = chart.margin;
  let panstart = [0, 0];

  if (props.formatX) {
    updateChart("formatX", () => props.formatX);
  }
  if (props.formatY) {
    updateChart("formatY", () => props.formatY);
  }
  if (props.transformX) {
    updateChart("transformX", () => props.transformX);
  }

  // Utility function to calculate coordinates from mouse event
  const getDataCoordsFromEvent = (e: MouseEvent) => {
    let x = e.offsetX - marginLeft;
    const y = e.offsetY - marginTop;

    if (chart.transformX) {
      x = chart.transformX(x, y, chart.scaleY);
    }

    return [chart.scaleX.invert(x), chart.scaleY.invert(y)];
  };

  const onMouseDown = (e: MouseEvent) => {
    setPanning(true);
    panstart = getDataCoordsFromEvent(e);
  };

  const onMouseMove = (e: MouseEvent) => {
    const [x, y] = getDataCoordsFromEvent(e);

    if (panning()) {
      const [startX, startY] = panstart;
      const dx = x - startX;
      const dy = y - startY;
      panstart = [x, y];
      updateChart("pan", (prev) => [prev[0] - dx, prev[1] - dy]);
    } else {
      // Update the coordinate tracker in the plot
      setDataCoords([x, y]);
    }
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    updateChart("zoom", (prev) =>
      e.deltaY < 0 ? prev * zoomFactor : prev / zoomFactor,
    );
  };

  const renderXCoord = () =>
    hovering() ? `x: ${chart.formatX(dataCoords()[0])}` : "";
  const renderYCoord = () =>
    hovering() ? `y: ${chart.formatY(dataCoords()[1])}` : "";

  return (
    <svg
      width={chart.width}
      height={chart.height}
      class="text-slate-500 text-xs tracking-wide"
      onmouseover={() => setHovering(true)}
      onmouseout={() => setHovering(false)}
      onmousedown={onMouseDown}
      onmouseup={() => setPanning(false)}
      onmousemove={onMouseMove}
      onmouseleave={() => setPanning(false)}
      onwheel={onWheel}
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
      <ClipPath />
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

// To constrain lines and other elements to the axes' extent
function ClipPath() {
  const [chart, _updateChart] = useChartContext();

  return (
    <clipPath id="clipper">
      <rect x="0" y="0" width={chart.innerWidth} height={chart.innerHeight} />
    </clipPath>
  );
}

export interface ChartData<T> {
  label: string;
  color: string;
  linestyle: string;
  data: T[];
}

export function highlight(hex: string) {
  const g = 246; // gray level
  const b = (h: string, i: number) =>
    Math.round(Number.parseInt(h.slice(i, i + 2), 16) * 0.5 + g * 0.5)
      .toString(16)
      .padStart(2, "0");
  return `#${b(hex, 1)}${b(hex, 3)}${b(hex, 5)}`;
}

function getZoomedAndPannedDomainLinear(
  min: number,
  max: number,
  pan: number,
  zoom: number,
): [number, number] {
  const center = (min + max) / 2 + pan;
  const halfExtent = (max - min) / (2 * zoom);
  return [center - halfExtent, center + halfExtent];
}

function getZoomedAndPannedDomainLog(
  min: number,
  max: number,
  pan: number,
  zoom: number,
): [number, number] {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);

  const logCenter = (logMin + logMax) / 2 + pan;
  const halfExtent = (logMax - logMin) / (2 * zoom);

  const newLogMin = logCenter - halfExtent;
  const newLogMax = logCenter + halfExtent;

  return [10 ** newLogMin, 10 ** newLogMax];
}
