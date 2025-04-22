import type { Config } from "@classmodel/class/config";
import { type ClassOutput, outputVariables } from "@classmodel/class/output";
import * as d3 from "d3";
import { saveAs } from "file-saver";
import { toBlob } from "html-to-image";
import {
  type Accessor,
  For,
  Match,
  type Setter,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
} from "solid-js";
import { createStore } from "solid-js/store";
import type { Observation } from "~/lib/experiment_config";
import {
  getThermodynamicProfiles,
  getVerticalProfiles,
  observationsForProfile,
  observationsForSounding,
} from "~/lib/profiles";
import {
  type Analysis,
  type ProfilesAnalysis,
  type SkewTAnalysis,
  type TimeseriesAnalysis,
  deleteAnalysis,
  experiments,
  updateAnalysis,
} from "~/lib/store";
import { MaterialSymbolsLightResetImage, MdiCamera, MdiDelete } from "./icons";
import { AxisBottom, AxisLeft, getNiceAxisLimits } from "./plots/Axes";
import { Chart, ChartContainer } from "./plots/ChartContainer";
import { Legend } from "./plots/Legend";
import { Line } from "./plots/Line";
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

interface FlatExperiment {
  label: string;
  color: string;
  linestyle: string;
  config: Config;
  output?: ClassOutput;
}

// Create a derived store for looping over all outputs:
const flatExperiments: () => FlatExperiment[] = createMemo(() => {
  let nextColor = 0;
  return experiments
    .filter((e) => e.output.running === false) // skip running experiments
    .flatMap((e) => {
      const reference: FlatExperiment = {
        color: colors[nextColor++ % 10],
        linestyle: "none",
        label: e.config.reference.name,
        config: e.config.reference,
        output: e.output.reference,
      };

      const permutations = e.config.permutations.map((config, j) => {
        const output = e.output.permutations[j];
        return {
          label: `${e.config.reference.name}/${config.name}`,
          color: colors[nextColor++ % 10],
          linestyle: "none",
          config,
          output,
        };
      });
      return [reference, ...permutations];
    });
});

// Derived store for all observations of all experiments combined
const flatObservations: () => Observation[] = createMemo(() => {
  return experiments
    .filter((e) => e.config.observations)
    .flatMap((e) => {
      return e.config.observations || [];
    });
});

const _allTimes = () =>
  new Set(flatExperiments().flatMap((e) => e.output?.t ?? []));
const uniqueTimes = () => [...new Set(_allTimes())].sort((a, b) => a - b);

// TODO: could memoize all reactive elements here, would it make a difference?
export function TimeSeriesPlot({ analysis }: { analysis: TimeseriesAnalysis }) {
  const symbols = Object.fromEntries(
    outputVariables.map((v) => [v.key, v.symbol]),
  );
  const getKey = Object.fromEntries(
    outputVariables.map((v) => [v.symbol, v.key]),
  );
  const labels = Object.fromEntries(
    outputVariables.map((v) => [v.key, `${v.symbol} [${v.unit}]`]),
  );

  const allX = () =>
    flatExperiments().flatMap((e) =>
      e.output ? e.output[analysis.xVariable] : [],
    );
  const allY = () =>
    flatExperiments().flatMap((e) =>
      e.output ? e.output[analysis.yVariable] : [],
    );

  const granularity = () => (analysis.xVariable === "t" ? 600 : undefined);
  const xLim = () => getNiceAxisLimits(allX(), 0, granularity());
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

  const [toggles, setToggles] = createStore<Record<string, boolean>>({});

  // Initialize all lines as visible
  createEffect(() => {
    for (const d of chartData()) {
      setToggles(d.label, true);
    }
  });

  function toggleLine(label: string, value: boolean) {
    setToggles(label, value);
  }

  const setXVar = (symbol: string) => {
    updateAnalysis(analysis, { xVariable: getKey[symbol] });
    setResetPlot(analysis.id);
  };

  const setYVar = (symbol: string) => {
    updateAnalysis(analysis, { yVariable: getKey[symbol] });
    setResetPlot(analysis.id);
  };

  const formatX = () =>
    analysis.xVariable === "t" ? formatSeconds : d3.format(".4");
  const formatY = () =>
    analysis.yVariable === "t" ? formatSeconds : d3.format(".4");

  return (
    <>
      {/* TODO: get label for yVariable from model config */}
      <ChartContainer>
        <Legend entries={chartData} toggles={toggles} onChange={toggleLine} />
        <Chart
          id={analysis.id}
          title="Timeseries plot"
          formatX={formatX}
          formatY={formatY}
        >
          <AxisBottom domain={xLim} label={labels[analysis.xVariable]} />
          <AxisLeft domain={yLim} label={labels[analysis.yVariable]} />
          <For each={chartData()}>
            {(d) => (
              <Show when={toggles[d.label]}>
                <Line {...d} />
              </Show>
            )}
          </For>
        </Chart>
      </ChartContainer>
      <div class="flex justify-around">
        <Picker
          value={() => symbols[analysis.xVariable]}
          setValue={(v) => setXVar(v)}
          options={Object.values(symbols)}
          label="x-axis"
        />
        <Picker
          value={() => symbols[analysis.yVariable]}
          setValue={(v) => setYVar(v)}
          options={Object.values(symbols)}
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
    "u-wind component [m/s]": "u",
    "v-wind component [m/s]": "v",
  };

  const classVariable = () =>
    variableOptions[analysis.variable as keyof typeof variableOptions];

  const observations = () =>
    flatObservations().map((o) => observationsForProfile(o, classVariable()));
  const obsAllX = () =>
    observations().flatMap((obs) => obs.data.map((d) => d.x));
  const obsAllY = () =>
    observations().flatMap((obs) => obs.data.map((d) => d.y));

  const allValues = () => [
    ...flatExperiments().flatMap((e) =>
      e.output ? e.output[classVariable()] : [],
    ),
    ...obsAllX(),
  ];
  const allHeights = () => [
    ...flatExperiments().flatMap((e) => (e.output ? e.output.h : [])),
    ...obsAllY(),
  ];

  // TODO: better to include jump at top in extent calculation rather than adding random margin.
  const xLim = () => getNiceAxisLimits(allValues(), 1);
  const yLim = () =>
    [0, getNiceAxisLimits(allHeights(), 0)[1]] as [number, number];
  const profileData = () =>
    flatExperiments().map((e) => {
      const { config, output, ...formatting } = e;
      const t = output?.t.indexOf(uniqueTimes()[analysis.time]);
      return {
        ...formatting,
        data:
          t !== -1 // -1 now means "not found in array" rather than last index
            ? getVerticalProfiles(
                e.output,
                e.config,
                classVariable(),
                analysis.time,
              )
            : [],
      };
    });

  function chartData() {
    return [...profileData(), ...observations()];
  }

  const [toggles, setToggles] = createStore<Record<string, boolean>>({});

  // Initialize all lines as visible
  createEffect(() => {
    for (const d of chartData()) {
      setToggles(d.label, true);
    }
  });

  function toggleLine(label: string, value: boolean) {
    setToggles(label, value);
  }

  function changeVar(v: string) {
    updateAnalysis(analysis, { variable: v });
    setResetPlot(analysis.id);
  }

  return (
    <>
      <div class="flex flex-col gap-2">
        <ChartContainer>
          <Legend
            entries={() => [...profileData(), ...observations()]}
            toggles={toggles}
            onChange={toggleLine}
          />
          <Chart id={analysis.id} title="Vertical profile plot">
            <AxisBottom domain={xLim} label={analysis.variable} />
            <AxisLeft domain={yLim} label="Height[m]" />
            <For each={profileData()}>
              {(d) => (
                <Show when={toggles[d.label]}>
                  <Line {...d} />
                </Show>
              )}
            </For>
            <For each={observations()}>
              {(d) => (
                <Show when={toggles[d.label]}>
                  <Line {...d} />
                </Show>
              )}
            </For>
          </Chart>
        </ChartContainer>
        <Picker
          value={() => analysis.variable}
          setValue={(v) => changeVar(v)}
          options={Object.keys(variableOptions)}
          label="variable: "
        />
        {TimeSlider(
          () => analysis.time,
          uniqueTimes,
          (t) => updateAnalysis(analysis, { time: t }),
        )}
      </div>
    </>
  );
}

type PickerProps = {
  value: Accessor<string>;
  setValue: (value: string) => void;
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
  timeOptions: Accessor<number[]>,
  setTime: Setter<number>,
) {
  const maxValue = () => timeOptions().length - 1;
  createEffect(() => {
    // Update time in store as side effect of new data
    // Avoid case where timeOptions is briefly empty during update
    const max = maxValue();
    if (time() > max && max !== -1) {
      setTime(maxValue());
    }
  });
  return (
    <Slider
      value={[time()]}
      maxValue={maxValue()}
      onChange={(value) => setTime(value[0])}
      class="w-full max-w-md"
    >
      <div class="flex w-full items-center gap-5">
        <p>Time: </p>
        <SliderTrack>
          <SliderFill />
          <SliderThumb />
        </SliderTrack>
        <p>{formatSeconds(timeOptions()[time()])}</p>
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

export function ThermodynamicPlot({ analysis }: { analysis: SkewTAnalysis }) {
  const skewTData = () =>
    flatExperiments().map((e) => {
      const { config, output, ...formatting } = e;
      const t = output?.t.indexOf(uniqueTimes()[analysis.time]);
      return {
        ...formatting,
        data:
          t !== -1 // -1 now means "not found in array" rather than last index
            ? getThermodynamicProfiles(e.output, e.config, t)
            : [],
      };
    });

  const observations = () =>
    flatObservations().map((o) => observationsForSounding(o));

  return (
    <>
      <SkewTPlot
        id={analysis.id}
        data={() => [...skewTData(), ...observations()]}
      />
      {TimeSlider(
        () => analysis.time,
        uniqueTimes,
        (t) => updateAnalysis(analysis, { time: t }),
      )}
    </>
  );
}

async function takeScreenshot(event: MouseEvent, analyse: Analysis) {
  const target = event.target as HTMLElement;
  const article = target.closest("[role='article']") as HTMLElement;
  const figure = article?.querySelector("figure") as HTMLElement;

  if (!figure) {
    console.error("Could not find figure element");
    return;
  }

  // Make screenshot bigger than the original
  const scale = 10;

  // Can not use toSvg as legend is written in HTML
  // generated svg document contains foreignObject with html tag
  // which can only be rendered using web browser, not Inkscape or PowerPoint
  const blob = await toBlob(figure, {
    backgroundColor: "white",
    canvasWidth: figure.clientWidth * scale,
    canvasHeight: figure.clientHeight * scale,
  });
  if (!blob) {
    throw new Error("Failed to create blob");
  }
  // TODO put experiments/permutation names in filename?
  const parts = [analyse.type];
  if ("time" in analyse) {
    const timesAnalyse = analyse as ProfilesAnalysis | SkewTAnalysis;
    const time = uniqueTimes()[timesAnalyse.time];
    const formattedTime = formatSeconds(time);
    parts.push(formattedTime);
  }
  const fn = `class-${parts.join("-")}.png`;
  console.log("Saving screenshot as", fn);
  const file = new File([blob], fn, {
    type: "image/png",
  });
  saveAs(file);
}

// Emit a signal when plot reset button is pressed
export const [resetPlot, setResetPlot] = createSignal("", { equals: false });

export function AnalysisCard(analysis: Analysis) {
  const id = createUniqueId();
  return (
    <Card class="min-w-[500px]" role="article" aria-labelledby={id}>
      <CardHeader class="flex-row items-center justify-between py-2 pb-6">
        {/* TODO: make name & description editable */}
        <CardTitle id={id}>{analysis.name}</CardTitle>
        <div class="flex gap-1">
          <Button variant="outline" onclick={() => setResetPlot(analysis.id)}>
            <MaterialSymbolsLightResetImage />
          </Button>
          <Button
            variant="outline"
            onClick={(e: MouseEvent) => takeScreenshot(e, analysis)}
          >
            <MdiCamera />
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
          <Match when={analysis.type === "timeseries"}>
            <TimeSeriesPlot analysis={analysis as TimeseriesAnalysis} />
          </Match>
          <Match when={analysis.type === "profiles"}>
            <VerticalProfilePlot analysis={analysis as ProfilesAnalysis} />
          </Match>
          <Match when={analysis.type === "skewT"}>
            <ThermodynamicPlot analysis={analysis as SkewTAnalysis} />
          </Match>
        </Switch>
      </CardContent>
    </Card>
  );
}
