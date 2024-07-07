export function experimentCard() {
  return /*html*/ `
  <article>
    <h2>Experiment 1</h2>
    <p>Short description of the experiment.</p>
    <button id="configure-experiment">
      Configure experiment
    </button>
  </article>
`;
}

export function outputCard(content: string) {
  return /*html*/ `
    <article>
      <h2>Output 1</h2>
      <p id="outputBody">${content}</p>
      <button>Configure output</button>
    </article>
`;
}
