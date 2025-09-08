import Fuse from "fuse.js";
import { readDir, readTextFile } from "@tauri-apps/api/fs";
import {
  builtinCommands,
  commandState,
  recordCommand,
} from "../state/commands.ts";

interface Item {
  type: "file" | "command";
  name: string;
}

export class CommandPalette {
  root: string;
  element: HTMLDivElement;
  input: HTMLInputElement;
  list: HTMLUListElement;
  items: Item[] = [];
  fuse!: Fuse<Item>;
  current: Item[] = [];

  constructor(root = ".") {
    this.root = root;
    this.element = document.createElement("div");
    this.element.id = "command-palette";
    this.element.style.display = "none";
    this.element.innerHTML = `
      <input id="cmd-input" type="text" placeholder="Type a command or file" />
      <ul id="cmd-results"></ul>
    `;
    document.body.appendChild(this.element);
    this.input = this.element.querySelector("#cmd-input") as HTMLInputElement;
    this.list = this.element.querySelector("#cmd-results") as HTMLUListElement;

    this.input.addEventListener("input", () => this.search());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.choose();
      if (e.key === "Escape") this.close();
    });

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        this.open();
      }
    });

    this.index();
  }

  async index() {
    const entries = await readDir(this.root, { recursive: true });
    const files: string[] = [];
    const walk = (ents: any[]) => {
      for (const e of ents) {
        if (e.children) walk(e.children);
        else files.push(e.path);
      }
    };
    walk(entries);
    this.items = [
      ...files.map((p) => ({ type: "file", name: p }) as Item),
      ...builtinCommands.map(
        (c) => ({ type: "command", name: c.name }) as Item,
      ),
    ];
    this.fuse = new Fuse(this.items, { keys: ["name"], threshold: 0.4 });
  }

  open() {
    this.element.style.display = "block";
    this.input.value = "";
    this.search();
    this.input.focus();
  }

  close() {
    this.element.style.display = "none";
  }

  search() {
    const q = this.input.value.trim();
    let results: Item[];
    if (!q) {
      results = [
        ...commandState.recent.map(
          (n) => ({ type: "command", name: n }) as Item,
        ),
        ...builtinCommands
          .filter((c) => !commandState.recent.includes(c.name))
          .map((c) => ({ type: "command", name: c.name }) as Item),
      ];
    } else {
      results = this.fuse.search(q).map((r) => r.item);
    }
    this.render(results.slice(0, 10));
  }

  render(items: Item[]) {
    this.list.innerHTML = "";
    this.current = items;
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item.name;
      li.addEventListener("click", () => this.activate(item));
      this.list.appendChild(li);
    }
  }

  choose() {
    if (this.current.length > 0) this.activate(this.current[0]);
  }

  async activate(item: Item) {
    if (item.type === "file") {
      const content = await readTextFile(item.name);
      window.dispatchEvent(
        new CustomEvent("file-open", { detail: { path: item.name, content } }),
      );
    } else {
      const cmd = builtinCommands.find((c) => c.name === item.name);
      if (cmd) {
        cmd.action();
        recordCommand(cmd.name);
      }
    }
    this.close();
  }
}
