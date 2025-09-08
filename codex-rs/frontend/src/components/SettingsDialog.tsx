import { invoke } from "@tauri-apps/api/tauri";

interface Settings {
  model: string;
  model_max_output_tokens?: number | null;
  disable_response_storage: boolean;
  hide_agent_reasoning: boolean;
}

export class SettingsDialog {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.5)",
      display: "none",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1000",
    });

    this.el.innerHTML = `
      <div style="background:white;padding:16px;border-radius:8px;display:flex;flex-direction:column;gap:8px;min-width:300px;">
        <h2>Settings</h2>
        <label>Model: <input id="model" type="text" /></label>
        <label>Max Output Tokens: <input id="max_tokens" type="number" min="0" /></label>
        <label><input id="disable_response_storage" type="checkbox" /> Disable Response Storage</label>
        <label><input id="hide_agent_reasoning" type="checkbox" /> Hide Agent Reasoning</label>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="save-settings">Save</button>
          <button id="close-settings">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    this.el.querySelector("#save-settings")?.addEventListener("click", () => this.save());
    this.el.querySelector("#close-settings")?.addEventListener("click", () => this.close());
  }

  async open() {
    this.el.style.display = "flex";
    const settings = (await invoke("load_settings")) as Settings;
    (this.el.querySelector("#model") as HTMLInputElement).value = settings.model || "";
    const max = settings.model_max_output_tokens ?? "";
    (this.el.querySelector("#max_tokens") as HTMLInputElement).value = max.toString();
    (this.el.querySelector("#disable_response_storage") as HTMLInputElement).checked =
      !!settings.disable_response_storage;
    (this.el.querySelector("#hide_agent_reasoning") as HTMLInputElement).checked =
      !!settings.hide_agent_reasoning;
  }

  close() {
    this.el.style.display = "none";
  }

  async save() {
    const model = (this.el.querySelector("#model") as HTMLInputElement).value;
    const maxTokensStr = (this.el.querySelector("#max_tokens") as HTMLInputElement).value;
    const model_max_output_tokens = maxTokensStr ? parseInt(maxTokensStr, 10) : undefined;
    const disable_response_storage = (this.el.querySelector("#disable_response_storage") as HTMLInputElement).checked;
    const hide_agent_reasoning = (this.el.querySelector("#hide_agent_reasoning") as HTMLInputElement).checked;
    await invoke("save_settings", {
      settings: {
        model,
        model_max_output_tokens,
        disable_response_storage,
        hide_agent_reasoning,
      },
    });
    this.close();
  }
}

