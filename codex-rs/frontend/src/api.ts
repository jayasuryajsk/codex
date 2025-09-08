import { invoke } from "@tauri-apps/api/tauri";

export interface CommandStatus {
  code: number;
}

export interface SearchFilesResult extends CommandStatus {
  paths: string[];
}

export interface LoginResult extends CommandStatus {
  token?: string;
}

export function runCodex(input: string, context?: string): Promise<CommandStatus> {
  return invoke("run_codex", { input, context });
}

export function searchFiles(query: string, dir: string): Promise<SearchFilesResult> {
  return invoke("search_files", { query, dir });
}

export function applyPatch(patch: string): Promise<CommandStatus> {
  return invoke("apply_patch_command", { patch });
}

export function loginWithApiKey(apiKey: string): Promise<LoginResult> {
  return invoke("login_with_api_key", { apiKey });
}

export function loginWithCredentials(
  username: string,
  password: string,
): Promise<LoginResult> {
  return invoke("login_with_credentials", { username, password });
}
