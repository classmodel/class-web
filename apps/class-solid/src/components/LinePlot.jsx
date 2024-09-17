
import { extent, line, scaleLinear, ticks } from "d3";

export default function LinePlot({
  width = 450,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20
}) {
  const data = ticks(-2, 2, 200)
  const x = scaleLinear([0, data.length - 1], [marginLeft, width - marginRight]);
  const y = scaleLinear(extent(data), [height - marginBottom, marginTop]);
  const l = line((d, i) => x(i), y);

  return (
    <svg width={width} height={height}>
      <path fill="none" stroke="currentColor" strokeWidth="1.5" d={l(data)} />
      <g fill="white" stroke="currentColor" strokeWidth="1.5">
        {data.map((d, i) => (<circle key={i} cx={x(i)} cy={y(d)} r="2.5" />))}
      </g>
    </svg>
  );
}
