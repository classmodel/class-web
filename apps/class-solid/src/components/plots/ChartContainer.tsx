import * as d3 from "d3";
import type { JSX } from "solid-js";
import {
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import { type SetStoreFunction, createStore, produce } from "solid-js/store";
import { resetPlot } from "../Analysis";

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
  id: string;
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

  createEffect(() => {
    if (resetPlot() === props.id) {
      updateChart(
        produce((prev) => {
          prev.zoom = 1;
          prev.pan = [0, 0];
        }),
      );
    }
  });

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
      // Correct for skewed lines in thermodynamic diagram
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

      const dx =
        chart.scalePropsX.type === "log"
          ? Math.log10(x) - Math.log10(startX)
          : x - startX;

      const dy =
        chart.scalePropsY.type === "log"
          ? Math.log10(y) - Math.log10(startY)
          : y - startY;

      updateChart("pan", (prev) => [prev[0] - dx, prev[1] - dy]);
    } else {
      // Update the coordinate tracker in the plot
      setDataCoords([x, y]);
    }
  };

  const onWheel = (e: WheelEvent) => {
    // Zoom towards cursor
    e.preventDefault();
    const zoomFactor = 1.1;
    const zoomDirection = e.deltaY < 0 ? 1 : -1;
    const zoomChange = zoomFactor ** zoomDirection;

    const [cursorX, cursorY] = getDataCoordsFromEvent(e);

    updateChart(
      produce((draft) => {
        const { scalePropsX, scalePropsY, pan } = draft;
        const [panX, panY] = pan;

        // Calculate x-pan (linear only for now)
        const [xmin, xmax] = scalePropsX.domain;
        const centerX = (xmin + xmax) / 2 + panX;
        const dx = cursorX - centerX;

        // Calculate y-pan
        const [ymin, ymax] = scalePropsY.domain;
        let dy: number;
        if (scalePropsY.type === "log") {
          const logCursor = Math.log10(Math.max(cursorY, 1e-10));
          const logCenter = (Math.log10(ymin) + Math.log10(ymax)) / 2 + panY;
          dy = logCursor - logCenter;
        } else {
          const centerY = (ymin + ymax) / 2 + panY;
          dy = cursorY - centerY;
        }

        // Update the chart (mutating plays nicely with produce)
        draft.zoom *= zoomChange;
        draft.pan[0] += dx * (1 - 1 / zoomChange);
        draft.pan[1] += dy * (1 - 1 / zoomChange);
      }),
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
