fn main() {
    let manifest_dir = env!("CARGO_MANIFEST_DIR");
    println!("cargo:rustc-env=OUT_DIR={}/target", manifest_dir);
    println!("cargo:rustc-env=TAURI_CONFIG_DIR={}", manifest_dir);
    tauri_build::build()
}
