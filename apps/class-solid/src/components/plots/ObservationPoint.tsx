import { useChartContext } from "./ChartContainer";

export function ObservationPoint(p: { x: number; y: number }) {
  const [chart, updateChart] = useChartContext();

  const cx = () => chart.scaleX(p.x + 273.15);
  const cy = () => chart.scaleY(p.y);
  return (
    <circle
      cx={cx()}
      cy={cy()}
      r={2}
      fill="red"
      stroke="black"
      stroke-width="1"
    />
  );
}
