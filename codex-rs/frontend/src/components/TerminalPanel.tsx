import { Command } from "@tauri-apps/api/shell";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

interface Session {
  term: Terminal;
  child: any;
  container: HTMLDivElement;
  tab: HTMLDivElement;
}

export class TerminalPanel {
  element: HTMLDivElement;
  tabs: HTMLDivElement;
  sessions: Session[] = [];
  active = -1;

  constructor() {
    this.element = document.createElement("div");
    this.element.id = "terminal-panel";
    Object.assign(this.element.style, {
      position: "fixed",
      inset: "0",
      display: "none",
      flexDirection: "column",
      background: "#000",
      zIndex: "1000",
    });

    this.tabs = document.createElement("div");
    Object.assign(this.tabs.style, {
      display: "flex",
      background: "#333",
    });
    this.element.appendChild(this.tabs);

    document.body.appendChild(this.element);

    const add = document.createElement("button");
    add.textContent = "+";
    add.addEventListener("click", () => this.newSession());
    this.tabs.appendChild(add);

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        this.toggle();
      }
    });

    this.newSession();
  }

  toggle() {
    if (this.element.style.display === "none") {
      this.element.style.display = "flex";
      this.sessions[this.active]?.term.focus();
    } else {
      this.element.style.display = "none";
    }
  }

  async newSession() {
    const idx = this.sessions.length;
    const tab = document.createElement("div");
    tab.textContent = `Shell ${idx + 1}`;
    Object.assign(tab.style, {
      padding: "4px 8px",
      cursor: "pointer",
    });
    tab.addEventListener("click", () => this.activate(idx));
    this.tabs.insertBefore(tab, this.tabs.lastElementChild);

    const container = document.createElement("div");
    container.style.flex = "1";
    container.style.display = "none";
    this.element.appendChild(container);

    const term = new Terminal();
    term.open(container);

    const command = new Command("sh", [], { cwd: "." });
    const child = await command.spawn();
    child.stdout.on("data", (line: string) => term.write(line));
    child.stderr.on("data", (line: string) => term.write(line));
    term.onData((d) => child.write(d));
    child.on("close", () => term.write("\r\n[process exited]\r\n"));

    this.sessions.push({ term, child, container, tab });
    this.activate(idx);
  }

  activate(idx: number) {
    if (this.active >= 0) {
      const prev = this.sessions[this.active];
      prev.container.style.display = "none";
      prev.tab.style.background = "";
    }
    const sess = this.sessions[idx];
    sess.container.style.display = "block";
    sess.tab.style.background = "#555";
    this.active = idx;
    sess.term.focus();
  }
}
