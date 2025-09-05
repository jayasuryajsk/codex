import { invoke } from "@tauri-apps/api/tauri";
import { readTextFile } from "@tauri-apps/api/fs";
import { EditorView, basicSetup } from "codemirror";
import { createTwoFilesPatch } from "diff";

let conversationId = null;
let currentFile = null;
let originalContent = "";
const view = new EditorView({
  doc: "",
  extensions: [basicSetup],
  parent: document.getElementById("editor"),
});

async function ensureConversation() {
  if (!conversationId) {
    conversationId = await invoke("start_conversation");
  }
}

document.getElementById("send").addEventListener("click", async () => {
  await ensureConversation();
  const prompt = document.getElementById("prompt").value;
  await invoke("send_message", { id: conversationId, message: prompt });
});

document.getElementById("search").addEventListener("input", async (e) => {
  const query = e.target.value;
  const resp = await invoke("search_files", { query, dir: "." });
  const list = document.getElementById("files");
  list.innerHTML = "";
  resp.paths.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    li.addEventListener("click", async () => {
      const content = await readTextFile(p);
      currentFile = p;
      originalContent = content;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
    });
    list.appendChild(li);
  });
});

document.getElementById("apply").addEventListener("click", async () => {
  if (!currentFile) return;
  const newContent = view.state.doc.toString();
  const patch = createTwoFilesPatch(
    currentFile,
    currentFile,
    originalContent,
    newContent,
  );
  document.getElementById("patch-preview").textContent = patch;
  if (confirm("Apply this patch?")) {
    await invoke("apply_patch_command", { patch });
    originalContent = newContent;
  }
});

async function loadSettings() {
  const settings = await invoke("load_settings");
  document.getElementById("settings").textContent = JSON.stringify(
    settings,
    null,
    2,
  );
}

loadSettings();
