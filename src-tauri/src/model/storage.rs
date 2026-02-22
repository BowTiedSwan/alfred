use std::{fs, path::PathBuf};

use anyhow::Result;

use crate::settings::config::app_support_dir;

pub fn models_dir() -> Result<PathBuf> {
    Ok(app_support_dir()?.join("models"))
}

pub fn ensure_models_dir() -> Result<PathBuf> {
    let dir = models_dir()?;
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn model_file_path(model_name: &str) -> Result<PathBuf> {
    Ok(ensure_models_dir()?.join(model_name))
}

pub fn is_model_downloaded(model_name: &str) -> Result<bool> {
    Ok(model_file_path(model_name)?.exists())
}
