use std::path::Path;
use std::process::Command;

#[derive(Debug, serde::Serialize)]
pub struct LintResult {
    pub file_path: String,
    pub language: String,
    pub issues: Vec<LintIssue>,
    pub error_count: usize,
    pub warning_count: usize,
    pub fixable_count: usize,
}

#[derive(Debug, serde::Serialize)]
pub struct LintIssue {
    pub line: usize,
    pub column: usize,
    pub severity: String,
    pub code: String,
    pub message: String,
    pub fixable: bool,
}

pub fn detect_language(file_path: &str) -> &str {
    let ext = Path::new(file_path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    match ext {
        "ts" | "tsx" => "typescript",
        "js" | "jsx" => "javascript",
        "css" | "scss" | "less" => "css",
        "json" => "json",
        "md" => "markdown",
        "rs" => "rust",
        "py" => "python",
        "mojo" | "🔥" => "mojo",
        _ => "unknown",
    }
}

pub fn run_tsc_lint(file_path: &str) -> LintResult {
    let language = detect_language(file_path).to_string();
    let mut issues = Vec::new();

    let output = Command::new("npx")
        .args(["tsc", "--noEmit", "--pretty", "false"])
        .output();

    match output {
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr);
            for line in stderr.lines() {
                if line.contains(file_path) || line.is_empty() {
                    continue;
                }
                if let Some(issue) = parse_tsc_line(line) {
                    issues.push(issue);
                }
            }
        }
        Err(e) => {
            issues.push(LintIssue {
                line: 0,
                column: 0,
                severity: "error".into(),
                code: "EXEC".into(),
                message: format!("Failed to run tsc: {}", e),
                fixable: false,
            });
        }
    }

    let error_count = issues.iter().filter(|i| i.severity == "error").count();
    let warning_count = issues.iter().filter(|i| i.severity == "warning").count();
    let fixable_count = issues.iter().filter(|i| i.fixable).count();

    LintResult {
        file_path: file_path.to_string(),
        language,
        issues,
        error_count,
        warning_count,
        fixable_count,
    }
}

fn parse_tsc_line(line: &str) -> Option<LintIssue> {
    let re = regex::Regex::new(
        r"^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$"
    ).ok()?;

    let caps = re.captures(line)?;

    Some(LintIssue {
        line: caps[2].parse().unwrap_or(0),
        column: caps[3].parse().unwrap_or(0),
        severity: caps[4].to_string(),
        code: caps[5].to_string(),
        message: caps[6].to_string(),
        fixable: false,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_language() {
        assert_eq!(detect_language("file.ts"), "typescript");
        assert_eq!(detect_language("file.tsx"), "typescript");
        assert_eq!(detect_language("file.rs"), "rust");
        assert_eq!(detect_language("file.md"), "markdown");
    }

    #[test]
    fn test_parse_tsc_line() {
        let line = "src/main.ts(42,10): error TS2322: Type 'X' is not assignable to type 'Y'.";
        let issue = parse_tsc_line(line).unwrap();
        assert_eq!(issue.line, 42);
        assert_eq!(issue.severity, "error");
        assert_eq!(issue.code, "TS2322");
    }
}
