import {
  readDir,
  readTextFile,
  writeFile,
  createDir,
  renameFile,
  removeFile,
  removeDir,
} from "@tauri-apps/api/fs";

export class FileTree {
  constructor(container, root = ".") {
    this.container = container;
    this.root = root;
    this.selected = null;
    this.menu = this.#buildMenu();
    document.body.appendChild(this.menu);
    this.rootEntry = { path: this.root, children: true };
    this.container.addEventListener("click", () => this.#hideMenu());
    this.container.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.#showMenu(e, this.rootEntry);
    });
    this.container.addEventListener("dragover", (e) => e.preventDefault());
    this.container.addEventListener("drop", (e) => this.#drop(e, this.rootEntry));
    window.addEventListener("click", () => this.#hideMenu());
    this.refresh();
  }

  async refresh() {
    this.container.innerHTML = "";
    const entries = await readDir(this.root, { recursive: true });
    const ul = document.createElement("ul");
    this.#buildTree(entries, ul);
    this.container.appendChild(ul);
  }

  #buildTree(entries, parent) {
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const li = document.createElement("li");
      li.textContent = entry.name;
      li.dataset.path = entry.path;
      li.dataset.dir = entry.children ? "true" : "false";
      li.draggable = true;
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        this.#select(li);
      });
      li.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.#showMenu(e, entry);
      });
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", entry.path);
      });
      li.addEventListener("dragover", (e) => e.preventDefault());
      li.addEventListener("drop", (e) => this.#drop(e, entry));
      parent.appendChild(li);
      if (entry.children) {
        const child = document.createElement("ul");
        li.appendChild(child);
        this.#buildTree(entry.children, child);
      }
    }
  }

  async #select(li) {
    if (this.selected) this.selected.classList.remove("selected");
    this.selected = li;
    li.classList.add("selected");
    if (li.dataset.dir === "true") {
      window.dispatchEvent(
        new CustomEvent("file-selected", { detail: { path: li.dataset.path } })
      );
      return;
    }
    const content = await readTextFile(li.dataset.path);
    window.dispatchEvent(
      new CustomEvent("file-open", {
        detail: { path: li.dataset.path, content },
      })
    );
  }

  #buildMenu() {
    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.display = "none";
    menu.style.background = "#fff";
    menu.style.border = "1px solid #ccc";
    const open = document.createElement("div");
    open.textContent = "Open";
    open.addEventListener("click", () => this.#open());
    const refresh = document.createElement("div");
    refresh.textContent = "Refresh";
    refresh.addEventListener("click", () => this.refresh());
    const newFile = document.createElement("div");
    newFile.textContent = "New File";
    newFile.addEventListener("click", () => this.#newFile());
    const newFolder = document.createElement("div");
    newFolder.textContent = "New Folder";
    newFolder.addEventListener("click", () => this.#newFolder());
    const rename = document.createElement("div");
    rename.textContent = "Rename";
    rename.addEventListener("click", () => this.#rename());
    const del = document.createElement("div");
    del.textContent = "Delete";
    del.addEventListener("click", () => this.#delete());
    menu.append(open, refresh, newFile, newFolder, rename, del);
    return menu;
  }

  #showMenu(e, entry) {
    this.contextEntry = entry;
    this.menu.style.left = `${e.pageX}px`;
    this.menu.style.top = `${e.pageY}px`;
    this.menu.style.display = "block";
  }

  #hideMenu() {
    this.menu.style.display = "none";
    this.contextEntry = null;
  }

  async #drop(e, entry) {
    e.preventDefault();
    const src = e.dataTransfer.getData("text/plain");
    if (!src) return;
    const name = src.split("/").pop();
    const targetDir = entry.children
      ? entry.path
      : entry.path.split("/").slice(0, -1).join("/");
    const dest = `${targetDir}/${name}`;
    if (dest === src) return;
    await renameFile(src, dest);
    await this.refresh();
  }

  async #open() {
    if (!this.contextEntry || this.contextEntry.children) return;
    const content = await readTextFile(this.contextEntry.path);
    window.dispatchEvent(
      new CustomEvent("file-open", {
        detail: { path: this.contextEntry.path, content },
      })
    );
    this.#hideMenu();
  }

  async #newFile() {
    if (!this.contextEntry) return;
    const name = prompt("File name?");
    if (!name) return this.#hideMenu();
    const base = this.contextEntry.children
      ? this.contextEntry.path
      : this.contextEntry.path.split("/").slice(0, -1).join("/");
    await writeFile({ path: `${base}/${name}`, contents: "" });
    await this.refresh();
    this.#hideMenu();
  }

  async #newFolder() {
    if (!this.contextEntry) return;
    const name = prompt("Folder name?");
    if (!name) return this.#hideMenu();
    const base = this.contextEntry.children
      ? this.contextEntry.path
      : this.contextEntry.path.split("/").slice(0, -1).join("/");
    await createDir(`${base}/${name}`, { recursive: true });
    await this.refresh();
    this.#hideMenu();
  }

  async #rename() {
    if (!this.contextEntry) return;
    const current =
      this.contextEntry.name || this.contextEntry.path.split("/").pop();
    const name = prompt("New name?", current);
    if (!name) return this.#hideMenu();
    const base = this.contextEntry.path.split("/").slice(0, -1).join("/");
    await renameFile(this.contextEntry.path, `${base}/${name}`);
    await this.refresh();
    this.#hideMenu();
  }

  async #delete() {
    if (!this.contextEntry) return;
    if (!confirm(`Delete ${this.contextEntry.path}?`)) {
      return this.#hideMenu();
    }
    if (this.contextEntry.children) {
      await removeDir(this.contextEntry.path, { recursive: true });
    } else {
      await removeFile(this.contextEntry.path);
    }
    await this.refresh();
    this.#hideMenu();
  }
}
