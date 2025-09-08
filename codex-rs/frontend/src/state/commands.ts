import { readTextFile, writeFile, createDir } from "@tauri-apps/api/fs";
import { homeDir, join } from "@tauri-apps/api/path";

export interface CommandState {
  recent: string[];
}

function defaultState(): CommandState {
  return { recent: [] };
}

async function commandsPath(): Promise<string> {
  const home = await homeDir();
  return await join(home, ".config", "codex-frontend", "commands.json");
}

export const commandState: CommandState = await (async () => {
  try {
    const text = await readTextFile(await commandsPath());
    return { ...defaultState(), ...JSON.parse(text) } as CommandState;
  } catch {
    return defaultState();
  }
})();

export async function saveCommands(): Promise<void> {
  const path = await commandsPath();
  const dir = await join(await homeDir(), ".config", "codex-frontend");
  await createDir(dir, { recursive: true });
  await writeFile({ path, contents: JSON.stringify(commandState) });
}

export function recordCommand(name: string): void {
  const idx = commandState.recent.indexOf(name);
  if (idx !== -1) commandState.recent.splice(idx, 1);
  commandState.recent.unshift(name);
  if (commandState.recent.length > 20) commandState.recent.pop();
  void saveCommands();
}

export interface BuiltinCommand {
  name: string;
  action: () => void | Promise<void>;
}

export const builtinCommands: BuiltinCommand[] = [
  {
    name: "Ask Codex",
    action: () =>
      window.dispatchEvent(new CustomEvent("command", { detail: "ask-codex" })),
  },
  {
    name: "New File",
    action: () =>
      window.dispatchEvent(new CustomEvent("command", { detail: "new-file" })),
  },
];
