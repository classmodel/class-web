import { useLocation, useNavigate } from "@solidjs/router";
import { showToast } from "~/components/ui/toast";
import { encodeAppState } from "./encode";
import { analyses, experiments, loadStateFromString } from "./store";

const localStorageName = "class-state";

export function hasLocalStorage() {
  const state = localStorage.getItem(localStorageName);
  return (
    state !== null &&
    state !== "%7B%22experiments%22%3A%5B%5D%2C%22analyses%22%3A%5B%5D%7D"
  );
}

export function loadFromLocalStorage() {
  const rawState = localStorage.getItem(localStorageName);
  if (!rawState) {
    return;
  }
  try {
    loadStateFromString(rawState);
    showToast({
      title: "State loaded from local storage",
      variant: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error(error);
    showToast({
      title: "Failed to load state from local storage",
      description: `${error}`,
      variant: "error",
    });
  }
}

export async function onPageLoad() {
  const location = useLocation();
  const navigate = useNavigate();
  const rawState = location.hash.substring(1);
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

export function saveAppState() {
  const appState = encodeAppState(experiments, analyses);
  if (
    appState === "%7B%22experiments%22%3A%5B%5D%2C%22analyses%22%3A%5B%5D%7D"
  ) {
    localStorage.removeItem(localStorageName);
  }
  localStorage.setItem(localStorageName, appState);
}
