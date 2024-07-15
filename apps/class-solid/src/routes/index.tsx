import { createSignal } from "solid-js";
import { Button } from "~/components/ui/button";
import { createStore } from "solid-js/store"

export default function Home() {
  const [experiments, setExperiments] = createStore({
    experiments: [],
    activeExperiment: -1
  })

  const [ edit, setEdit] = createSignal(false)
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">Welcome to CLASS</h1>
      <Button variant='outline' size='lg' onClick={()=>setEdit(true)}>Add experiment</Button>
      <p class="mt-8">
        Start your first experiment by clicking this beautiful button
      </p>
    </main>
  );
}
