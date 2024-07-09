import { counter } from "./utils";

let _id = counter();

export class Output {
  id = _id.next().value;
}

export function outputCard(output: Output) {
  const article = document.createElement("article");

  article.innerHTML = /*html*/ `
      <nav>
        <ul>
            <li><strong>Output ${output.id}</strong></li>
        </ul>
        <ul>
            <li><button class="remove outline contrast"><strong>X</strong></button></li>
        </ul>
    </nav>
        <p id="outputBody">Some nice figure (or table?)</p>
        <button>Configure output</button>
  `;

  article.querySelector(".remove")!.addEventListener("click", () => {
    confirm("Are you sure?");
    article.remove();
  });

  return article;
}
