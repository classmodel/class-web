import { A } from "@solidjs/router";

export default function About() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
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
