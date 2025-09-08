import { invoke } from "@tauri-apps/api/tauri";
import { SettingsPanel } from "./src/components/SettingsPanel.js";
import { MainLayout } from "./src/main_layout.js";
import { FileTree } from "./src/components/FileTree.js";
import { ChatPanel } from "./src/components/ChatPanel.js";
import { AuthModal } from "./src/components/AuthModal.js";

new MainLayout();

const fileTree = new FileTree(document.getElementById("file-tree"));
new ChatPanel(document.getElementById("chat"));

const authModal = new AuthModal();
authModal.open();

document.getElementById("apply").addEventListener("click", async () => {
  const patch = document.getElementById("patch").value;
  await invoke("apply_patch_command", { patch });
});

const settingsPanel = new SettingsPanel(
  document.getElementById("settings-panel"),
);
document
  .getElementById("open-settings")
  .addEventListener("click", () => settingsPanel.open());
