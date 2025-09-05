import { FileExplorer } from './src/FileExplorer.js';
import { EditorView } from './src/EditorView.js';
import { ChatPanel } from './src/ChatPanel.js';

const layout = document.getElementById('layout');

new FileExplorer(
  document.getElementById('file-explorer'),
  layout,
  document.getElementById('toggle-explorer')
);

new EditorView(document.getElementById('editor-view'));
new ChatPanel(document.getElementById('chat-panel'), layout);
