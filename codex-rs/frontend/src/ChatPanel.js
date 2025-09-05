import { invoke } from "@tauri-apps/api/tauri";

export class ChatPanel {
  constructor(container, layout) {
    this.container = container;
    this.layout = layout;
    this.messages = container.querySelector('.messages');
    this.input = container.querySelector('.prompt');
    this.sendBtn = container.querySelector('.send');
    this.modeBtn = container.querySelector('.mode');
    this.conversationId = null;

    this.sendBtn.addEventListener('click', () => this.send());
    this.modeBtn.addEventListener('click', () => this.toggleMode());
  }

  toggleMode() {
    this.container.classList.toggle('overlay');
    this.layout.classList.toggle('overlay-chat');
  }

  async ensureConversation() {
    if (!this.conversationId) {
      this.conversationId = await invoke('start_conversation');
    }
  }

  async send() {
    await this.ensureConversation();
    const message = this.input.value;
    await invoke('send_message', { id: this.conversationId, message });
    const div = document.createElement('div');
    div.textContent = message;
    this.messages.appendChild(div);
    this.input.value = '';
  }
}
