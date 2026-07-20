# retro-pomo

レトロOSウィンドウ風デザインのデスクトップ常駐ポモドーロタイマー(Tauri 2 + Vite + React 19 + TS)。
設計: `docs/specs/2026-07-20-retro-pomo-design.md` / 実装計画: `docs/plans/2026-07-20-retro-pomo.md` / 未着手課題: `TODO.md`

## コマンド

- 開発起動: `bun run tauri dev`(vite は 1420 固定。裏で `bun run dev` が起動するので単体 vite と併用しない)
- 検証: `bun run typecheck` + `bun test`(コード変更後は必ず両方 green にする)
- ビルド: `bun run tauri build` → `src-tauri/target/release/retro-pomo.exe` + `bundle/`(NSIS/MSI)

## 構成

- `src/timer/engine.ts` — タイムスタンプ基準の純粋タイマーロジック(テスト対象。UI 非依存。スリープ復帰の複数フェーズロールオーバー対応)
- `src/store/settings.ts` — localStorage 永続化 + sanitize(clamp: 分1-180 / scale 0.75-2。skin/lang/notify等)
- `src/skins/Skin{A,B,C,D}.tsx` — 4スキン。共通 props は `src/skins/types.ts` の `SkinProps`
- `src/window/scale.ts` — スキン別ウィンドウサイズ `BASE` と四隅グリップの等比リサイズ(`beginCornerResize`。ネイティブリサイズは `resizable: false` で無効)
- `src/window/menu.ts` — ネイティブ右クリックメニュー(スキン/リセット/最前面/設定/言語/最小化/終了。ja/en は `T` 辞書)
- `src/quit/ConfirmQuit.tsx` — 終了確認。App の `onCloseRequested` インターセプタが入口(タスクバーからの閉じるも捕捉)。確定終了は `destroy()`
- `src/notify/notify.ts` — オプトインの Windows 通知(tauri-plugin-notification。設定 NOTIFY、デフォルト OFF)
- `src/audio/chime.ts` — WebAudio 合成チャイム(音源ファイルなし)
- `src/promo/` — 宣伝画像生成ビュー(アプリ本体からは promoMode 時のみ)

## 重要な制約

- **`scale.ts` の `BASE` と各 `skinX.css` のルート要素 width/height は必ず一致させる**(ズレると透過余白や見切れが出る)。設定/終了確認ビューは `SETTINGS_SIZE` / `CONFIRM_SIZE`
- デザイントークン(色/フォント)は `src/styles.css` の CSS 変数のみ使う。影はべた塗りオフセット、ぼかし禁止。絵文字不使用(モチーフは CSS 描画)
- コピー文言は固定: B作業中 `DON'T THINK OF` 改行 `OTHER THINGS` / B休憩中 `TEA TIME!` / C作業中 `Focus is Loading_` / C休憩中 `TEA TIME_` / C停止中 `Click for Focus_`(Cのカーソル `_` は動作中のみ点滅)
- Windows 通知は**オプトイン**(既定OFF)。フェーズ切替の既定はチャイム音のみ
- Tauri API 呼び出しは `inTauri` ガード必須(ブラウザでの見た目確認を壊さない)
- 権限追加時は `src-tauri/capabilities/default.json` に明示
- アプリアイコン変更: スマイリーPNG(1024px透過)→ `bun run tauri icon <png>`

## ブラウザでの見た目確認

`bun run dev` → `http://localhost:1420/` に URL パラメータ(Tauri 外ではウィンドウ操作系は自動スキップ):
- `?skin=A|B|C|D` スキン / `?view=settings` 設定 / `?view=confirm` 終了確認
- `?promo=1`(縦長)/ `?promo=x`(X用16:9)/ `?promo=45`(4:5)— 宣伝画像用グリッド。headless Chrome の `--screenshot` で `docs/promo/` に出力(サイズは `.promo` の実寸を測って `--window-size` に渡す)

## リリース手順

1. バージョン更新(3ファイル一括): `src-tauri/tauri.conf.json` / `package.json` / `src-tauri/Cargo.toml`
2. `bun run typecheck` + `bun test` + `bun run tauri build`
3. `gh release create vX.Y.Z --title ... --notes ... <nsis> <msi>`(GitHub: nitda-lab/retro-pomo・非公開)
4. リリース本文の画像は `https://raw.githubusercontent.com/nitda-lab/retro-pomo/main/docs/promo/retro-pomo-skins.png` を `<img width="620">` で参照(非公開リポジトリでも認証済み閲覧者には描画される)
