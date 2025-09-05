import { invoke } from "@tauri-apps/api/tauri";

export class FileExplorer {
  constructor(container, layout, toggleBtn) {
    this.container = container;
    this.layout = layout;
    this.searchInput = container.querySelector('.search');
    this.list = container.querySelector('.files');

    toggleBtn.addEventListener('click', () => this.toggle());
    this.searchInput.addEventListener('input', (e) => this.search(e.target.value));
  }

  toggle() {
    this.container.classList.toggle('collapsed');
    this.layout.classList.toggle('collapsed-explorer');
  }

  async search(query) {
    const resp = await invoke('search_files', { query, dir: '.' });
    this.list.innerHTML = '';
    resp.paths.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p;
      this.list.appendChild(li);
    });
  }
}
