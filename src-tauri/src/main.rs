// src-tauri/src/main.rs
// Smart Hub | Rust Core Backend Entry Point
// Phase 1: Rust Backend Scaffolding & Taxonomic Refactoring

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;
use tauri::{Manager, State};
use serde::{Serialize, Deserialize};
use tracing::{info, error};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

// Core data models - Phase 1.3: Serde Taxonomies
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: uuid::Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub workspace_root: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: uuid::Uuid,
    pub project_id: uuid::Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: TaskStatus,
    pub priority: TaskPriority,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Todo,
    InProgress,
    InReview,
    Done,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskPriority {
    Low,
    Medium,
    High,
    Critical,
}

// Health endpoint response - Phase 1.6
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub system: SystemDiagnostics,
    pub database: DatabaseStatus,
    pub active_sessions: Vec<String>,
    pub log_buffer: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SystemDiagnostics {
    pub cpu_load_percent: f64,
    pub memory_used_mb: u64,
    pub memory_total_mb: u64,
    pub uptime_seconds: u64,
}

#[derive(Debug, Serialize)]
pub struct DatabaseStatus {
    pub connected: bool,
    pub connection_pool_size: u32,
    pub active_connections: u32,
}

// Application state for dependency injection
#[derive(Clone)]
pub struct AppState {
    pub app_start_time: chrono::DateTime<chrono::Utc>,
    pub active_sessions: Arc<tokio::sync::Mutex<Vec<String>>>,
    pub log_buffer: Arc<tokio::sync::Mutex<Vec<String>>>,
    #[cfg(feature = "database")]
    pub db_pool: Option<sqlx::PgPool>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            app_start_time: chrono::Utc::now(),
            active_sessions: Arc::new(tokio::sync::Mutex::new(Vec::new())),
            log_buffer: Arc::new(tokio::sync::Mutex::new(Vec::with_capacity(100))),
            #[cfg(feature = "database")]
            db_pool: None,
        }
    }
}

// IPC Command: Health Endpoint - Phase 1.6
#[tauri::command]
async fn health_check(state: State<'_, AppState>) -> Result<HealthResponse, String> {
    info!("Health check requested");
    
    // Gather system diagnostics (simplified for demo)
    let sys = sysinfo::System::new_all();
    let cpu_load = sys.global_cpu_info().cpu_usage() as f64;
    let memory_used = sys.used_memory() / 1024;
    let memory_total = sys.total_memory() / 1024;
    let uptime = sys.uptime();
    
    // Database status
    let db_status = DatabaseStatus {
        connected: cfg!(feature = "database"),
        connection_pool_size: 10,
        active_connections: 0,
    };
    
    // Get truncated log buffer
    let log_buffer = {
        let buffer = state.log_buffer.lock().await;
        buffer.iter().rev().take(20).cloned().collect()
    };
    
    // Get active sessions
    let active_sessions = {
        let sessions = state.active_sessions.lock().await;
        sessions.clone()
    };
    
    Ok(HealthResponse {
        status: "healthy".to_string(),
        timestamp: chrono::Utc::now(),
        system: SystemDiagnostics {
            cpu_load_percent: cpu_load,
            memory_used_mb: memory_used,
            memory_total_mb: memory_total,
            uptime_seconds: uptime,
        },
        database: db_status,
        active_sessions,
        log_buffer,
    })
}

// IPC Command: Log message to buffer (for debugging)
#[tauri::command]
async fn log_message(state: State<'_, AppState>, message: String) {
    let mut buffer = state.log_buffer.lock().await;
    buffer.push(format!("[{}] {}", chrono::Utc::now(), message));
    // Keep buffer size bounded
    if buffer.len() > 100 {
        buffer.drain(0..buffer.len() - 100);
    }
    info!("Logged: {}", message);
}

// IPC Command: Register active session
#[tauri::command]
async fn register_session(state: State<'_, AppState>, session_id: String) -> Result<(), String> {
    let mut sessions = state.active_sessions.lock().await;
    if !sessions.contains(&session_id) {
        sessions.push(session_id.clone());
        info!("Registered session: {}", session_id);
        Ok(())
    } else {
        Err(format!("Session {} already registered", session_id))
    }
}

// IPC Command: Unregister session
#[tauri::command]
async fn unregister_session(state: State<'_, AppState>, session_id: String) -> Result<(), String> {
    let mut sessions = state.active_sessions.lock().await;
    if let Some(pos) = sessions.iter().position(|s| s == &session_id) {
        sessions.remove(pos);
        info!("Unregistered session: {}", session_id);
        Ok(())
    } else {
        Err(format!("Session {} not found", session_id))
    }
}

// Initialize tracing/logger - Phase 1.2
fn setup_logging() -> Result<(), Box<dyn std::error::Error>> {
    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        std::env::temp_dir().join("smart-hub"),
        "smart-hub.log",
    );
    
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "smart_hub=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking))
        .with(tracing_subscriber::fmt::layer().with_writer(std::io::stdout))
        .init();
    
    Ok(())
}

fn main() {
    // Setup logging
    if let Err(e) = setup_logging() {
        eprintln!("Failed to initialize logging: {}", e);
    }
    
    info!("Smart Hub Rust Core initializing...");
    
    // Create application state
    let app_state = AppState::new();
    
    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            health_check,
            log_message,
            register_session,
            unregister_session,
        ])
        .setup(|app| {
            info!("Smart Hub Tauri app setup complete");
            // Initialize database connection if feature enabled
            #[cfg(feature = "database")]
            {
                info!("Database feature enabled - connection will be established on first use");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Smart Hub application");
    
    info!("Smart Hub application terminated");
}
