import { For } from "solid-js";
import { Button } from "~/components/ui/button";
import type { Experiment, Permutation } from "~/lib/store";

function AddPermutationButton(props: { experimentId: string }) {
  return <Button variant="outline">Add permutation</Button>;
}

function PermutationInfo(props: {
  experimentId: string;
  permutationName: string;
  perm: Permutation;
}) {
  return (
    <div>
      <span>{props.permutationName}</span>
      {/* TODO show difference between reference configuration and this permutation */}
      <Button variant="outline">View</Button>
      <Button variant="outline">Edit</Button>
      <Button variant="outline">Delete</Button>
    </div>
  );
}

export function PermutationsList(props: { experiment: Experiment }) {
  return (
    <div>
      <AddPermutationButton experimentId={props.experiment.id} />
      <ul>
        <For each={Object.entries(props.experiment.permutations)}>
          {([key, perm]) => (
            <li>
              <PermutationInfo
                experimentId={props.experiment.id}
                permutationName={key}
                perm={perm}
              />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
