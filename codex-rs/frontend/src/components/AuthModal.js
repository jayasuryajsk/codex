import { invoke } from "@tauri-apps/api/tauri";
import { secureStorage } from "@tauri-apps/plugin-secure-storage";

export class AuthModal {
  constructor() {
    this.el = document.createElement("div");
    this.el.style.position = "fixed";
    this.el.style.inset = "0";
    this.el.style.background = "rgba(0,0,0,0.5)";
    this.el.style.display = "none";
    this.el.style.alignItems = "center";
    this.el.style.justifyContent = "center";

    this.el.innerHTML = `
      <div style="background:white;padding:16px;border-radius:8px;display:flex;flex-direction:column;gap:8px;min-width:300px;">
        <h2>Authenticate</h2>
        <div class="api-key">
          <input id="api-key" type="text" placeholder="API Key" />
          <button id="submit-key">Use API Key</button>
        </div>
        <div class="login">
          <input id="username" type="text" placeholder="Username" />
          <input id="password" type="password" placeholder="Password" />
          <button id="login-btn">Login</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.el);

    this.el.querySelector("#submit-key").addEventListener("click", () => this.submitApiKey());
    this.el.querySelector("#login-btn").addEventListener("click", () => this.submitLogin());
  }

  open() {
    this.el.style.display = "flex";
  }

  close() {
    this.el.style.display = "none";
  }

  async submitApiKey() {
    const apiKey = this.el.querySelector("#api-key").value.trim();
    if (!apiKey) return;
    const token = await invoke("login_with_api_key", { apiKey });
    await secureStorage.set("auth_token", token || apiKey);
    this.close();
  }

  async submitLogin() {
    const username = this.el.querySelector("#username").value.trim();
    const password = this.el.querySelector("#password").value;
    if (!username || !password) return;
    const token = await invoke("login_with_credentials", { username, password });
    if (token) {
      await secureStorage.set("auth_token", token);
      this.close();
    }
  }
}
