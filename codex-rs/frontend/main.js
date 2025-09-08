import { invoke } from "@tauri-apps/api/tauri";
import { SettingsPanel } from "./settings_panel.js";
import { MainLayout } from "./src/main_layout.js";

new MainLayout();

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

document.getElementById("search").addEventListener("input", async (e) => {
  const query = e.target.value;
  const resp = await invoke("search_files", { query, dir: "." });
  const list = document.getElementById("files");
  list.innerHTML = "";
  resp.paths.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    list.appendChild(li);
  });
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
