import { invoke } from "@tauri-apps/api/tauri";
import { readTextFile } from "@tauri-apps/api/fs";

export class SearchPanel {
  constructor(container, projectRoot = ".") {
    this.container = container;
    this.projectRoot = projectRoot;

    this.container.innerHTML = `
      <form id="search-form">
        <input id="search-input" type="text" placeholder="Search files" />
        <button type="submit">Search</button>
      </form>
      <ul id="search-results"></ul>
    `;

    this.form = this.container.querySelector("#search-form");
    this.input = this.container.querySelector("#search-input");
    this.results = this.container.querySelector("#search-results");

    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.submit();
    });
  }

  async submit() {
    const query = this.input.value;
    if (!query.trim()) return;
    const { paths } = await invoke("search_files", {
      query,
      dir: this.projectRoot,
    });
    this.renderResults(paths);
  }

  renderResults(paths) {
    this.results.innerHTML = "";
    for (const path of paths) {
      const li = document.createElement("li");
      li.textContent = path;
      li.addEventListener("click", () => this.open(path));
      this.results.appendChild(li);
    }
  }

  async open(path) {
    const content = await readTextFile(path);
    window.dispatchEvent(
      new CustomEvent("file-open", { detail: { path, content } }),
    );
  }
}
