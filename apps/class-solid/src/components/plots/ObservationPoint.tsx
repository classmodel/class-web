import { useChartContext } from "./ChartContainer";
import type { ChartData } from "./ChartContainer";

export interface SoundingSample {
  p: number;
  T: number;
  theta: number;
}

export function ObsPlot(d: ChartData<SoundingSample>) {
  const [chart, updateChart] = useChartContext();

  const cx = () => chart.scaleX(d.theta + 273.15);
  const cy = () => chart.scaleY();
  return (
    <circle
      cx={cx()}
      cy={cy()}
      r={2}
      fill="red"
      stroke="red"
      stroke-width="1"
    />
  );
}
