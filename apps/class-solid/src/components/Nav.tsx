import { useLocation } from "@solidjs/router";
import { saveAppState } from "~/lib/onPageTransition";
import { ShareButton } from "./ShareButton";
import { MdiContentSave } from "./icons";
import { Button } from "./ui/button";

export default function Nav() {
  const location = useLocation();
  const active = (path: string) =>
    path === location.pathname
      ? "border-sky-600"
      : "border-transparent hover:border-sky-600";
  return (
    <nav class="bg-sky-800">
      <ul class="container flex items-center p-3 text-gray-200">
        <li class={`border-b-2 ${active("/")} mx-1.5 sm:mx-6`}>
          <a href="/">CLASS</a>
        </li>
        <li class={`border-b-2 ${active("/about")} mx-1.5 sm:mx-6`}>
          <a href="/about">About</a>
        </li>
        <li>
          {/* TODO move right */}
          <ShareButton />
        </li>
        <li>
          {/* TODO style button same as other menu items */}
          <Button variant="ghost" onClick={() => saveAppState()}>
            <MdiContentSave /> Save
          </Button>
        </li>
      </ul>
    </nav>
  );
}
