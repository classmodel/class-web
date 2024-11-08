import { A } from "@solidjs/router";

export default function About() {
  return (
    <main class="mx-auto p-4 text-center text-gray-700">
      <h1 class="max-6-xs my-16 font-thin text-4xl text-sky-700 uppercase">
        Welcome to <b>C</b>hemistry <b>L</b>and-surface <b>A</b>tmosphere{" "}
        <b>S</b>oil <b>S</b>lab model (CLASS)
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
