import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { readTextFile, writeFile, createDir } from "@tauri-apps/api/fs";

export class ChatPanel {
  constructor(container, root = ".") {
    this.container = container;
    this.root = root;
    this.messages = [];
    this.selectedFile = null;

    this.container.innerHTML = `
      <div class="messages"></div>
      <div class="input-row">
        <button id="insert-file">Insert File</button>
        <input id="chat-input" type="text" placeholder="Enter message" />
        <button id="chat-send">Send</button>
      </div>
    `;

    this.list = this.container.querySelector(".messages");
    this.input = this.container.querySelector("#chat-input");
    this.send = this.container.querySelector("#chat-send");
    this.insert = this.container.querySelector("#insert-file");

    this.send.addEventListener("click", () => this.submit());
    this.insert.addEventListener("click", () => this.insertFile());

    window.addEventListener("file-selected", (e) => {
      this.selectedFile = e.detail.path;
    });

    this.loadHistory();
  }

  renderMessage(role, text) {
    const div = document.createElement("div");
    div.className = role;
    div.textContent = text;
    this.list.appendChild(div);
    this.list.scrollTop = this.list.scrollHeight;
    return div;
  }

  async loadHistory() {
    try {
      const text = await readTextFile(`${this.root}/.codex/history.json`);
      this.messages = JSON.parse(text);
      for (const m of this.messages) {
        this.renderMessage(m.role, m.content);
      }
    } catch (_) {
      this.messages = [];
    }
  }

  async saveHistory() {
    await createDir(`${this.root}/.codex`, { recursive: true });
    await writeFile({
      path: `${this.root}/.codex/history.json`,
      contents: JSON.stringify(this.messages),
    });
  }

  async insertFile() {
    if (!this.selectedFile) return;
    const content = await readTextFile(this.selectedFile);
    this.input.value += `\n${content}\n`;
  }

  async submit() {
    const text = this.input.value;
    if (!text.trim()) return;
    this.input.value = "";

    this.messages.push({ role: "user", content: text });
    this.renderMessage("user", text);

    const assistant = { role: "assistant", content: "" };
    this.messages.push(assistant);
    const div = this.renderMessage("assistant", "");

    const unlisten = await listen("codex", (event) => {
      assistant.content += event.payload;
      div.textContent = assistant.content;
      this.list.scrollTop = this.list.scrollHeight;
    });

    await invoke("run_codex", { input: text });
    unlisten();
    await this.saveHistory();
  }
}
