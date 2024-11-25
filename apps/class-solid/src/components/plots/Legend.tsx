import { For } from "solid-js";
import { cn } from "~/lib/utils";
import type { ChartData } from "./Base";

export interface LegendProps<T> {
  entries: () => ChartData<T>[];
  width: string;
}

export function Legend<T>(props: LegendProps<T>) {
  return (
    // {/* Legend */}
    <div
      class={cn(
        "flex flex-wrap justify-end text-sm tracking-tight",
        props.width,
      )}
    >
      <For each={props.entries()}>
        {(d) => (
          <>
            <span class="flex items-center">
              <svg
                width="1.5rem"
                height="1rem"
                overflow="visible"
                viewBox="0 0 50 20"
              >
                <title>legend</title>
                <path
                  fill="none"
                  stroke={d.color}
                  stroke-dasharray={d.linestyle}
                  stroke-width="4"
                  d="M 0 12 L 45 12"
                />
              </svg>
              <p style={`color: ${d.color}`}>{d.label}</p>
            </span>
          </>
        )}
      </For>
    </div>
  );
}
