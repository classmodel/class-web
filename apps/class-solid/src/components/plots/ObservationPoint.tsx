import { useChartContext } from "./ChartContainer";

export function ObservationPoint(p: { x: number; y: number }) {
  const [chart, updateChart] = useChartContext();

  const cx = () => chart.scaleX(p.x);
  const cy = () => chart.scaleY(p.y);

  return (
    <circle
      cx={cx()}
      cy={cy()}
      // cx={100}
      // cy={200}
      r={2}
      fill="red"
      stroke="black"
      stroke-width="1"
    />
  );
}
