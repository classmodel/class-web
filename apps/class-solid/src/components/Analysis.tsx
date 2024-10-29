import { For, Match, Switch, createMemo, createUniqueId } from "solid-js";
import { getVerticalProfiles } from "~/lib/profiles";
import { analyses, experiments, setAnalyses } from "~/lib/store";
import type { Experiment } from "~/lib/store";
import LinePlot from "./LinePlot";
import { MdiCog, MdiContentCopy, MdiDelete, MdiDownload } from "./icons";
import { SkewTPlot } from "./skewTlogP";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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

export interface Analysis {
  name: string;
  description: string;
  id: string;
  experiments: Experiment[] | undefined;
  type: string;
}

export function addAnalysis(type = "default") {
  const name = {
    default: "Final height",
    timeseries: "Timeseries",
    profiles: "Vertical profiles",
  }[type];

  setAnalyses(analyses.length, {
    name: name,
    id: createUniqueId(),
    experiments: experiments,
    type: type,
  });
}

function deleteAnalysis(analysis: Analysis) {
  setAnalyses(analyses.filter((ana) => ana.id !== analysis.id));
}

/** Very rudimentary plot showing time series of each experiment globally available
 * It only works if the time axes are equal
 */
export function TimeSeriesPlot() {
  const chartData = createMemo(() => {
    return experiments
      .filter((e) => e.reference.output)
      .flatMap((e, i) => {
        const permutationRuns = e.permutations.map((perm, j) => {
          return {
            label: `${e.name}/${perm.name}`,
            y: perm.output === undefined ? [] : perm.output.h,
            x: perm.output === undefined ? [] : perm.output.t,
            color: colors[(j + 1) % 10],
            linestyle: linestyles[i % 5],
          };
        });
        return [
          {
            y: e.reference.output === undefined ? [] : e.reference.output.h,
            x: e.reference.output === undefined ? [] : e.reference.output.t,
            label: e.name,
            color: colors[0],
            linestyle: linestyles[i],
          },
          ...permutationRuns,
        ];
      });
  });

  return (
    <LinePlot
      data={chartData}
      xlabel="Time [s]"
      ylabel="Mixed-layer height [m]"
    />
  );
}

export function VerticalProfilePlot() {
  const variable = "theta";
  const time = -1;
  const profileData = createMemo(() => {
    return experiments.flatMap((e, i) => {
      const permutations = e.permutations.map((p, j) => {
        // TODO get additional config info from reference
        // permutations probably usually don't have gammaq/gammatetha set?
        return {
          color: colors[(j + 1) % 10],
          linestyle: linestyles[i % 5],
          label: `${e.name}/${p.name}`,
          ...getVerticalProfiles(p.output, p.config, variable, time),
        };
      });

      return [
        {
          label: e.name,
          color: colors[0],
          linestyle: linestyles[i],
          ...getVerticalProfiles(
            e.reference.output,
            e.reference.config,
            variable,
            time,
          ),
        },
        ...permutations,
      ];
    });
  });
  return (
    <LinePlot
      data={profileData}
      xlabel="Potential temperature [K]"
      ylabel="Height [m]"
    />
  );
}

/** Simply show the final height for each experiment that has output */
function FinalHeights() {
  return (
    <ul>
      <For each={experiments}>
        {(experiment) => {
          const h = () =>
            experiment.reference.output?.h[
              experiment.reference.output.h.length - 1
            ] || 0;
          return (
            <>
              <li class="mb-2" title={experiment.name}>
                {experiment.name}: {h().toFixed()} m
              </li>
              <For each={experiment.permutations}>
                {(perm) => {
                  const h = () => perm.output?.h[perm.output.h.length - 1] || 0;
                  return (
                    <li title={`${experiment.name}/${perm.name}`}>
                      {experiment.name}/{perm.name}: {h().toFixed()} m
                    </li>
                  );
                }}
              </For>
            </>
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
          <Match when={analysis.type === "default"}>
            <FinalHeights />
          </Match>
          <Match when={analysis.type === "timeseries"}>
            <TimeSeriesPlot />
          </Match>
          <Match when={analysis.type === "profiles"}>
            <VerticalProfilePlot />
          </Match>
          <Match when={analysis.type === "skewT"}>
            <SkewTPlot />
          </Match>
        </Switch>
      </CardContent>
    </Card>
  );
}
