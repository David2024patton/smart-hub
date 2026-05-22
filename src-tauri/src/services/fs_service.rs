use std::path::Path;
use std::fs;
use chrono::{DateTime, Utc};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum FsError {
    #[error("Path not found: {0}")]
    NotFound(String),
    #[error("Permission denied: {0}")]
    PermissionDenied(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_file: bool,
    pub size: u64,
    pub modified: String,
    pub extension: String,
}

#[derive(Debug, Serialize)]
pub struct DriveEntry {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub drive_type: String,
}

pub fn list_directory(path_str: &str) -> Result<Vec<FileEntry>, FsError> {
    let path = Path::new(path_str);
    if !path.exists() {
        return Err(FsError::NotFound(path_str.to_string()));
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let meta = entry.metadata()?;
        let name = entry.file_name().to_string_lossy().to_string();
        let file_path = entry.path().to_string_lossy().to_string();
        let ext = entry.path().extension()
            .map(|e| e.to_string_lossy().to_string())
            .unwrap_or_default();
        let modified: DateTime<Utc> = meta.modified()
            .map(|t| DateTime::from(t))
            .unwrap_or_else(|_| DateTime::UNIX_EPOCH.into());

        entries.push(FileEntry {
            name,
            path: file_path,
            is_dir: meta.is_dir(),
            is_file: meta.is_file(),
            size: meta.len(),
            modified: modified.format("%Y-%m-%d %H:%M:%S").to_string(),
            extension: ext,
        });
    }

    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

pub fn get_windows_drives() -> Vec<DriveEntry> {
    let mut drives = Vec::new();
    for letter in 'A'..='Z' {
        let path = format!("{}:\\", letter);
        let p = Path::new(&path);
        if p.exists() {
            let drive_type = detect_drive_type(&path);
            drives.push(DriveEntry {
                name: format!("{}:", letter),
                mount_point: path,
                total_space: 0,
                available_space: 0,
                drive_type,
            });
        }
    }
    drives
}

pub fn get_unix_mounts() -> Vec<DriveEntry> {
    let mut drives = Vec::new();
    if let Ok(mounts) = fs::read_to_string("/proc/mounts") {
        for line in mounts.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                let mount = parts[1];
                let dev = parts[0];
                if dev == "rootfs" || dev.starts_with("tmpfs") || dev.starts_with("devpts")
                    || dev.starts_with("sysfs") || dev.starts_with("proc") || dev.starts_with("cgroup")
                {
                    continue;
                }
                if mount == "/" || mount.starts_with("/media/") || mount.starts_with("/mnt/")
                    || mount.starts_with("/run/media/")
                {
                    if !drives.iter().any(|d| d.mount_point == mount) {
                        drives.push(DriveEntry {
                            name: dev.rsplit('/').next().unwrap_or(dev).to_string(),
                            mount_point: mount.to_string(),
                            total_space: 0,
                            available_space: 0,
                            drive_type: "Mount".to_string(),
                        });
                    }
                }
            }
        }
    }
    drives
}

fn detect_drive_type(path: &str) -> String {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(meta) = fs::metadata(path) {
            if meta.file_attributes() & 0x10 != 0 {
                return "Fixed".to_string();
            }
            if meta.file_attributes() & 0x100000 != 0 {
                return "Removable".to_string();
            }
        }
        if !path.is_empty() {
            return "Fixed".to_string();
        }
    }
    "Unknown".to_string()
}

pub fn read_text_file(path_str: &str) -> Result<String, FsError> {
    let path = Path::new(path_str);
    if !path.exists() {
        return Err(FsError::NotFound(path_str.to_string()));
    }
    if !path.is_file() {
        return Err(FsError::NotFound(format!("Not a file: {}", path_str)));
    }
    Ok(fs::read_to_string(path)?)
}

pub fn format_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    if bytes == 0 { return "0 B".to_string(); }
    let exp = (bytes as f64).log(1024.0).floor() as usize;
    let exp = exp.min(UNITS.len() - 1);
    let val = bytes as f64 / 1024u64.pow(exp as u32) as f64;
    format!("{:.1} {}", val, UNITS[exp])
}
