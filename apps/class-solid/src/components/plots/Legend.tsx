import { For } from "solid-js";
import { cn } from "~/lib/utils";
import { Checkbox } from "../ui/checkbox";
import type { ChartData } from "./ChartContainer";
import { useChartContext } from "./ChartContainer";

export interface LegendProps<T> {
  entries: () => ChartData<T>[];
  toggles: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}

export function Legend<T>(props: LegendProps<T>) {
  const [chart, updateChart] = useChartContext();

  return (
    <div
      class={cn(
        "flex flex-wrap justify-end text-sm tracking-tight",
        `w-[${chart.width}px]`,
      )}
    >
      <For each={props.entries()}>
        {(d) => (
          <div class=" flex gap-1">
            <Checkbox
              checked={props.toggles[d.label]}
              onChange={(v) => props.onChange(d.label, v)}
            />
            <p style={`color: ${d.color}`}>{d.label}</p>
          </div>
        )}
      </For>
    </div>
  );
}
