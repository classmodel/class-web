import { BmiClass } from "@classmodel/class/bmi";
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
export function TimeSeriesPlot({ analysis }: { analysis: TimeseriesAnalysis }) {
  const xVariableOptions = ["t"]; // TODO: separate plot types for timeseries and x-vs-y? Use time axis?
  // TODO: add nice description from config as title and dropdown option for the variable picker.
  const yVariableOptions = new BmiClass().get_output_var_names();

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
                  x: perm.output
                    ? perm.output[analysis.xVariable][ti]
                    : Number.NaN,
                  y: perm.output
                    ? perm.output[analysis.yVariable][ti]
                    : Number.NaN,
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
                  ? experimentOutput[analysis.xVariable][ti]
                  : Number.NaN,
                y: experimentOutput
                  ? experimentOutput[analysis.yVariable][ti]
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
      <LinePlot
        data={chartData}
        xlabel={() => "Time [s]"}
        ylabel={() => analysis.yVariable}
      />
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
  const [variable, setVariable] = createSignal("Potential temperature [K]");

  // TODO also check time of permutations.
  const timeOptions = experiments
    .filter((e) => e.running === false)
    .flatMap((e) => (e.reference.output ? e.reference.output.t : []));
  const variableOptions = {
    "Potential temperature [K]": "theta",
    "Specific humidity [kg/kg]": "q",
  };
  const classVariable = () =>
    variableOptions[analysis.variable as keyof typeof variableOptions];

  // TODO: refactor this? We could have a function that creates shared ChartData
  // props (linestyle, color, label) generic for each plot type, and custom data
  // formatting as required by specific chart
  const profileData = createMemo(() => {
    return experiments
      .filter((e) => e.running === false) // Skip running experiments
      .flatMap((e, i) => {
        const permutations = e.permutations.map((p, j) => {
          // TODO get additional config info from reference
          // permutations probably usually don't have gammaq/gammatetha set?
          return {
            color: colors[(j + 1) % 10],
            linestyle: linestyles[i % 5],
            label: `${e.name}/${p.name}`,
            data: getVerticalProfiles(
              p.output,
              p.config,
              classVariable(),
              analysis.time,
            ),
          };
        });

        return [
          {
            label: e.name,
            color: colors[0],
            linestyle: linestyles[i],
            data: getVerticalProfiles(
              e.reference.output ?? {
                t: [],
                h: [],
                theta: [],
                dtheta: [],
              },
              e.reference.config,
              classVariable(),
              analysis.time,
            ),
          },
          ...permutations,
        ];
      });
  });
  return (
    <>
      <LinePlot
        data={profileData}
        xlabel={variable}
        ylabel={() => "Height [m]"}
      />
      <Picker
        value={() => analysis.variable}
        setValue={(v) => updateAnalysis(analysis, { variable: v })}
        options={Object.keys(variableOptions)}
        label="variable: "
      />
    </>
  );
}

type PickerProps = {
  value: Accessor<string>;
  setValue: Setter<string>;
  options: string[];
  label?: string;
};

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
