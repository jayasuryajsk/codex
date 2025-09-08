import { workspace } from "./state/workspace.ts";

export class MainLayout {
  constructor() {
    this.layout = document.getElementById("layout");
    this.sidebar = document.getElementById("sidebar");
    this.chat = document.getElementById("chat");
    this.toggle = document.getElementById("toggle-sidebar");

    this.sidebarVisible = JSON.parse(
      localStorage.getItem("sidebarVisible") || "true"
    );
    this.sidebarWidth = workspace.sidebarWidth || "250px";

    this.applyState();

    this.toggle.addEventListener("click", () => this.toggleSidebar());
    this.sidebar.addEventListener("mouseup", () => this.storeWidth());
    this.sidebar.addEventListener("mouseleave", () => this.storeWidth());
  }

  applyState() {
    if (this.sidebarVisible) {
      this.sidebar.style.display = "block";
      this.sidebar.style.width = this.sidebarWidth;
      this.layout.style.gridTemplateColumns = `${this.sidebarWidth} 1fr`;
      this.toggle.textContent = "Hide Sidebar";
    } else {
      this.sidebar.style.display = "none";
      this.layout.style.gridTemplateColumns = `0 1fr`;
      this.toggle.textContent = "Show Sidebar";
    }
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    localStorage.setItem(
      "sidebarVisible",
      JSON.stringify(this.sidebarVisible)
    );
    this.applyState();
  }

  storeWidth() {
    if (!this.sidebarVisible) return;
    const width = `${this.sidebar.offsetWidth}px`;
    this.sidebarWidth = width;
    this.layout.style.gridTemplateColumns = `${width} 1fr`;
    workspace.sidebarWidth = width;
  }
}
