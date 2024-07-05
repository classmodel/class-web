const parseForm = () => {
  const form = document.querySelector("form")!;
  const formData = new FormData(form);

  const settingsDiv = document.getElementById("experiment-settings")!;

  let settings = "";
  for (let [key, val] of formData.entries()) {
    settings += `<li>${key}: ${val}</li>`;
  }
  settingsDiv.innerHTML = `
    <ul>
        ${settings}
    </ul>
  `;
};
