import { createUniqueId, For, Match, Switch } from "solid-js";
import { setAnalyses, analyses, experiments } from "~/lib/store";
import { MdiDownload, MdiCog, MdiContentCopy, MdiDelete } from "./icons";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./ui/card";
import { Button } from "./ui/button";
import { Experiment } from "./Experiment";
import { LineChart } from "./ui/charts";

export interface Analysis {
  name: string;
  description: string;
  id: string;
  experiments: Experiment[] | undefined;
  type: string;
}

export function addAnalysis(type = "default") {
  setAnalyses(analyses.length, {
    name: "Default analysis",
    description: "Default analysis",
    id: createUniqueId(),
    experiments: experiments,
    type: type,
  });
}

/** Very rudimentary plot showing time series of each experiment globally available
 * It only works if the time axes are equal
 * It isn't reactive
 */
export function TimeSeriesPlot() {
  const expData: { label: string; data: number[]; fill: boolean }[] = [];
  experiments.forEach((experiment) => {
    if (experiment.output) {
      expData.push({
        label: experiment.id,
        data: experiment.output.h,
        fill: false,
      });
    }
  });

  const chartData = {
    labels: experiments[0].output?.t,
    datasets: expData,
  };

  return <LineChart data={chartData} />;
}

function deleteAnalysis(analysis: Analysis) {
  setAnalyses(analyses.filter((ana) => ana.id !== analysis.id));
}

function finalHeight(experiment: Experiment) {
  const h =
    (experiment.output &&
      experiment.output.h[experiment.output.h.length - 1]) ||
    "";
  return (
    <div class="mb-2">
      <p>Experiment id: {experiment.id}</p>
      <p>Final height: {h}</p>
    </div>
  );
}

export function AnalysisCard(analysis: Analysis) {
  return (
    <Card class="w-[380px]">
      <CardHeader>
        {/* TODO: make name & description editable */}
        <CardTitle>{analysis.name}</CardTitle>
        <CardDescription>{analysis.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Switch fallback={<p>Unknown analysis type</p>}>
          <Match when={analysis.type === "default"}>
            <For each={analysis.experiments}>
              {(experiment) => finalHeight(experiment)}
            </For>
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
