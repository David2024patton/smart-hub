use serde::Serialize;
use sysinfo::{System, Disks};

#[derive(Debug, Serialize)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub cpu_brand: String,
    pub cpu_cores: usize,
    pub memory_total_gb: f64,
    pub memory_used_gb: f64,
    pub hostname: String,
    pub kernel_version: String,
}

#[derive(Debug, Serialize)]
pub struct DiskUsage {
    pub mount_point: String,
    pub total_gb: f64,
    pub available_gb: f64,
    pub filesystem: String,
}

pub fn gather_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemInfo {
        os_name: System::name().unwrap_or_default(),
        os_version: System::os_version().unwrap_or_default(),
        cpu_brand: sys.global_cpu_info().brand().to_string(),
        cpu_cores: sys.physical_core_count().unwrap_or(0),
        memory_total_gb: sys.total_memory() as f64 / 1024.0 / 1024.0,
        memory_used_gb: sys.used_memory() as f64 / 1024.0 / 1024.0,
        hostname: System::host_name().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
    }
}

pub fn gather_disk_usage() -> Vec<DiskUsage> {
    let disks = Disks::new_with_refreshed_list();
    disks.iter().map(|disk| {
        DiskUsage {
            mount_point: disk.mount_point().to_string_lossy().to_string(),
            total_gb: disk.total_space() as f64 / 1024.0 / 1024.0 / 1024.0,
            available_gb: disk.available_space() as f64 / 1024.0 / 1024.0 / 1024.0,
            filesystem: disk.file_system()
                .map(|fs| String::from_utf8_lossy(fs).to_string())
                .unwrap_or_default(),
        }
    }).collect()
}
