import { For, Show } from "solid-js";
import type { Observation } from "~/lib/experiment_config";

export function ObservationsList(props: {
  observations: Observation[] | undefined;
}) {
  return (
    <Show when={props.observations !== undefined}>
      <section aria-label="observations" class="justify-self-center">
        <h2 class="text-lg">Observations</h2>
        <ul class="max-h-40 overflow-auto py-2">
          <For each={props.observations}>
            {(obs) => (
              <li class="mb-1 flex flex-row items-center justify-between border-l-4 px-2 py-1 shadow">
                {obs.name}
              </li>
            )}
          </For>
        </ul>
      </section>
    </Show>
  );
}
