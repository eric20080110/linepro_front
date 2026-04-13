在變更開始前請先 `git add .`
每次完成任何功能或修正後，必須在本文件末尾的「更新紀錄」區塊補上一筆記錄。

# LinePro — Claude Code 專案說明

## 專案結構

```
linepro/                          ← 前端 (React 19 + Vite)
  src/
    api/
      client.js                   ← fetch 包裝（自動帶 Clerk JWT）
      users.js / friends.js / groups.js / messages.js
    components/
      Auth/LoginPage.jsx           ← 已棄用（改用 Clerk SignIn）
      Chat/
        ChatWindow.jsx             ← 主聊天視窗（手機用 position:fixed + visualViewport）
        MessageBubble.jsx          ← 訊息氣泡（已讀指示器）
      Common/Avatar.jsx
      Friends/
        FriendList.jsx
        AddFriendModal.jsx
      Groups/
        GroupList.jsx
        CreateGroupModal.jsx
        GroupInfoPanel.jsx
      Settings/SettingsPanel.jsx   ← 主題切換 + 刪除聊天室
      Sidebar/
        Sidebar.jsx                ← 手機用 position:fixed + translateX 滑動
        ChatList.jsx
        ProfilePanel.jsx           ← 暱稱 / 狀態訊息編輯
    hooks/
      useSocket.js                 ← Socket.io 連線管理（socket 存入 Zustand）
      useIsMobile.js               ← 手機斷點（window.innerWidth < 768，resize 監聽）
    store/useStore.js              ← Zustand 全域狀態
    theme/
      themes.js                    ← 5 個主題：purple / bw / dark / warm / blue
      ThemeContext.js
    index.css                      ← body position:fixed 防止 iOS bounce scroll
    App.jsx                        ← Clerk Provider + useSocket + syncUser

  server/                          ← 後端 (Node.js + Express + Socket.io)
    config/db.js                   ← Turso LibSQL 客戶端 + initDB()（自動建表）+ rowToUser()
    middleware/auth.js             ← Clerk JWT 驗證 → req.userId / req.user
    routes/
      users.js                     ← sync / me / search
      friends.js                   ← 好友清單 / 申請 / 接受 / 拒絕 / 刪除
      groups.js                    ← 群組 CRUD + 成員管理
      messages.js                  ← DM / 群組訊息 + 已讀 + 刪除
    socket/
      handlers.js                  ← connect / disconnect + 狀態更新（用 Turso）
      roomHelpers.js               ← getDMRoomId / getGroupRoomId
    Dockerfile                     ← Node 20 Alpine，供 Render 部署
    .env                           ← 伺服器環境變數（不進 git）

  CLAUDE.md                        ← 本文件（Claude Code 讀取）
  GEMINI.md                        ← 指向本文件
```

## 資料庫 Schema（Turso / SQLite）

| 表格 | 重要欄位 |
|------|----------|
| `users` | `id` (UUID PK), `clerk_id`, `name`, `nickname`, `email`, `avatar_color`, `status`, `status_message` |
| `friendships` | `user1_id`, `user2_id`（排序後 UNIQUE，防重複） |
| `friend_requests` | `from_id`, `to_id` |
| `groups` | `id`, `name`, `description`, `avatar_color`, `created_by` |
| `group_members` | `group_id`, `user_id`, `is_admin` |
| `messages` | `id`, `type`(dm/group), `sender_id`, `receiver_id?`, `group_id?`, `text`, `timestamp` |
| `message_reads` | `message_id`, `user_id`（已讀記錄） |

## 開發指令

```bash
# 前端（linepro/ 根目錄）
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # 打包

# 後端（linepro/server/）
npm run dev          # node --watch → http://localhost:3001
npm start            # 生產模式
```

## 環境變數

### `server/.env`（不進 git）
```
PORT=3001
TURSO_DATABASE_URL=libsql://linepro-eric20080110.aws-ap-northeast-1.turso.io
TURSO_AUTH_TOKEN=<token>
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=https://linepro-front-zgh1.vercel.app/
```

### `.env.local`（前端，不進 git）
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://linepro-back.onrender.com
```

## 開發規範

### Styling
- **全部使用 inline styles**，不用 CSS 檔、Tailwind、CSS-in-JS
- 顏色一律從 `useTheme()` 取得，不要 hardcode
- 手機版條件判斷用 `useIsMobile()` hook

### 手機版架構
- **body**：`position: fixed` + `overflow: hidden`（防 iOS Safari bounce scroll 造成空白區域）
- **Sidebar**（手機）：`position: fixed, inset: 0`，`transform: translateX(-100%)` ↔ `translateX(0)` 切換
- **ChatWindow**（手機）：`position: fixed`，top/height 跟著 `window.visualViewport` 變化（鍵盤彈出時自動縮）
- **Modal/Panel**（手機）：`position: absolute`（非 fixed，避免 transform 父層造成定位錯誤），從底部滑上
- 桌面（≥ 768px）：標準 flex row 佈局，不受以上影響

### 狀態管理
- Zustand store：`src/store/useStore.js`
- Socket 存在 store 的 `socket` 欄位；`setActiveChat` 時自動 emit `join_dm` / `join_group`
- 身份鏈：Clerk JWT → `clerkId` → Turso `users.id`（UUID）；API 一律用 `_id`（對應 `users.id`）

### API 呼叫
- 透過 `src/api/client.js`（自動帶 Bearer token）
- 後端驗證：`requireAuth` middleware（`server/middleware/auth.js`）

### Socket.io 房間命名
- DM：`dm:<id_a>_<id_b>`（兩個 id 排序後拼接）
- 群組：`group:<groupId>`
- 個人通知：`user:<userId>`

## 部署

| 服務 | URL |
|------|-----|
| 前端 (Vercel) | https://linepro-front-zgh1.vercel.app |
| 後端 (Render, Docker) | https://linepro-back.onrender.com |
| 資料庫 (Turso) | linepro-eric20080110.aws-ap-northeast-1.turso.io |

### Git 推送

```bash
# 前端
git push origin main

# 後端（獨立 repo，在 server/ 目錄）
cd server && git push origin main
```

## 更新紀錄

| 日期 | 說明 |
|------|------|
| 2026-04-12 | 初始後端架構：MongoDB + Clerk + Socket.io |
| 2026-04-12 | 新增 5 種主題色、設定面板（主題切換 + 刪除聊天） |
| 2026-04-12 | 新增已讀功能（message_reads + messages_read socket 事件） |
| 2026-04-12 | 修正 CORS trailing slash bug |
| 2026-04-12 | 新增手機版（useIsMobile + sliding panel + 底部 modal） |
| 2026-04-13 | 新增 CLAUDE.md、GEMINI.md |
| 2026-04-13 | 資料庫從 MongoDB 遷移至 Turso（LibSQL/SQLite，無需 IP 白名單） |
| 2026-04-13 | 修正手機鍵盤遮擋：body position:fixed + visualViewport 追蹤 |
| 2026-04-12 | 新增大頭貼（Cloudinary 簽名上傳）、聊天傳照片、語音/視訊通話（WebRTC + Socket.io 信令） |
