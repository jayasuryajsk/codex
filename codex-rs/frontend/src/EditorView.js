export class EditorView {
  constructor(container) {
    this.container = container;
    this.textarea = container.querySelector('.editor');
  }

  getValue() {
    return this.textarea.value;
  }

  setValue(text) {
    this.textarea.value = text;
  }
}
