import { createUniqueId, For, Match, Switch } from "solid-js";
import { setAnalyses, analyses, experiments } from "~/lib/store";
import { MdiDownload, MdiCog, MdiContentCopy, MdiDelete } from "./icons";
import {
	Card,
	CardHeader,
	CardTitle,
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
		labels: experiments[0].output?.t,
		datasets: experiments
			.filter((e) => e.output)
			.map((e) => {
				return {
					label: e.id,
					data: e.output!.h,
					fill: false,
				};
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
					(experiment.output &&
						experiment.output.h[experiment.output.h.length - 1]) ||
					0;
				return (
					<div class="mb-2">
						<p>
							{experiment.id}: {h.toFixed()} m
						</p>
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
