import { invoke } from "@tauri-apps/api/tauri";

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

async function loadSettings() {
  const settings = await invoke("load_settings");
  document.getElementById("settings").textContent = JSON.stringify(settings, null, 2);
}

loadSettings();
