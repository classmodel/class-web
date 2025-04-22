
/**
 * Interpolate between hourly reference values based on current runtime
 * Padding is applied if not all hours are provided
 * 
 * @param arr array with hourly reference values for variable
 * @param t time in seconds
 * @param pad fill value if t/3600 exceeds array length
 * @returns interpolated value
 */
export function interpolateHourly(arr: number[], t: number, pad=0){
const maxIndex = arr.length - 1
const i = Math.floor(t/3600)
const p = t % 3600 / 3600

const left = i <= maxIndex ? arr[i] : pad
const right = i+1 <= maxIndex ? arr[i+1] : pad
return left + p * (right - left);

}