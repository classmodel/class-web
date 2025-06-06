/**
 * Interpolate between hourly reference values based on current runtime
 * Padding is applied if not all hours are provided
 *
 * @param arr array with hourly reference values for variable
 * @param t time in seconds
 * @returns interpolated value
 */
export function interpolateHourly(arr: number[], t: number) {
  const maxIndex = arr.length - 1;
  const i = Math.floor(t / 3600);

  if (i >= maxIndex) return arr[maxIndex];

  const p = (t % 3600) / 3600;
  const left = arr[i];
  const right = arr[i + 1];
  return left + p * (right - left);
}

/**
 * Find the position in an array where value should be inserted to maintain sorted order.
 *
 * @param arr Sorted array
 * @param value Value that should be inserted
 * @returns index where value should be inserted to maintain sorted array
 */
export function findInsertIndex(arr: number[], value: number) {
  let i = 0;
  while (i < arr.length && value >= arr[i]) {
    i++;
  }
  return i;
}
