import { readTextFile, writeFile, createDir } from "@tauri-apps/api/fs";

const DIR = ".codex";
const PATH = `${DIR}/history.json`;

interface HistoryData {
  messages: { role: string; content: string; timestamp: number }[];
  patches: { patch: string; timestamp: number }[];
}

async function loadHistory(): Promise<HistoryData> {
  try {
    const text = await readTextFile(PATH);
    return JSON.parse(text) as HistoryData;
  } catch {
    return { messages: [], patches: [] };
  }
}

async function saveHistory(data: HistoryData): Promise<void> {
  await createDir(DIR, { recursive: true });
  await writeFile({ path: PATH, contents: JSON.stringify(data, null, 2) });
}

export async function appendMessage(
  role: string,
  content: string,
): Promise<void> {
  const data = await loadHistory();
  data.messages.push({ role, content, timestamp: Date.now() });
  await saveHistory(data);
}

export async function appendPatch(patch: string): Promise<void> {
  const data = await loadHistory();
  data.patches.push({ patch, timestamp: Date.now() });
  await saveHistory(data);
}
