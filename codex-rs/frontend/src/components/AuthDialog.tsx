import { invoke } from "@tauri-apps/api/tauri";
import { secureStorage } from "@tauri-apps/plugin-secure-storage";

export class AuthDialog {
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
        <h2>Authenticate</h2>
        <div class="api-key" style="display:flex;gap:8px;flex-direction:column;">
          <input id="api-key" type="text" placeholder="API Key" />
          <button id="submit-key">Use API Key</button>
        </div>
        <div class="oauth" style="display:flex;flex-direction:column;gap:8px;">
          <button id="oauth-login">Login with OAuth</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    this.el.querySelector("#submit-key")?.addEventListener("click", () => this.submitApiKey());
    this.el.querySelector("#oauth-login")?.addEventListener("click", () => this.submitOAuth());
  }

  open() {
    this.el.style.display = "flex";
  }

  close() {
    this.el.style.display = "none";
  }

  private async submitApiKey() {
    const apiKey = (this.el.querySelector("#api-key") as HTMLInputElement).value.trim();
    if (!apiKey) return;
    const token = await invoke("login_with_api_key", { apiKey });
    await secureStorage.set("auth_token", (token as string) || apiKey);
    this.close();
  }

  private async submitOAuth() {
    const token = await invoke("login_with_credentials", {});
    if (token) {
      await secureStorage.set("auth_token", token as string);
      this.close();
    }
  }
}

