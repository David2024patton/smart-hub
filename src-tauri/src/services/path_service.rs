use std::path::{Path, PathBuf, Component};
use std::env;

#[derive(Debug, thiserror::Error)]
pub enum PathError {
    #[error("Path does not exist: {0}")]
    NotFound(String),
    #[error("Permission denied accessing: {0}")]
    PermissionDenied(String),
    #[error("Failed to canonicalize path: {0}")]
    CanonicalizationError(String),
}

#[derive(Debug, serde::Serialize)]
pub struct CanonicalizedPath {
    pub original: String,
    pub absolute: String,
    pub normalized: String,
    pub exists: bool,
    pub is_file: bool,
    pub is_dir: bool,
    pub components: Vec<String>,
}

pub fn canonicalize_path(input: &str) -> Result<CanonicalizedPath, PathError> {
    let path = Path::new(input);

    let absolute = if path.is_relative() {
        let cwd = env::current_dir()
            .map_err(|e| PathError::CanonicalizationError(e.to_string()))?;
        cwd.join(path)
    } else {
        path.to_path_buf()
    };

    let normalized = normalize_path(&absolute);

    let exists = normalized.exists();
    let is_file = exists && normalized.is_file();
    let is_dir = exists && normalized.is_dir();

    let components: Vec<String> = normalized
        .components()
        .map(|c| c.as_os_str().to_string_lossy().to_string())
        .collect();

    Ok(CanonicalizedPath {
        original: input.to_string(),
        absolute: absolute.to_string_lossy().to_string(),
        normalized: normalized.to_string_lossy().to_string(),
        exists,
        is_file,
        is_dir,
        components,
    })
}

pub fn resolve_relative(base: &str, relative: &str) -> Result<String, PathError> {
    let base_path = Path::new(base);
    let resolved = base_path.join(relative);

    let normalized = normalize_path(&resolved);

    Ok(normalized.to_string_lossy().to_string())
}

pub fn substitute_base_dir(path: &str, base_dir: &str) -> String {
    path.replace("%BASE_DIR%", base_dir)
        .replace("${BASE_DIR}", base_dir)
        .replace("$BASE_DIR", base_dir)
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut components = Vec::new();

    for component in path.components() {
        match component {
            Component::ParentDir => {
                components.pop();
            }
            Component::Normal(_) | Component::RootDir(_) | Component::Prefix(_) => {
                components.push(component);
            }
            Component::CurDir => {}
        }
    }

    let mut result = PathBuf::new();
    for component in components {
        result.push(component.as_os_str());
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_simple() {
        let p = normalize_path(Path::new("/foo/bar/../baz"));
        assert_eq!(p.to_string_lossy(), "/foo/baz");
    }

    #[test]
    fn test_normalize_double_dot() {
        let p = normalize_path(Path::new("/foo/bar/../../baz"));
        assert_eq!(p.to_string_lossy(), "/baz");
    }

    #[test]
    fn test_substitute_base_dir() {
        let r = substitute_base_dir("%BASE_DIR%/src", "/home/user/project");
        assert_eq!(r, "/home/user/project/src");
    }

    #[test]
    fn test_resolve_relative() {
        let r = resolve_relative("/base", "sub/dir/file.txt").unwrap();
        assert_eq!(r, "/base/sub/dir/file.txt".to_string());
    }
}
