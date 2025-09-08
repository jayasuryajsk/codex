#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::num::NonZero;
use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use codex_core::auth::AuthManager;
use codex_core::config::Config;
use codex_core::config::ConfigOverrides;
use codex_core::config::find_codex_home;
use codex_core::config::load_config_as_toml;
use codex_core::conversation_manager::ConversationManager;
use codex_core::conversation_manager::NewConversation;
use codex_core::protocol::{AgentMessageDeltaEvent, AgentMessageEvent, EventMsg};
use codex_file_search::run as search_run;
use codex_protocol::mcp_protocol::AuthMode;
use codex_protocol::protocol::InputItem;
use codex_protocol::protocol::Op;
use serde::Deserialize;
use serde::Serialize;
use tauri::State;
use toml::Value as TomlValue;
use uuid::Uuid;

#[derive(Default)]
struct AppState {
    mgr: ConversationManager,
}

fn default_overrides() -> ConfigOverrides {
    ConfigOverrides {
        model: None,
        cwd: None,
        approval_policy: None,
        sandbox_mode: None,
        model_provider: None,
        config_profile: None,
        codex_linux_sandbox_exe: None,
        base_instructions: None,
        include_plan_tool: None,
        include_apply_patch_tool: None,
        include_view_image_tool: None,
        disable_response_storage: None,
        show_raw_agent_reasoning: None,
        tools_web_search_request: None,
    }
}

#[tauri::command]
async fn start_conversation(state: State<'_, AppState>) -> Result<String, String> {
    let config =
        Config::load_with_cli_overrides(vec![], default_overrides()).map_err(|e| e.to_string())?;
    let NewConversation {
        conversation_id, ..
    } = state
        .mgr
        .new_conversation(config)
        .await
        .map_err(|e| e.to_string())?;
    Ok(conversation_id.to_string())
}

#[tauri::command]
async fn send_message(
    state: State<'_, AppState>,
    id: String,
    message: String,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let convo = state
        .mgr
        .get_conversation(uuid)
        .await
        .map_err(|e| e.to_string())?;
    convo
        .submit(Op::UserInput {
            items: vec![InputItem::Text { text: message }],
        })
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn run_codex(
    window: tauri::Window,
    state: State<'_, AppState>,
    input: String,
    context: Option<String>,
) -> Result<(), String> {
    let config =
        Config::load_with_cli_overrides(vec![], default_overrides()).map_err(|e| e.to_string())?;
    let NewConversation { conversation, .. } = state
        .mgr
        .new_conversation(config)
        .await
        .map_err(|e| e.to_string())?;

    let mut text = input;
    if let Some(ctx) = context {
        if !ctx.is_empty() {
            text = format!("{ctx}\n{text}");
        }
    }

    conversation
        .submit(Op::UserInput {
            items: vec![InputItem::Text { text }],
        })
        .await
        .map_err(|e| e.to_string())?;

    loop {
        let event = conversation.next_event().await.map_err(|e| e.to_string())?;
        match event.msg {
            EventMsg::AgentMessageDelta(AgentMessageDeltaEvent { delta }) => {
                window.emit("codex", delta).map_err(|e| e.to_string())?;
            }
            EventMsg::AgentMessage(AgentMessageEvent { message }) => {
                window.emit("codex", message).map_err(|e| e.to_string())?;
            }
            EventMsg::TaskComplete(_) => break,
            _ => {}
        }
    }
    Ok(())
}

#[tauri::command]
async fn apply_patch_command(patch: String) -> Result<(), String> {
    let mut out = Vec::new();
    let mut err = Vec::new();
    codex_apply_patch::apply_patch(&patch, &mut out, &mut err).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
struct FileSearchResponse {
    paths: Vec<String>,
}

#[tauri::command]
async fn search_files(query: String, dir: String) -> Result<FileSearchResponse, String> {
    let cancel = Arc::new(AtomicBool::new(false));
    let results = search_run(
        &query,
        NonZero::new(10).unwrap(),
        Path::new(&dir),
        vec![],
        NonZero::new(1).unwrap(),
        cancel,
        false,
    )
    .map_err(|e| e.to_string())?;
    Ok(FileSearchResponse {
        paths: results.matches.into_iter().map(|m| m.path).collect(),
    })
}

#[tauri::command]
fn load_settings() -> Result<Config, String> {
    Config::load_with_cli_overrides(vec![], default_overrides()).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
struct FrontendSettings {
    model: Option<String>,
    disable_response_storage: Option<bool>,
    hide_agent_reasoning: Option<bool>,
}

#[tauri::command]
fn save_settings(settings: FrontendSettings) -> Result<(), String> {
    let codex_home = find_codex_home().map_err(|e| e.to_string())?;
    let mut root = load_config_as_toml(&codex_home).map_err(|e| e.to_string())?;

    if let Some(model) = settings.model {
        root["model"] = TomlValue::String(model);
    }
    if let Some(disable) = settings.disable_response_storage {
        root["disable_response_storage"] = TomlValue::Boolean(disable);
    }
    if let Some(hide) = settings.hide_agent_reasoning {
        root["hide_agent_reasoning"] = TomlValue::Boolean(hide);
    }

    std::fs::create_dir_all(&codex_home).map_err(|e| e.to_string())?;
    let config_path = codex_home.join("config.toml");
    let toml_str = toml::to_string_pretty(&root).map_err(|e| e.to_string())?;
    std::fs::write(config_path, toml_str).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    let auth = AuthManager::new(std::env::temp_dir(), AuthMode::ApiKey, "frontend".into());
    tauri::Builder::default()
        .manage(AppState {
            mgr: ConversationManager::new(Arc::new(auth)),
        })
        .invoke_handler(tauri::generate_handler![
            start_conversation,
            send_message,
            apply_patch_command,
            search_files,
            run_codex,
            load_settings,
            save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Codex frontend");
}
