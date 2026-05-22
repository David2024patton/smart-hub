use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum HubError {
    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Path error: {0}")]
    Path(#[from] super::path_service::PathError),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Lint error: {0}")]
    Lint(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("FS error: {0}")]
    Fs(#[from] super::fs_service::FsError),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<HubError> for String {
    fn from(e: HubError) -> String {
        e.to_string()
    }
}

#[derive(Debug, Serialize)]
pub struct HubErrorResponse {
    pub code: String,
    pub message: String,
    pub field: Option<String>,
    pub details: Option<String>,
}

impl HubError {
    pub fn into_response(self) -> HubErrorResponse {
        let (code, field) = match &self {
            HubError::Validation(msg) => {
                let field = msg.split(':').next().map(|s| s.trim().to_string());
                ("VALIDATION_ERROR".into(), field)
            }
            HubError::NotFound(_) => ("NOT_FOUND".into(), None),
            HubError::Path(_) => ("PATH_ERROR".into(), None),
            HubError::Database(_) => ("DATABASE_ERROR".into(), None),
            HubError::Lint(_) => ("LINT_ERROR".into(), None),
            HubError::Io(_) => ("IO_ERROR".into(), None),
            HubError::Fs(_) => ("FS_ERROR".into(), None),
            HubError::Internal(_) => ("INTERNAL_ERROR".into(), None),
        };

        HubErrorResponse {
            code,
            message: self.to_string(),
            field,
            details: None,
        }
    }
}

pub type HubResult<T> = Result<T, HubError>;
