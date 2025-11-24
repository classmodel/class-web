import { useLocation, useNavigate } from "@solidjs/router";
import { showToast, showToastPromise } from "~/components/ui/toast";
import { encodeAppState } from "./encode";
import { findPresetByName } from "./presets";
import {
  analyses,
  experiments,
  loadStateFromString,
  uploadExperiment,
} from "./store";

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
  const experimentUrl = location.query.e;
  if (experimentUrl) {
    return await loadExperimentFromUrl(experimentUrl);
  }
  const presetUrl = location.query.preset;
  if (presetUrl) {
    return await loadExperimentPreset(presetUrl);
  }
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

async function loadExperimentPreset(presetName: string) {
  const navigate = useNavigate();
  try {
    const reference = findPresetByName(presetName).config;
    await uploadExperiment({
      preset: presetName,
      reference,
      permutations: [],
    });
    showToast({
      title: "Experiment preset loaded",
      variant: "success",
      duration: 1000,
    });
  } catch (error) {
    console.error(error);
    showToast({
      title: "Failed to load preset",
      description: `${error}`,
      variant: "error",
    });
  }
  navigate("/");
}

export function saveToLocalStorage() {
  const appState = encodeAppState(experiments, analyses);
  if (
    appState === "%7B%22experiments%22%3A%5B%5D%2C%22analyses%22%3A%5B%5D%7D"
  ) {
    localStorage.removeItem(localStorageName);
  }
  localStorage.setItem(localStorageName, appState);
  showToast({
    title: "State saved to local storage",
    variant: "success",
    duration: 1000,
  });
}

async function loadExperimentFromUrl(url: string) {
  const navigate = useNavigate();
  showToastPromise(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Failed to download experiment from ${url}: ${response.status} ${response.statusText}`,
        );
      }
      const rawData = await response.json();
      await uploadExperiment(rawData);
      // clear ?e from URL after loading, as any edits would make URL a lie
      navigate("/");
    },
    {
      loading: "Loading experiment from URL...",
      success: () => "Experiment loaded from URL",
      error: (error) => `Failed to load experiment from URL: ${error}`,
      duration: 1000,
    },
  );
}
