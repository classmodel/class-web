import * as d3 from "d3";
import { AxisBottom, AxisLeft } from "./Axes";

interface LinePlotProps {
  x: number[];
  y: number[];
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

  function safeExtent(
    array: number[],
    fallback: [number, number] = [0, 1],
  ): [number, number] {
    const extent = d3.extent(array);
    return extent[0] == null || extent[1] == null ? fallback : extent;
  }

  // TODO: modify extent to give a bit of spacing to both sides and have logical tick labels
  const extentX = safeExtent(x);
  const extentY = safeExtent(y, [0, 2000]);

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
