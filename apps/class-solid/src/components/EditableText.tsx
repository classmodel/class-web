import { Show, createSignal } from "solid-js";
import { cn } from "~/lib/utils";
import { Button } from "./ui/button";

export function EditableText(props: {
  text: string;
  onChange: (text: string) => void;
  class?: string;
}) {
  const [editing, setEditing] = createSignal(false);
  const fallback = (
    <button
      type="button"
      class={cn(props.class, "group")}
      title="Click to change"
      onClick={(e) => {
        // e.preventDefault();
        setEditing(true);
      }}
    >
      {props.text}
      <span class="invisible ps-1 group-hover:visible">🖉</span>
    </button>
  );
  return (
    <Show when={editing()} fallback={fallback}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          props.onChange(formData.get("text") as string);
          setEditing(false);
        }}
      >
        <input
          name="text"
          type="text"
          value={props.text}
          class="mx-1 rounded border-2 bg-background p-1"
        />
        <Button title="Save" type="submit" variant="ghost">
          🖉
        </Button>
      </form>
    </Show>
  );
}
