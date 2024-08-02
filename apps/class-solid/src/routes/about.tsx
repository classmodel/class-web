import { A } from "@solidjs/router";

export default function About() {
  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-6xl text-sky-700 uppercase">
        About Page
      </h1>
      <p class="mt-8">
        Here, we're developing a new version of CLASS that can run in the
        browser!
      </p>
      <p>
        For more information about the CLASS model, visit{" "}
        <a
          href="https://classmodel.github.io/"
          target="_blank"
          class="text-sky-600 hover:underline"
          rel="noreferrer"
        >
          classmodel.github.io
        </a>{" "}
      </p>
      <p class="my-4">
        <A href="/" class="text-sky-600 hover:underline">
          Home
        </A>
        {" - "}
        <span>About Page</span>
      </p>
    </main>
  );
}
