/**
 * Nest form rawData to shape of classConfig
 * "initialState.h_0" => { initialState: { h_0: ... } }
 */
// biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
export function inflate(rawData: { [key: string]: any }) {
  // biome-ignore lint/suspicious/noExplicitAny: json schema types are too complex
  const config: { [key: string]: any } = {};

  for (const key in rawData) {
    const parts = key.split(".");
    let parent = config;

    parts.forEach((child, index) => {
      if (index === parts.length - 1) {
        // Prevent parsing "" as 0 later on
        if (rawData[key] !== "") {
          parent[child] = rawData[key];
        }
      } else {
        if (!parent[child]) {
          parent[child] = {};
        }
        parent = parent[child];
      }
    });
  }

  return config;
}
