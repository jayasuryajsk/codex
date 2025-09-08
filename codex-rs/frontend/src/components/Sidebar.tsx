import { readDir, readTextFile } from "@tauri-apps/api/fs";
import { open } from "@tauri-apps/api/dialog";
import { SearchPanel } from "./SearchPanel.js";
import { SettingsPanel } from "./SettingsPanel.js";

interface FileEntry {
  path: string;
  name: string;
  children?: FileEntry[];
}

export class Sidebar {
  container: HTMLElement;
  tabs: Record<string, HTMLDivElement>;
  buttons: Record<string, HTMLButtonElement>;
  active: string;
  expanded: Set<string>;
  root: string;
  tree: HTMLUListElement;
  search: SearchPanel;
  settings: SettingsPanel;

  constructor(container: HTMLElement, root = ".") {
    this.container = container;
    this.root = root;
    this.active = localStorage.getItem("sidebarActiveTab") || "explorer";
    this.expanded = new Set(
      JSON.parse(localStorage.getItem("sidebarExpanded") || "[]"),
    );

    const tabBar = document.createElement("div");
    this.buttons = {
      explorer: this.createButton("File Explorer", "explorer"),
      search: this.createButton("Search", "search"),
      settings: this.createButton("Settings", "settings"),
    };
    Object.values(this.buttons).forEach((b) => tabBar.appendChild(b));
    this.container.appendChild(tabBar);

    this.tabs = {
      explorer: document.createElement("div"),
      search: document.createElement("div"),
      settings: document.createElement("div"),
    };
    Object.values(this.tabs).forEach((t) => {
      t.style.display = "none";
      this.container.appendChild(t);
    });

    const openFolder = document.createElement("button");
    openFolder.textContent = "Open Folder";
    openFolder.addEventListener("click", () => this.pickRoot());
    this.tabs.explorer.appendChild(openFolder);
    this.tree = document.createElement("ul");
    this.tabs.explorer.appendChild(this.tree);
    this.loadTree();

    this.search = new SearchPanel(this.tabs.search, this.root);
    this.settings = new SettingsPanel(this.tabs.settings);

    this.switchTab(this.active);
  }

  createButton(label: string, name: string) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.addEventListener("click", () => this.switchTab(name));
    return btn;
  }

  switchTab(name: string) {
    for (const [n, tab] of Object.entries(this.tabs)) {
      tab.style.display = n === name ? "block" : "none";
      this.buttons[n].classList.toggle("active", n === name);
    }
    this.active = name;
    localStorage.setItem("sidebarActiveTab", name);
    if (name === "settings") this.settings.open();
  }

  async pickRoot() {
    const selected = await open({ directory: true });
    const path = Array.isArray(selected) ? selected[0] : selected;
    if (typeof path === "string") {
      this.root = path;
      this.expanded.clear();
      this.saveExpanded();
      this.search.projectRoot = path;
      await this.loadTree();
    }
  }

  saveExpanded() {
    localStorage.setItem(
      "sidebarExpanded",
      JSON.stringify(Array.from(this.expanded)),
    );
  }

  async loadTree() {
    this.tree.innerHTML = "";
    const entries = await readDir(this.root, { recursive: true });
    this.buildTree(entries as FileEntry[], this.tree);
  }

  buildTree(entries: FileEntry[], parent: HTMLUListElement) {
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const li = document.createElement("li");
      li.textContent = entry.name;
      parent.appendChild(li);
      if (entry.children) {
        li.classList.add("dir");
        const child = document.createElement("ul");
        li.appendChild(child);
        if (this.expanded.has(entry.path)) {
          child.style.display = "block";
          this.buildTree(entry.children, child);
        } else {
          child.style.display = "none";
        }
        li.addEventListener("click", (e) => {
          e.stopPropagation();
          const show = child.style.display === "none";
          child.style.display = show ? "block" : "none";
          if (show) this.expanded.add(entry.path);
          else this.expanded.delete(entry.path);
          this.saveExpanded();
        });
      } else {
        li.classList.add("file");
        li.addEventListener("click", (e) => this.openFile(e, entry.path));
      }
    }
  }

  async openFile(e: Event, path: string) {
    e.stopPropagation();
    const content = await readTextFile(path);
    window.dispatchEvent(
      new CustomEvent("file-open", { detail: { path, content } }),
    );
  }
}
