import { invoke } from "@tauri-apps/api/tauri";

export class SettingsPanel {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <label>Model: <input id="model" type="text" /></label><br />
      <label>
        <input id="disable_response_storage" type="checkbox" /> Disable Response
        Storage
      </label><br />
      <label>
        <input id="hide_agent_reasoning" type="checkbox" /> Hide Agent Reasoning
      </label><br />
      <button id="save-settings">Save</button>
    `;
    this.container
      .querySelector("#save-settings")
      .addEventListener("click", () => this.save());
  }

  async open() {
    this.container.style.display = "block";
    const settings = await invoke("load_settings");
    this.container.querySelector("#model").value = settings.model;
    this.container.querySelector("#disable_response_storage").checked =
      settings.disable_response_storage;
    this.container.querySelector("#hide_agent_reasoning").checked =
      settings.hide_agent_reasoning;
  }

  async save() {
    const model = this.container.querySelector("#model").value;
    const disable_response_storage = this.container.querySelector(
      "#disable_response_storage"
    ).checked;
    const hide_agent_reasoning = this.container.querySelector(
      "#hide_agent_reasoning"
    ).checked;
    await invoke("save_settings", {
      settings: { model, disable_response_storage, hide_agent_reasoning },
    });
  }
}

