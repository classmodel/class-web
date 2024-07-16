import { createUniqueId, For } from "solid-js";
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

export interface Analysis {
  name: string;
  description: string;
  id: string;
  experiments: Experiment[] | undefined;
}

export function addAnalysis() {
  setAnalyses(analyses.length, {
    name: "Default analysis",
    description: "Default analysis",
    id: createUniqueId(),
    experiments: experiments,
  });
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
        <For each={analysis.experiments}>
          {(experiment) => finalHeight(experiment)}
        </For>
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
