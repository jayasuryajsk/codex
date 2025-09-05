import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function App() {
  const [conversationId, setConversationId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState([]);
  const [patch, setPatch] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    invoke("load_settings").then((s) => setSettings(s));
  }, []);

  async function ensureConversation() {
    if (!conversationId) {
      const id = await invoke("start_conversation");
      setConversationId(id);
    }
  }

  async function send() {
    await ensureConversation();
    await invoke("send_message", { id: conversationId, message: prompt });
    setPrompt("");
  }

  async function search(q) {
    setSearchQuery(q);
    const resp = await invoke("search_files", { query: q, dir: "." });
    setFiles(resp.paths);
  }

  async function applyPatch() {
    await invoke("apply_patch_command", { patch });
    setPatch("");
  }

  return (
    <div>
      <h1>Codex Frontend</h1>
      {settings && (
        <pre id="settings">{JSON.stringify(settings, null, 2)}</pre>
      )}
      <input
        id="prompt"
        type="text"
        placeholder="Enter prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button id="send" onClick={send}>
        Send
      </button>
      <div>
        <input
          id="search"
          type="text"
          placeholder="Search files"
          value={searchQuery}
          onChange={(e) => search(e.target.value)}
        />
        <ul id="files">
          {files.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      <div>
        <textarea
          id="patch"
          placeholder="Patch text"
          value={patch}
          onChange={(e) => setPatch(e.target.value)}
        />
        <button id="apply" onClick={applyPatch}>
          Apply Patch
        </button>
      </div>
    </div>
  );
}
