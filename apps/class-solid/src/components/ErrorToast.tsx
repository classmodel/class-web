export function ErrorToast(props: { error: Error }) {
  console.error(props.error);
  console.error(props.error.stack);
  return (
    <div class="text-destructive">
      Something bad happened
      <pre>{props.error.message}</pre>
      <p>See console in Dev Tools (F12) for more information.</p>
      <p>
        Please{" "}
        <a
          href="https://github.com/classmodel/class-web/issues"
          target="_blank"
          rel="noreferrer"
        >
          create issue
        </a>{" "}
        if problem persists.
      </p>
    </div>
  );
}
