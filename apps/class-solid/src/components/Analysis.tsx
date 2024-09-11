import { For, Match, Switch, createUniqueId } from "solid-js";
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
 * It isn't reactive; would require intercepting the signal to call chart.update()
 */
export function TimeSeriesPlot() {
  const chartData = {
    labels:
      experiments[0].reference.output === undefined
        ? undefined
        : experiments[0].reference.output.t,
    datasets: experiments
      .filter((e) => e.reference.output)
      .flatMap((e) => {
        const permutationRuns = Object.entries(e.permutations).map(
          ([key, perm]) => {
            // TODO make clear that this is a permutation of the parent experiment
            return {
              label: `${e.id}/${key}`,
              data: perm.output === undefined ? [null] : perm.output.h,
              fill: false,
            };
          },
        );
        return [
          {
            label: e.id,
            data:
              e.reference.output === undefined ? [null] : e.reference.output.h,
            fill: false,
          },
          ...permutationRuns,
        ];
      }),
  };

  return <LineChart data={chartData} />;
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
              {experiment.id}: {h.toFixed()} m
            </p>
            <For each={Object.entries(experiment.permutations)}>
              {([key, perm]) => {
                const h = perm.output?.h[perm.output.h.length - 1] || 0;
                // TODO make clear that this is a permutation of the parent experiment
                return (
                  <p>
                    {experiment.id}/{key}: {h.toFixed()} m
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
  return (
    <Card class="w-[500px]">
      <CardHeader>
        {/* TODO: make name & description editable */}
        <CardTitle>{analysis.name}</CardTitle>
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
        <Button variant="outline">
          <MdiDownload />
        </Button>
        {/* TODO: implement "configure" functionality */}
        <Button variant="outline">
          <MdiCog />
        </Button>
        {/* TODO: implement duplicate functionality */}
        <Button variant="outline">
          <MdiContentCopy />
        </Button>
        <Button variant="outline" onClick={() => deleteAnalysis(analysis)}>
          <MdiDelete />
        </Button>
      </CardFooter>
    </Card>
  );
}
