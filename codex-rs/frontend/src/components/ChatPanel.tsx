import React from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { readTextFile } from "@tauri-apps/api/fs";
import { createRoot } from "react-dom/client";
import { workspace } from "../state/workspace.ts";
import { PatchViewer } from "./PatchViewer.js";
import { appendMessage, appendPatch } from "../state/history.ts";

export class ChatPanel {
  container: HTMLElement;
  root: string;
  messages: { role: string; content: string }[];
  list: HTMLDivElement;
  input: HTMLInputElement;
  send: HTMLButtonElement;
  fileInput: HTMLInputElement;

  constructor(container: HTMLElement, root = ".") {
    this.container = container;
    this.root = root;
    this.messages = workspace.chatLogs;

    this.container.innerHTML = `
      <div class="messages"></div>
      <div class="input-row">
        <button id="attach-file">Attach File</button>
        <input id="chat-input" type="text" placeholder="Enter message" />
        <button id="chat-send">Send</button>
      </div>
    `;

    this.list = this.container.querySelector(".messages") as HTMLDivElement;
    this.input = this.container.querySelector(
      "#chat-input",
    ) as HTMLInputElement;
    this.send = this.container.querySelector("#chat-send") as HTMLButtonElement;
    const attach = this.container.querySelector(
      "#attach-file",
    ) as HTMLButtonElement;

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.multiple = true;
    this.fileInput.style.display = "none";
    this.container.appendChild(this.fileInput);

    attach.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", () => this.handleFileSelection());

    window.addEventListener("file-selected", (e: any) => {
      const path = e.detail.path as string;
      this.insertFile(path);
    });

    this.send.addEventListener("click", () => this.submit());

    for (const m of this.messages) {
      this.renderMessage(m.role, m.content);
    }
  }

  renderMessage(role: string, text: string): HTMLDivElement {
    const div = document.createElement("div");
    div.className = role;
    div.textContent = text;
    this.list.appendChild(div);
    this.list.scrollTop = this.list.scrollHeight;
    return div;
  }

  async handleFileSelection(): Promise<void> {
    const files = Array.from(this.fileInput.files || []);
    for (const file of files) {
      const text = await file.text();
      this.input.value += `\n${text}\n`;
    }
    this.fileInput.value = "";
  }

  async insertFile(path: string): Promise<void> {
    try {
      const content = await readTextFile(path);
      this.input.value += `\n${content}\n`;
    } catch {
      // ignore
    }
  }

  showPatch(patch: string): void {
    const modal = document.createElement("div");
    Object.assign(modal.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.5)",
      overflow: "auto",
      zIndex: "1000",
    });
    document.body.appendChild(modal);
    const root = createRoot(modal);
    const close = () => {
      root.unmount();
      document.body.removeChild(modal);
    };
    root.render(
      <PatchViewer
        patch={patch}
        onApply={async (p: string) => {
          await appendPatch(p);
          close();
        }}
        onReject={close}
      />,
    );
  }

  async submit(): Promise<void> {
    const text = this.input.value;
    if (!text.trim()) return;
    this.input.value = "";

    this.messages.push({ role: "user", content: text });
    this.renderMessage("user", text);
    await appendMessage("user", text);

    const assistant = { role: "assistant", content: "" };
    this.messages.push(assistant);
    const div = this.renderMessage("assistant", "");

    const unlisten = await listen("codex", (event) => {
      assistant.content += event.payload as string;
      div.textContent = assistant.content;
      this.list.scrollTop = this.list.scrollHeight;
    });

    await invoke("run_codex", { input: text });
    unlisten();

    await appendMessage("assistant", assistant.content);

    const match = assistant.content.match(/diff --git[\s\S]*$/);
    if (match) {
      this.showPatch(match[0]);
    }
  }
}
