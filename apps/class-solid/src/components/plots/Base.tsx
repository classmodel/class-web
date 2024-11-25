export interface ChartData<T> {
  label: string;
  color: string;
  linestyle: string;
  data: T[];
}

// TODO: would be nice to create a chartContainer/context that manages logic like
// width/height/margins etc. that should be consistent across different plots.
