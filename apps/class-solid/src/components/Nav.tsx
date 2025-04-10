import { A, useLocation } from "@solidjs/router";
import { saveToLocalStorage } from "~/lib/state";
import { ShareButton } from "./ShareButton";
import { MdiContentSave } from "./icons";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path === location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";
  return (
    <nav class="bg-sky-800">
      <ul class="container flex items-center gap-4 p-3 text-gray-200">
        <li class={`border-b-2 ${active("/")}l`}>
          <A href="/">CLASS</A>
        </li>
        <li class=" w-full" />
        <li class={`border-b-2 ${active("/about")}`}>
          <A href="/about">About</A>
        </li>
        <li>
          <button
            type="button"
            class="flex items-center gap-2 border-transparent border-b-2 hover:border-sky-600"
            onClick={() => saveToLocalStorage()}
            title="Save application state, so when visiting the page again, the state can be restored"
          >
            Save <MdiContentSave />
          </button>
        </li>
        <li>
          <ShareButton />
        </li>
      </ul>
    </nav>
  );
}
