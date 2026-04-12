在變更開始前請先git add .
每次完成任何功能或修正後，必須在本文件和 CLAUDE.md 末尾的「更新紀錄」區塊補上一筆記錄。

# LinePro — GEMINI Code 專案說明

## 專案結構

```
linepro/                     ← 前端 (React + Vite)
  src/
    api/                     ← fetch 包裝（自動帶 Clerk JWT）
    components/              ← UI 元件（全部用 inline styles）
      Auth/                  ← 登入頁（Clerk SignIn）
      Chat/                  ← ChatWindow, MessageBubble
      Common/                ← Avatar
      Friends/               ← FriendList, AddFriendModal
      Groups/                ← GroupList, CreateGroupModal, GroupInfoPanel
      Settings/              ← SettingsPanel（主題 + 刪除聊天）
      Sidebar/               ← Sidebar, ChatList, ProfilePanel
    hooks/
      useSocket.js           ← Socket.io 連線管理
      useIsMobile.js         ← 手機斷點偵測（< 768px）
    store/useStore.js        ← Zustand 全域狀態
    theme/                   ← 5 個主題色 (purple/bw/dark/warm/blue)
  .env.local                 ← Vite 環境變數（不進 git）

  server/                    ← 後端 (Express + Socket.io)
    config/db.js             ← Mongoose 連線
    middleware/auth.js       ← Clerk JWT 驗證
    models/                  ← User, Friendship, FriendRequest, Group, Message
    routes/                  ← users, friends, groups, messages
    socket/handlers.js       ← Socket.io 事件
    .env                     ← 伺服器環境變數（不進 git）
```

## 開發指令

```bash
# 前端（在 linepro/ 根目錄）
npm run dev          # 啟動 Vite 開發伺服器（http://localhost:5173）
npm run build        # 打包到 dist/

# 後端（在 linepro/server/）
npm run dev          # 啟動後端（node --watch，http://localhost:3001）
npm start            # 生產模式
```

## 環境變數

### `server/.env`
```
PORT=3001
MONGODB_URI=mongodb+srv://...
CLERK_SECRET_KEY=sk_test_...
FRONTEND_URL=https://linepro-front-zgh1.vercel.app/
```

### `.env.local`（前端）
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=https://linepro-back.onrender.com
```

## 重要開發規範

### Styling
- **全部使用 inline styles**，不要用 CSS 檔案、Tailwind 或 CSS-in-JS
- 主題顏色從 `useTheme()` 取得，不要 hardcode 顏色
- 手機版用 `useIsMobile()` hook 做條件判斷

### 手機版規則
- 手機（< 768px）：Sidebar 和 ChatWindow 用 `position: absolute, inset: 0` 疊放，透過 `transform: translateX` 切換
- Modal/Panel 在手機時用 `position: absolute`（非 fixed），從底部滑上
- 不要用 CSS media query，改用 `useIsMobile()` 做 inline 條件判斷

### 狀態管理
- 所有狀態在 `src/store/useStore.js`（Zustand）
- Socket 儲存在 store（`socket` 欄位），join 事件在 `setActiveChat` 裡觸發
- Clerk JWT → `clerkId` → MongoDB `_id`，API 呼叫用 MongoDB `_id`

### API 呼叫
- 所有 API 呼叫透過 `src/api/client.js`（自動帶 Clerk JWT）
- 後端驗證用 `server/middleware/auth.js`（`requireAuth`）

### Socket.io 房間命名
- DM：`dm:<sorted_id1>_<sorted_id2>`
- 群組：`group:<groupId>`
- 個人通知：`user:<mongoId>`

## 部署

| 服務 | URL |
|------|-----|
| 前端 (Vercel) | https://linepro-front-zgh1.vercel.app |
| 後端 (Render) | https://linepro-back.onrender.com |

### Git 倉庫
- 前端：`https://github.com/eric20080110/linepro_front`
- 後端：`https://github.com/eric20080110/linepro_back`（在 `server/` 目錄）

後端要單獨推：
```bash
cd server
git push origin main
```

## 更新紀錄

| 日期 | 說明 |
|------|------|
| 2026-04-12 | 初始後端架構：MongoDB + Clerk + Socket.io |
| 2026-04-12 | 新增 5 種主題色、設定面板（刪除聊天 + 主題切換） |
| 2026-04-12 | 新增已讀功能（readBy + messages_read socket 事件） |
| 2026-04-12 | 修正 CORS trailing slash bug |
| 2026-04-12 | 新增手機版（useIsMobile + sliding panel + 底部 modal） |
| 2026-04-13 | 新增 CLAUDE.md 和 GEMINI.md |
| 2026-04-13 | 修正手機鍵盤遮擋輸入框（visualViewport API） |
| 2026-04-13 | 資料庫從 MongoDB 遷移至 Turso（LibSQL/SQLite） |
