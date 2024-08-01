import { Button } from "~/components/ui/button";
import { MdiDownload, MdiCog, MdiContentCopy, MdiDelete } from "./icons";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "./ui/card";
import { ClassConfig, classConfig } from "@classmodel/class/config";
import { ClassOutput, runClass } from "@classmodel/class/runner";
import { createUniqueId, createSignal } from "solid-js";
import { ExperimentConfigForm } from "./ExperimentConfigForm";
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "./ui/dialog";
import { experiments, setExperiments } from "~/lib/store";

export interface Experiment {
	name: string;
	description: string;
	id: string;
	config: ClassConfig;
	output: ClassOutput | undefined;
}

export function addDefaultExperiment() {
	const id = createUniqueId();
	const config = classConfig.parse({});
	const output = runClass(config);
	const newExperiment = {
		name: "My experiment",
		description: "Default experiment",
		id,
		config,
		output,
	};
	setExperiments(experiments.length, newExperiment);
}

export function AddCustomExperiment() {
	const config = classConfig.parse({});
	const [open, setOpen] = createSignal(false);
	return (
		<Dialog open={open()} onOpenChange={setOpen}>
			<DialogTrigger variant="outline" size="lg" as={Button<"button">}>
				Add custom experiment
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add custom experiment</DialogTitle>
					<DialogDescription>
						Configure your custom experiment here.
					</DialogDescription>
				</DialogHeader>
				<ExperimentConfigForm
					// TODO: not sure if passing around ids like this is the proper way to do things in solidjs
					// note, id ius used as form target in submit button below;
					id="experiment-config-form"
					config={config}
					onSubmit={(config) => {
						const id = createUniqueId();
						const output = runClass(config);
						const newExperiment = {
							name: "My experiment",
							description: "Custom experiment",
							id,
							config,
							output,
						};
						setExperiments(experiments.length, newExperiment);
						setOpen(false);
					}}
				/>
				<DialogFooter>
					<Button type="submit" form="experiment-config-form">
						Run
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function deleteExperiment(experiment: Experiment) {
	setExperiments(experiments.filter((exp) => exp.id !== experiment.id));
}

export function ExperimentCard(experiment: Experiment) {
	return (
		<Card class="w-[380px]">
			<CardHeader>
				{/* TODO: make name & description editable */}
				<CardTitle>{experiment.name}</CardTitle>
				<CardDescription>{experiment.id}</CardDescription>
			</CardHeader>
			<CardContent>{experiment.description}</CardContent>
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
				<Button variant="outline" onClick={() => deleteExperiment(experiment)}>
					<MdiDelete />
				</Button>
			</CardFooter>
		</Card>
	);
}
