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
import { type Analysis, deleteAnalysis, experiments } from "~/lib/store";
import { MdiCog, MdiContentCopy, MdiDelete, MdiDownload } from "./icons";
import LinePlot from "./plots/LinePlot";
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

/** Very rudimentary plot showing time series of each experiment globally available
 * It only works if the time axes are equal
 */
export function TimeSeriesPlot() {
  const [xVariable, setXVariable] = createSignal("t");
  const [yVariable, setYVariable] = createSignal("theta");
  const xVariableOptions = ["t"]; // TODO: separate plot types for timeseries and x-vs-y? Use time axis?
  const yVariableOptions = ["h", "theta", "q", "dtheta", "dq"];

  const chartData = createMemo(() => {
    return experiments
      .filter((e) => e.running === false) // Skip running experiments
      .flatMap((e, i) => {
        const experimentOutput = e.reference.output;
        const permutationRuns = e.permutations
          .filter((perm) => perm.output !== undefined)
          .map((perm, j) => {
            return {
              label: `${e.name}/${perm.name}`,
              color: colors[(j + 1) % 10],
              linestyle: linestyles[i % 5],
              data:
                perm.output?.t.map((tVal, ti) => ({
                  x: perm.output ? perm.output[xVariable()][ti] : Number.NaN,
                  y: perm.output ? perm.output[yVariable()][ti] : Number.NaN,
                })) || [],
            };
          });
        return [
          {
            label: e.name,
            color: colors[0],
            linestyle: linestyles[i],
            data:
              experimentOutput?.t.map((tVal, ti) => ({
                x: experimentOutput
                  ? experimentOutput[xVariable()][ti]
                  : Number.NaN,
                y: experimentOutput
                  ? experimentOutput[yVariable()][ti]
                  : Number.NaN,
              })) || [],
          },
          ...permutationRuns,
        ];
      });
  });

  return (
    <>
      {/* TODO: get label for yVariable from model config */}
      <LinePlot data={chartData} xlabel={() => "Time [s]"} ylabel={yVariable} />
      <div class="flex justify-around">
        <Picker
          value={xVariable}
          setValue={setXVariable as Setter<string>}
          options={xVariableOptions}
          label="x-axis"
        />
        <Picker
          value={yVariable}
          setValue={setYVariable as Setter<string>}
          options={yVariableOptions}
          label="y-axis"
        />
      </div>
    </>
  );
}

export function VerticalProfilePlot() {
  // TODO also check time of permutations.
  const timeOptions = experiments
    .filter((e) => e.running === false)
    .flatMap((e) => (e.reference.output ? e.reference.output.t : []));

  const [time, setTime] = createSignal<number>(timeOptions.length - 1);
  const [variable, setVariable] = createSignal("theta");

  const variableOptions = {
    theta: "Potential temperature [K]",
    q: "Specific humidity [kg/kg]",
  };

  // TODO: refactor this? We could have a function that creates shared ChartData
  // props (linestyle, color, label) generic for each plot type, and custom data
  // formatting as required by specific chart
  const profileData = () => {
    return experiments
      .filter((e) => e.running === false) // Skip running experiments
      .flatMap((e, i) => {
        const r = e.reference;
        const reference = {
          label: e.name,
          color: colors[0],
          linestyle: linestyles[i],
          data: getVerticalProfiles(r.output, r.config, variable(), time()),
        };

        const permutations = e.permutations.map((p, j) => {
          // TODO make sure config gammaq/gammatetha are available for all reference/permutations
          return {
            color: colors[(j + 1) % 10],
            linestyle: linestyles[i % 5],
            label: `${e.name}/${p.name}`,
            data: getVerticalProfiles(p.output, p.config, variable(), time()),
          };
        });

        return [reference, ...permutations];
      });
  };
  return (
    <>
      <div class="flex flex-col gap-2">
        <LinePlot
          data={profileData}
          xlabel={() =>
            variableOptions[variable() as keyof typeof variableOptions]
          }
          ylabel={() => "Height [m]"}
        />
        <Picker
          value={variable}
          setValue={setVariable as Setter<string>}
          options={Object.keys(variableOptions)}
          label="variable: "
        />
        {TimeSlider(time, timeOptions, setTime)}
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
        value={props.value()}
        onChange={props.setValue}
        options={props.options}
        placeholder="Select value..."
        itemComponent={(props) => (
          <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
        )}
      >
        <SelectTrigger aria-label="Variable" class="w-[180px]">
          <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

export function ThermodynamicPlot() {
  const time = -1;
  const skewTData = createMemo(() => {
    return experiments.flatMap((e, i) => {
      const permutations = e.permutations.map((p, j) => {
        // TODO get additional config info from reference
        // permutations probably usually don't have gammaq/gammatetha set?
        return {
          color: colors[(j + 1) % 10],
          linestyle: linestyles[i % 5],
          label: `${e.name}/${p.name}`,
          data: getThermodynamicProfiles(p.output, p.config, time),
        };
      });

      return [
        {
          label: e.name,
          color: colors[0],
          linestyle: linestyles[i],
          data: getThermodynamicProfiles(
            e.reference.output,
            e.reference.config,
            time,
          ),
        },
        ...permutations,
      ];
    });
  });
  return <SkewTPlot data={skewTData} />;
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
            <TimeSeriesPlot />
          </Match>
          <Match when={analysis.type === "profiles"}>
            <VerticalProfilePlot />
          </Match>
          <Match when={analysis.type === "skewT"}>
            <ThermodynamicPlot />
          </Match>
        </Switch>
      </CardContent>
    </Card>
  );
}
