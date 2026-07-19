# TODO

- [ ] **多重起動の防止**: すでに起動している場合は新しいインスタンスを立ち上げず、既存ウィンドウをフォーカス(復元)する。Tauri 公式の `tauri-plugin-single-instance` を導入するのが定石(Rust側でプラグイン登録 → コールバックで既存ウィンドウを unminimize + setFocus)。
