import { For, Match, Switch, createMemo, createUniqueId } from "solid-js";
import { analyses, experiments, setAnalyses } from "~/lib/store";
import type { Experiment } from "~/lib/store";
import { MdiCog, MdiContentCopy, MdiDelete, MdiDownload } from "./icons";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { LineChart } from "./ui/charts";

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
  }[type];

  setAnalyses(analyses.length, {
    name: `${name} ${analyses.length + 1}`,
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
 * It isn't reactive; would require intercepting the signal to call chart.update()
 */
export function TimeSeriesPlot() {
  const chartData = createMemo(() => {
    return {
      labels:
        experiments[0].reference.output === undefined
          ? undefined
          : experiments[0].reference.output.t,
      datasets: experiments
        .filter((e) => e.reference.output)
        .flatMap((e) => {
          const permutationRuns = e.permutations.map((perm) => {
            return {
              label: `${e.name}/${perm.name}`,
              data: perm.output === undefined ? [null] : perm.output.h,
              fill: false,
            };
          });
          return [
            {
              label: e.name,
              data:
                e.reference.output === undefined
                  ? [null]
                  : e.reference.output.h,
              fill: false,
            },
            ...permutationRuns,
          ];
        }),
    };
  });

  return <LineChart data={chartData()} />;
}

/** Simply show the final height for each experiment that has output */
function FinalHeights() {
  return (
    <For each={experiments}>
      {(experiment, i) => {
        const h =
          experiment.reference.output?.h[
            experiment.reference.output.h.length - 1
          ] || 0;
        return (
          <div class="mb-2">
            <p>
              {experiment.name}: {h.toFixed()} m
            </p>
            <For each={experiment.permutations}>
              {(perm) => {
                const h = perm.output?.h[perm.output.h.length - 1] || 0;
                return (
                  <p>
                    {experiment.name}/{perm.name}: {h.toFixed()} m
                  </p>
                );
              }}
            </For>
          </div>
        );
      }}
    </For>
  );
}

export function AnalysisCard(analysis: Analysis) {
  const id = createUniqueId();
  return (
    <Card class="w-[500px]" role="article" aria-labelledby={id}>
      <CardHeader>
        {/* TODO: make name & description editable */}
        <CardTitle id={id}>{analysis.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Switch fallback={<p>Unknown analysis type</p>}>
          <Match when={analysis.type === "default"}>
            <FinalHeights />
          </Match>
          <Match when={analysis.type === "timeseries"}>
            <TimeSeriesPlot />
          </Match>
        </Switch>
      </CardContent>
      <CardFooter>
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
      </CardFooter>
    </Card>
  );
}
