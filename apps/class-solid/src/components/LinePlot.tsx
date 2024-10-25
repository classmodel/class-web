import * as d3 from "d3";

export default function LinePlot({
  // x,  # TODO pass data into plot
  // y,
  width = 450,
  height = 400,
  marginTop = 20,
  marginRight = 20,
  marginBottom = 20,
  marginLeft = 20,
}) {
  const x = [10, 10, 5, 4, 3, 2, 1]; // Dummy theta
  const y = [0, 1000, 1000, 1100, 1200, 1300, 1400]; // Dummy height

  const scaleX = d3.scaleLinear([0, 10], [marginLeft, width - marginRight]);
  const scaleY = d3.scaleLinear([0, 2000], [height - marginBottom, marginTop]);

  const l = d3.line((d, i) => scaleX(x[i]), scaleY);

  return (
    <svg width={width} height={height} class="border-2 border-black">
      <title>Vertical profile plot</title>
      <g transform={`translate(0,${height - marginBottom})`} />
      <g transform={`translate(${marginLeft},0)`} />
      <path fill="none" stroke="currentColor" strokeWidth="1.5" d={l(y)} />
      <g fill="white" stroke="currentColor" strokeWidth="1.5">
        {y.map((d, i) => (
          <circle key={i} cx={scaleX(x[i])} cy={scaleY(d)} r="2.5" />
        ))}
      </g>
    </svg>
  );
}
