# retro-pomo

レトロOSウィンドウ風デザインのデスクトップ常駐ポモドーロタイマー(Tauri 2 + Vite + React 19 + TS)。
設計: `docs/specs/2026-07-20-retro-pomo-design.md` / 実装計画: `docs/plans/2026-07-20-retro-pomo.md`

## コマンド

- 開発起動: `bun run tauri dev`(vite は 1420 固定。裏で `bun run dev` が起動するので単体 vite と併用しない)
- 検証: `bun run typecheck` + `bun test`(コード変更後は必ず両方 green にする)
- リリース: `bun run tauri build` → `src-tauri/target/release/retro-pomo.exe`

## 構成

- `src/timer/engine.ts` — タイムスタンプ基準の純粋タイマーロジック(テスト対象。UI 非依存)
- `src/store/settings.ts` — localStorage 永続化 + sanitize(clamp: 分1-180 / scale 0.75-2)
- `src/skins/Skin{A,B,C,D}.tsx` — 4スキン。共通 props は `src/skins/types.ts` の `SkinProps`
- `src/window/scale.ts` — スキン別ウィンドウサイズ `BASE` と四隅グリップの等比リサイズ(`beginCornerResize`。ネイティブリサイズは `resizable: false` で無効)
- `src/window/menu.ts` — ネイティブ右クリックメニュー(スキン/リセット/最前面/設定/最小化/終了)

## 重要な制約

- **`scale.ts` の `BASE` と各 `skinX.css` のルート要素 width/height は必ず一致させる**(ズレると透過余白や見切れが出る)
- デザイントークン(色/フォント)は `src/styles.css` の CSS 変数のみ使う。影はべた塗りオフセット、ぼかし禁止。絵文字不使用(モチーフは CSS 描画)
- コピー文言は固定: B作業中 `DON'T THINK OF OTHER THINGS` / B休憩中 `TEA TIME!` / C作業中 `Focus is Loading_` / C休憩中 `TEA TIME_`
- Windows 通知は出さない(フェーズ切替は WebAudio チャイムのみ)
- Tauri API 呼び出しは `inTauri` ガード必須(ブラウザでの見た目確認 `bun run dev` + `?skin=B` / `?view=settings` を壊さない)
- 権限追加時は `src-tauri/capabilities/default.json` に明示

## ブラウザでの見た目確認

`bun run dev` → `http://localhost:1420/?skin=A|B|C|D` / `?view=settings`(Tauri 外ではウィンドウ操作系は自動スキップ)
