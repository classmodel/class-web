import { For } from "solid-js";
import { createUniqueId } from "solid-js";
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
      class={"flex flex-wrap justify-end gap-2 text-sm tracking-tight"}
      style={`max-width: ${chart.width}px;`}
    >
      <For each={props.entries()}>
        {(d) => {
          const id = createUniqueId();
          return (
            <div
              class="flex items-center gap-1"
              style={`color: ${d.color}; accent-color: ${d.color}`}
            >
              <input
                type="checkbox"
                checked={props.toggles[d.label]}
                onChange={(v) =>
                  props.onChange(d.label, v.currentTarget.checked)
                }
                id={id}
              />
              <label for={id}>{d.label}</label>
            </div>
          );
        }}
      </For>
    </div>
  );
}
