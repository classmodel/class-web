import { useLocation, useNavigate } from "@solidjs/router";
import { showToast } from "~/components/ui/toast";
import { encodeAppState } from "./encode";
import { analyses, experiments, loadStateFromString } from "./store";

export async function onPageLoad() {
  const location = useLocation();
  const navigate = useNavigate();
  let rawState = location.hash.substring(1);
  if (!rawState) {
    // If no state in URL, check if there is a state in local storage
    const rawStateFromLocalStorage = localStorage.getItem(localStorageName);
    if (
      rawStateFromLocalStorage &&
      rawStateFromLocalStorage !==
        "%7B%22experiments%22%3A%5B%5D%2C%22analyses%22%3A%5B%5D%7D" &&
      // TODO prompt is annoying when developing, disable during development?
      window.confirm("Would you like to resume from the previous session?")
    ) {
      rawState = rawStateFromLocalStorage;
    }
  }
  if (!rawState) {
    return;
  }
  try {
    // TODO show loading spinner
    await loadStateFromString(rawState);
    showToast({
      title: "State loaded from URL",
      variant: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error(error);
    showToast({
      title: "Failed to load state from URL",
      description: `${error}`,
      variant: "error",
    });
  }
  // Remove hash after loading experiment from URL,
  // as after editing the experiment the hash out of sync
  navigate("/");
}

const localStorageName = "class-state";

export function onPageLeave() {
  const appState = encodeAppState(experiments, analyses);
  localStorage.setItem(localStorageName, appState);
}
