import { invoke } from "@tauri-apps/api/tauri";
import { SettingsDialog } from "./src/components/SettingsDialog.tsx";
import { MainLayout } from "./src/main_layout.js";
import { FileTree } from "./src/components/FileTree.js";
import { ChatPanel } from "./src/components/ChatPanel.tsx";
import { AuthDialog } from "./src/components/AuthDialog.tsx";
import { CommandPalette } from "./src/components/CommandPalette.tsx";
import { writeFile } from "@tauri-apps/api/fs";
import { TerminalPanel } from "./src/components/TerminalPanel.tsx";
import {
  workspace,
  saveWorkspace,
  resetWorkspace,
} from "./src/state/workspace.ts";

new MainLayout();

const fileTree = new FileTree(document.getElementById("file-tree"));
new ChatPanel(document.getElementById("chat"));

const palette = new CommandPalette(".");
new TerminalPanel();

window.addEventListener("file-open", (e) => {
  const { path, content } = e.detail;
  const existing = workspace.openEditors.find((ed) => ed.path === path);
  if (existing) {
    existing.content = content;
  } else {
    workspace.openEditors.push({ path, content });
  }
});

const saveOnExit = () => {
  saveWorkspace();
};
window.addEventListener("beforeunload", saveOnExit);

const authDialog = new AuthDialog();
authDialog.open();

document.getElementById("apply").addEventListener("click", async () => {
  const patch = document.getElementById("patch").value;
  await invoke("apply_patch_command", { patch });
});

const settingsDialog = new SettingsDialog();
document
  .getElementById("open-settings")
  ?.addEventListener("click", () => settingsDialog.open());

document
  .getElementById("open-auth")
  ?.addEventListener("click", () => authDialog.open());

document
  .getElementById("reset-workspace")
  ?.addEventListener("click", async () => {
    window.removeEventListener("beforeunload", saveOnExit);
    await resetWorkspace();
    window.location.reload();
  });

window.addEventListener("command", async (e) => {
  const name = e.detail;
  if (name === "ask-codex") {
    document.getElementById("chat-input")?.focus();
  } else if (name === "new-file") {
    const filename = prompt("File name?");
    if (!filename) return;
    await writeFile({ path: filename, contents: "" });
    window.dispatchEvent(
      new CustomEvent("file-open", { detail: { path: filename, content: "" } }),
    );
  }
});
