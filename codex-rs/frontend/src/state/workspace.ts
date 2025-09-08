import { readTextFile, writeFile, createDir, removeFile } from "@tauri-apps/api/fs";
import { homeDir, join } from "@tauri-apps/api/path";

export interface WorkspaceState {
  openEditors: { path: string; content: string }[];
  sidebarWidth: string;
  chatLogs: { role: string; content: string }[];
}

function defaultState(): WorkspaceState {
  return { openEditors: [], sidebarWidth: "250px", chatLogs: [] };
}

async function workspacePath(): Promise<string> {
  const home = await homeDir();
  return await join(home, ".config", "codex-frontend", "workspace.json");
}

export const workspace: WorkspaceState = await (async () => {
  try {
    const text = await readTextFile(await workspacePath());
    return { ...defaultState(), ...JSON.parse(text) } as WorkspaceState;
  } catch {
    return defaultState();
  }
})();

export async function saveWorkspace(): Promise<void> {
  const path = await workspacePath();
  const dir = await join(await homeDir(), ".config", "codex-frontend");
  await createDir(dir, { recursive: true });
  await writeFile({ path, contents: JSON.stringify(workspace) });
}

export async function resetWorkspace(): Promise<void> {
  Object.assign(workspace, defaultState());
  try {
    await removeFile(await workspacePath());
  } catch {
    // ignore if file does not exist
  }
}
