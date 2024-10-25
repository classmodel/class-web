// Simple line plot with d3.

import * as d3 from "d3";
import { AxisBottom, AxisLeft } from "./Axes";

interface LinePlotProps {
  x: number; // mixed-layer value
  dx: number; // jump at top of mixed layer
  gammax: number; // free-troposphere lapse rate
  h: number; // height of mixed layer
  width?: number;
  height?: number;
  margin?: number[];
}

export default function LinePlot(props: LinePlotProps) {
  const x = props.x;
  const y = props.y;
  const width = props.width || 450;
  const height = props.height || 400;
  const [marginTop, marginRight, marginBottom, marginLeft] = props.margin || [
    50, 50, 50, 50,
  ];

  // TODO: modify extent to give a bit of spacing to both sides and have logical tick labels
  const extentX = [];
  const extentY = [0, Math.max(1.5 * props.h, 2000)];

  const scaleX = d3.scaleLinear(extentX, [marginLeft, width - marginRight]);
  const scaleY = d3.scaleLinear(extentY, [height - marginBottom, marginTop]);

  const l = d3.line((d, i) => scaleX(x[i]), scaleY);

  return (
    <svg width={width} height={height} class="">
      <title>Vertical profile plot</title>
      <AxisBottom
        scale={scaleX}
        transform={`translate(0, ${height - marginBottom})`}
      />
      <AxisLeft scale={scaleY} transform={`translate(${marginLeft}, 0)`} />
      <path fill="none" stroke="currentColor" stroke-width="1.5" d={l(y)} />
      <g fill="white" stroke="currentColor" stroke-width="1.5">
        {y.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <circle key={i} cx={scaleX(x[i])} cy={scaleY(d)} r="2.5" />
        ))}
      </g>
    </svg>
  );
}
