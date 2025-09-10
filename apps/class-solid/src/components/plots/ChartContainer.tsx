import * as d3 from "d3";
import type { JSX } from "solid-js";
import {
  createContext,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import { type SetStoreFunction, createStore, produce } from "solid-js/store";
import { cn } from "~/lib/utils";
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
  originalDomainX: [number, number];
  originalDomainY: [number, number];
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
    originalDomainX: [0, 1],
    originalDomainY: [0, 1],
    scaleX: initialScale,
    scaleY: initialScale,
    formatX: d3.format(".4"),
    formatY: d3.format(".4"),
  });
  // Set original domains based on initial scale props
  updateChart("originalDomainX", () => chart.scalePropsX.domain);
  updateChart("originalDomainY", () => chart.scalePropsY.domain);

  // Update scales when props change
  createEffect(() => {
    const scaleX = supportedScales[chart.scalePropsX.type]()
      .range(chart.scalePropsX.range)
      .domain(chart.scalePropsX.domain);

    const scaleY = supportedScales[chart.scalePropsY.type]()
      .range(chart.scalePropsY.range)
      .domain(chart.scalePropsY.domain);

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
  formatX?: () => (value: number) => string;
  formatY?: () => (value: number) => string;
  transformX?: (x: number, y: number, scaleY: SupportedScaleTypes) => number;
}) {
  const [zoomRectData, setZoomRectData] = createSignal<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [zoomRectPixel, setZoomRectPixel] = createSignal<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [hovering, setHovering] = createSignal(false);
  const [dataCoords, setDataCoords] = createSignal<[number, number]>([0, 0]);
  const [chart, updateChart] = useChartContext();
  const title = props.title || "Default chart";
  const [marginTop, _, __, marginLeft] = chart.margin;

  function resetZoom() {
    updateChart(
      produce((draft) => {
        draft.scalePropsX.domain = draft.originalDomainX;
        draft.scalePropsY.domain = draft.originalDomainY;
      }),
    );
  }

  // Reset zoom/pan when requested from outside (button outside chart area)
  createEffect(() => {
    if (resetPlot() === props.id) {
      resetZoom();
    }
  });

  // Update formatters and transform function when props change
  createEffect(() => {
    if (props.formatX) updateChart("formatX", () => props.formatX?.());
    if (props.formatY) updateChart("formatY", () => props.formatY?.());
    if (props.transformX) updateChart("transformX", () => props.transformX);
  });

  // Utility function to calculate coordinates from mouse event
  const getDataCoordsFromEvent = (e: MouseEvent, applyTransform = true) => {
    let x = e.offsetX - marginLeft;
    const y = e.offsetY - marginTop;

    if (applyTransform && chart.transformX) {
      // Correct for skewed lines in thermodynamic diagram
      x = chart.transformX(x, y, chart.scaleY);
    }

    return [chart.scaleX.invert(x), chart.scaleY.invert(y)];
  };

  function getPixelCoordsFromEvent(e: MouseEvent) {
    const x = e.offsetX - marginLeft; // x relative to chart area
    const y = e.offsetY - marginTop; // y relative to chart area
    return [x, y] as [number, number];
  }

  const onMouseDown = (e: MouseEvent) => {
    const [xd, yd] = getDataCoordsFromEvent(e, false);
    const [xp, yp] = getPixelCoordsFromEvent(e);

    setZoomRectPixel({ x0: xp, y0: yp, x1: xp, y1: yp });
    setZoomRectData({ x0: xd, y0: yd, x1: xd, y1: yd });
  };

  const onMouseMove = (e: MouseEvent) => {
    // Update the coordinate tracker in the plot
    const [xdSkew, ydSkew] = getDataCoordsFromEvent(e, true);
    setDataCoords([xdSkew, ydSkew]);

    // Update zoom rectangle if drawing
    const [xd, yd] = getDataCoordsFromEvent(e, false);
    const [xp, yp] = getPixelCoordsFromEvent(e);

    setZoomRectPixel((zr) => (zr ? { ...zr, x1: xp, y1: yp } : null));
    setZoomRectData((zr) => (zr ? { ...zr, x1: xd, y1: yd } : null));
  };

  const onMouseUp = () => {
    // Apply zoom if a rectangle was drawn
    const newZoomData = zoomRectData(); // enable type narrowing for null check
    const newZoomPixels = zoomRectData();

    if (!newZoomData || !newZoomPixels) return;

    // Don't zoom if the rectangle is too small (ie just a click)
    const { x0: x0p, x1: x1p, y0: y0p, y1: y1p } = newZoomPixels;
    if (Math.abs(x1p - x0p) < 5 || Math.abs(y1p - y0p) < 5) {
      setZoomRectData(null);
      setZoomRectPixel(null);
      return;
    }

    const { x0, x1, y0, y1 } = newZoomData;

    updateChart(
      produce((draft) => {
        // Handle log scales
        const scaleX = draft.scalePropsX;
        const scaleY = draft.scalePropsY;

        draft.scalePropsX.domain =
          scaleX.type === "log"
            ? [Math.max(Math.min(x0, x1), 1e-10), Math.max(x0, x1)]
            : [Math.min(x0, x1), Math.max(x0, x1)];

        draft.scalePropsY.domain =
          // logY is used for skew-T, use inverse Y-axis and prevent zero/negative
          scaleY.type === "log"
            ? [Math.max(y0, y1), Math.max(Math.min(y0, y1), 1e-10)]
            : [Math.min(y0, y1), Math.max(y0, y1)];
      }),
    );

    setZoomRectData(null);
    setZoomRectPixel(null);
  };

  const cancelZoomRect = () => {
    setZoomRectData(null);
    setZoomRectPixel(null);
  };

  const renderXCoord = () =>
    hovering() ? `x: ${chart.formatX(dataCoords()[0])}` : "";
  const renderYCoord = () =>
    hovering() ? `y: ${chart.formatY(dataCoords()[1])}` : "";

  const drawZoomRect = () => {
    const newBounds = zoomRectPixel();
    if (!newBounds) return;

    const { x0, y0, x1, y1 } = newBounds;

    return (
      <rect
        x={Math.min(x0, x1)}
        y={Math.min(y0, y1)}
        width={Math.abs(x1 - x0)}
        height={Math.abs(y1 - y0)}
        fill="rgba(0,0,255,0.2)"
        stroke="blue"
        stroke-width={1}
      />
    );
  };

  return (
    <svg
      width={chart.width}
      height={chart.height}
      class={cn(
        "text-slate-500 text-xs tracking-wide",
        zoomRectData() ? "cursor-crosshair select-none" : "cursor-crosshair",
      )}
      onmouseover={() => setHovering(true)}
      onmouseout={() => setHovering(false)}
      onmousedown={onMouseDown}
      onmousemove={onMouseMove}
      onmouseup={onMouseUp}
      ondblclick={resetZoom}
      onmouseleave={cancelZoomRect}
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
        {zoomRectData() && drawZoomRect()}
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
