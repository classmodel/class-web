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
          <For each={props.observations}>{(obs) => <li>{obs.name}</li>}</For>
        </ul>
      </section>
    </Show>
  );
}
