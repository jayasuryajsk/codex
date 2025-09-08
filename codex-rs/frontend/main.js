import { invoke } from "@tauri-apps/api/tauri";
import { SettingsPanel } from "./settings_panel.js";
import { MainLayout } from "./src/main_layout.js";
import { FileTree } from "./src/components/FileTree.js";

new MainLayout();

const fileTree = new FileTree(document.getElementById("file-tree"));

let conversationId = null;

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

window.addEventListener("file-open", (e) => {
  document.getElementById("response").textContent = e.detail.content;
});

document.getElementById("apply").addEventListener("click", async () => {
  const patch = document.getElementById("patch").value;
  await invoke("apply_patch_command", { patch });
});

const settingsPanel = new SettingsPanel(
  document.getElementById("settings-panel")
);
document
  .getElementById("open-settings")
  .addEventListener("click", () => settingsPanel.open());
