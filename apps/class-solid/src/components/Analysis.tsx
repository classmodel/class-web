import { BmiClass } from "@classmodel/class/bmi";
import type { ClassOutput } from "@classmodel/class/runner";
import type { PartialConfig } from "@classmodel/class/validate";
import {
  type Accessor,
  For,
  Match,
  type Setter,
  Show,
  Switch,
  createMemo,
  createSignal,
  createUniqueId,
} from "solid-js";
import { getThermodynamicProfiles, getVerticalProfiles } from "~/lib/profiles";
import {
  type Analysis,
  type ProfilesAnalysis,
  type TimeseriesAnalysis,
  deleteAnalysis,
  experiments,
  updateAnalysis,
} from "~/lib/store";
import { MdiCog, MdiContentCopy, MdiDelete, MdiDownload } from "./icons";
import { AxisBottom, AxisLeft, getNiceAxisLimits } from "./plots/Axes";
import { Chart, ChartContainer } from "./plots/ChartContainer";
import { Legend } from "./plots/Legend";
import { Line } from "./plots/LinePlot";
import { SkewTPlot } from "./plots/skewTlogP";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "./ui/slider";

/** https://github.com/d3/d3-scale-chromatic/blob/main/src/categorical/Tableau10.js */
const colors = [
  "#4e79a7",
  "#f28e2c",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9da79c",
  "#755fba",
  "#b0ab0b",
];

const linestyles = ["none", "5,5", "10,10", "15,5,5,5", "20,10,5,5,5,10"];

interface FlatExperiment {
  label: string;
  color: string;
  linestyle: string;
  config: PartialConfig;
  output?: ClassOutput;
}

// Create a derived store for looping over all outputs:
const flatExperiments: () => FlatExperiment[] = createMemo(() => {
  return experiments
    .filter((e) => e.running === false) // skip running experiments
    .flatMap((e, i) => {
      const reference = {
        color: colors[0],
        linestyle: linestyles[i % 5],
        label: e.name,
        config: e.reference.config,
        output: e.reference.output,
      };

      const permutations = e.permutations.map((p, j) => ({
        label: `${e.name}/${p.name}`,
        color: colors[(j + 1) % 10],
        linestyle: linestyles[i % 5],
        config: p.config,
        output: p.output,
      }));
      return [reference, ...permutations];
    });
});

const _allTimes = () =>
  new Set(flatExperiments().flatMap((e) => e.output?.t ?? []));
const uniqueTimes = () => [...new Set(_allTimes())].sort((a, b) => a - b);

// TODO: could memoize all reactive elements here, would it make a difference?
export function TimeSeriesPlot({ analysis }: { analysis: TimeseriesAnalysis }) {
  const xVariableOptions = ["t"]; // TODO: separate plot types for timeseries and x-vs-y? Use time axis?
  // TODO: add nice description from config as title and dropdown option for the variable picker.
  const yVariableOptions = new BmiClass().get_output_var_names();

  const allX = () =>
    flatExperiments().flatMap((e) =>
      e.output ? e.output[analysis.xVariable] : [],
    );
  const allY = () =>
    flatExperiments().flatMap((e) =>
      e.output ? e.output[analysis.yVariable] : [],
    );

  const xLim = () => getNiceAxisLimits(allX());
  const yLim = () => getNiceAxisLimits(allY());

  const chartData = () =>
    flatExperiments().map((e) => {
      const { config, output, ...formatting } = e;
      return {
        ...formatting,
        data:
          // Zip x[] and y[] into [x, y][]
          output?.t.map((_, t) => ({
            x: output ? output[analysis.xVariable][t] : Number.NaN,
            y: output ? output[analysis.yVariable][t] : Number.NaN,
          })) || [],
      };
    });

  return (
    <>
      {/* TODO: get label for yVariable from model config */}
      <ChartContainer>
        <Legend entries={chartData} />
        <Chart title="Vertical profile plot">
          <AxisBottom domain={xLim} label="Time [s]" />
          <AxisLeft domain={yLim} label={analysis.yVariable} />
          <For each={chartData()}>{(d) => Line(d)}</For>
        </Chart>
      </ChartContainer>
      <div class="flex justify-around">
        <Picker
          value={() => analysis.xVariable}
          setValue={(v) => updateAnalysis(analysis, { xVariable: v })}
          options={xVariableOptions}
          label="x-axis"
        />
        <Picker
          value={() => analysis.yVariable}
          setValue={(v) => updateAnalysis(analysis, { yVariable: v })}
          options={yVariableOptions}
          label="y-axis"
        />
      </div>
    </>
  );
}

export function VerticalProfilePlot({
  analysis,
}: { analysis: ProfilesAnalysis }) {
  const variableOptions = {
    "Potential temperature [K]": "theta",
    "Specific humidity [kg/kg]": "q",
  };

  const classVariable = () =>
    variableOptions[analysis.variable as keyof typeof variableOptions];
  const [time, setTime] = createSignal<number>(uniqueTimes().length - 1);

  const allValues = () =>
    flatExperiments().flatMap((e) =>
      e.output ? e.output[classVariable()] : [],
    );
  const allHeights = () =>
    flatExperiments().flatMap((e) => (e.output ? e.output.h : []));

  // TODO: better to include jump at top in extent calculation rather than adding random margin.
  const xLim = () => getNiceAxisLimits(allValues(), 1);
  const yLim = () => getNiceAxisLimits(allHeights(), 0);
  console.log(xLim());
  const profileData = () =>
    flatExperiments().map((e) => {
      const { config, output, ...formatting } = e;
      const t = output?.t.indexOf(uniqueTimes()[time()]);
      return {
        ...formatting,
        data:
          t !== -1 // -1 now means "not found in array" rather than last index
            ? getVerticalProfiles(e.output, e.config, classVariable(), t)
            : [],
      };
    });

  return (
    <>
      <div class="flex flex-col gap-2">
        <ChartContainer>
          <Legend entries={profileData} />
          <Chart title="Vertical profile plot">
            <AxisBottom domain={xLim} label={analysis.variable} />
            <AxisLeft domain={yLim} label="Height[m]" />
            <For each={profileData()}>{(d) => Line(d)}</For>
          </Chart>
        </ChartContainer>
        <Picker
          value={() => analysis.variable}
          setValue={(v) => updateAnalysis(analysis, { variable: v })}
          options={Object.keys(variableOptions)}
          label="variable: "
        />
        {TimeSlider(time, uniqueTimes(), setTime)}
      </div>
    </>
  );
}

type PickerProps = {
  value: Accessor<string>;
  setValue: Setter<string>;
  options: string[];
  label?: string;
};

/** format a number in seconds as HH:MM */
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function TimeSlider(
  time: Accessor<number>,
  timeOptions: number[],
  setTime: Setter<number>,
) {
  return (
    <Slider
      value={[time()]}
      maxValue={timeOptions.length - 1}
      onChange={(value) => setTime(value[0])}
      class="w-full max-w-md"
    >
      <div class="flex w-full items-center gap-5">
        <p>Time: </p>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
        <p>{formatSeconds(timeOptions[time()])}</p>
      </div>
    </Slider>
  );
}

function Picker(props: PickerProps) {
  return (
    <div class="flex items-center gap-2">
      <p>{props.label}</p>
      <Select
        class="whitespace-nowrap"
        value={props.value()}
        disallowEmptySelection={true}
        onChange={props.setValue}
        options={props.options}
        placeholder="Select value..."
        itemComponent={(props) => (
          <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
        )}
      >
        <SelectTrigger aria-label="Variable" class="min-w-[100px]">
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

export function ThermodynamicPlot() {
  const [time, setTime] = createSignal<number>(uniqueTimes().length - 1);

  const skewTData = () =>
    flatExperiments().map((e) => {
      const { config, output, ...formatting } = e;
      const t = output?.t.indexOf(uniqueTimes()[time()]);
      return {
        ...formatting,
        data:
          t !== -1 // -1 now means "not found in array" rather than last index
            ? getThermodynamicProfiles(e.output, e.config, t)
            : [],
      };
    });

  return (
    <>
      <SkewTPlot data={skewTData} />
      {TimeSlider(time, uniqueTimes(), setTime)}
    </>
  );
}

/** Simply show the final height for each experiment that has output */
function FinalHeights() {
  return (
    <ul>
      <For each={experiments}>
        {(experiment) => {
          const h = () => {
            const experimentOutput = experiment.reference.output;
            return experimentOutput?.h[experimentOutput?.h.length - 1] || 0;
          };
          return (
            <Show when={!experiment.running}>
              <li class="mb-2" title={experiment.name}>
                {experiment.name}: {h().toFixed()} m
              </li>
              <For each={experiment.permutations}>
                {(perm) => {
                  const h = () => {
                    const permOutput = perm.output;
                    return permOutput?.h?.length
                      ? permOutput.h[permOutput.h.length - 1]
                      : 0;
                  };
                  return (
                    <li title={`${experiment.name}/${perm.name}`}>
                      {experiment.name}/{perm.name}: {h().toFixed()} m
                    </li>
                  );
                }}
              </For>
            </Show>
          );
        }}
      </For>
    </ul>
  );
}

export function AnalysisCard(analysis: Analysis) {
  const id = createUniqueId();
  return (
    <Card class="min-w-[500px]" role="article" aria-labelledby={id}>
      <CardHeader class="flex-row items-center justify-between py-2 pb-6">
        {/* TODO: make name & description editable */}
        <CardTitle id={id}>{analysis.name}</CardTitle>

        <div class="flex">
          {/* TODO: implement download functionality */}
          <Button variant="outline" title="Download">
            <MdiDownload />
          </Button>
          {/* TODO: implement "configure" functionality */}
          <Button variant="outline" title="Configure">
            <MdiCog />
          </Button>
          {/* TODO: implement duplicate functionality */}
          <Button variant="outline" title="Duplicate">
            <MdiContentCopy />
          </Button>
          <Button
            variant="outline"
            onClick={() => deleteAnalysis(analysis)}
            title="Delete"
          >
            <MdiDelete />
          </Button>
        </div>
      </CardHeader>
      <CardContent class="min-h-[450px]">
        <Switch fallback={<p>Unknown analysis type</p>}>
          {/* @ts-ignore: kept for developers, but not included in production */}
          <Match when={analysis.type === "finalheight"}>
            <FinalHeights />
          </Match>
          <Match when={analysis.type === "timeseries"}>
            <TimeSeriesPlot analysis={analysis as TimeseriesAnalysis} />
          </Match>
          <Match when={analysis.type === "profiles"}>
            <VerticalProfilePlot analysis={analysis as ProfilesAnalysis} />
          </Match>
          <Match when={analysis.type === "skewT"}>
            <ThermodynamicPlot />
          </Match>
        </Switch>
      </CardContent>
    </Card>
  );
}
