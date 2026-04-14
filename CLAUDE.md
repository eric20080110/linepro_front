在變更開始前請先 `git add .`
每次完成任何功能或修正後，必須在本文件末尾的「更新紀錄」區塊補上一筆記錄。
修改完後都要push上github

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
        ChatWindow.jsx             ← 主聊天視窗（100dvh + 捲動鎖定 + 釘選/回覆預覽）
        MessageBubble.jsx          ← 訊息氣泡（回覆、表情回應、收回、釘選）
        DMInfoPanel.jsx            ← 好友資訊（媒體、連結、搜尋歷史）
        ImagePreviewModal.jsx      ← 圖片/影片全螢幕預覽
        CallModal.jsx              ← 語音/視訊通話介面 (WebRTC)
      Common/
        Avatar.jsx                 ← 支援 avatarUrl + 點擊更換
        Icon.jsx                   ← 自訂圖示系統（自動 fallback 至 Emoji）
        PullToRefresh.jsx          ← 手機版下拉重新整理
      Friends/
        FriendList.jsx
        AddFriendModal.jsx
      Groups/
        GroupList.jsx
        CreateGroupModal.jsx
        GroupInfoPanel.jsx         ← 群組管理（踢人、設管理員、媒體、搜尋、連結）
      Settings/SettingsPanel.jsx   ← 主題切換 + 刪除聊天室
            Sidebar/
              Sidebar.jsx                ← 手機用 position:fixed + translateX 滑動
              ChatList.jsx
              ProfilePanel.jsx           ← 暱稱 / 狀態訊息 / 大頭貼編輯
          hooks/
            useSocket.js                 ← Socket.io 連線管理 + 系統通知
            useIsMobile.js               ← 手機斷點（window.innerWidth < 768，resize 監聽）
          store/useStore.js              ← Zustand 全域狀態（支援訊息預抓與跳轉）
          theme/
            themes.js                    ← 5 個主題：purple / bw / dark / warm / blue
            ThemeContext.jsx
          index.css                      ← body position:fixed 防止 iOS bounce scroll
          App.jsx                        ← Clerk Provider + useSocket + syncUser
      
        server/                          ← 後端 (Node.js + Express + Socket.io)
          config/db.js                   ← Turso LibSQL 客戶端（含資料表遷移邏輯）
          middleware/auth.js             ← Clerk JWT 驗證 → req.userId / req.user
          routes/
            users.js                     ← sync / me / search / 暱稱
            friends.js                   ← 好友清單 / 申請 / 接受 / 拒絕 / 刪除
            groups.js                    ← 群組 CRUD + 成員管理 (踢人/授權)
            messages.js                  ← 訊息 CRUD + 已讀 + 釘選 / 回應 / 收回 / 回覆
            upload.js                    ← Cloudinary 簽名生成
          socket/
            handlers.js                  ← WebRTC 信令中繼 + 訊息同步 (Turso)
          roomHelpers.js                 ← 房間 ID 生成邏輯
          Dockerfile                     ← Node 20 Alpine，供 Render 部署
          .env                           ← 伺服器環境變數（不進 git）

  CLAUDE.md                        ← 本文件（Claude Code 讀取）
  GEMINI.md                        ← 指向本文件
```

## 資料庫 Schema（Turso / SQLite）

| 表格 | 重要欄位 |
|------|----------|
| `users` | `id`, `clerk_id`, `name`, `nickname`, `avatar_url`, `status`, `status_message` |
| `friendships` | `user1_id`, `user2_id` |
| `friend_requests` | `from_id`, `to_id` |
| `groups` | `id`, `name`, `description`, `avatar_url`, `created_by` |
| `group_members` | `group_id`, `user_id`, `is_admin` |
| `messages` | `id`, `type`, `sender_id`, `text`, `media_url`, `reply_to_id`, `is_pinned`, `is_recalled`, `timestamp` |
| `message_reactions` | `message_id`, `user_id`, `emoji` |
| `message_reads` | `message_id`, `user_id` |

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
- **全部使用 inline styles**，顏色與樣式需跟隨 `useTheme()` 與 `theme` context。
- 手機版條件判斷用 `useIsMobile()` hook。

### 手機版架構
- **Viewport 鎖定**：`index.css` 與 `App.jsx` 使用 `position: fixed` + `100dvh` 以防止 iOS Safari 橡皮筋回彈及捲動空白。
- **捲動容器**：使用 `minHeight: 0` 防止 Flex 子元素溢出，並用 `scrollTo` 取代 `scrollIntoView` 避免版面跳動。

### 訊息機制
- **預抓資料**：App 啟動後自動並行抓取所有聊天室的最新訊息（`fetchAllMessages`）。
- **訊息跳轉**：支援搜尋結果跳轉，實作「跳轉鎖定」防止自動滑回底部，並帶有高亮動畫。

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
| 2026-04-13 | 新增大頭貼、傳送照片/影片、語音/視訊通話（WebRTC + 信令修復） |
| 2026-04-13 | 新增暱稱功能、修復手機版版面跑位、新增語音訊息、下拉重新整理、自訂圖示系統 |
| 2026-04-13 | 群組管理（踢人/授權）、媒體與連結歷史、搜尋跳轉、訊息功能（回覆/回應/收回/釘選） |
| 2026-04-13 | 新增訊息系統通知、App 啟動自動預抓全站訊息優化效能 |
| 2026-04-14 | 修復收回訊息後短暫顯示再消失的問題：API 確認後重新套用 recall 狀態，防止 socket 事件競爭條件 |
| 2026-04-14 | 修復收回/釘選未寫入資料庫：SQL 雙引號改單引號、加 try-catch、改用 db.batch write mode 確保寫入 primary |
| 2026-04-14 | 通話功能重新設計：修復 ICE 時序競爭、callType 從 SDP 分離、接聽端改為 accept 時才建立 PC、localStream 改用 ref |
| 2026-04-14 | 修復通話無語音/視訊：video/audio 元素改為永遠掛載（CSS 隱藏），防止 ontrack 觸發時 ref 為 null；新增 remoteAudioRef 供語音通話使用；對方無開鏡頭時中間顯示頭像與姓名 |
| 2026-04-14 | 修復通話：ontrack 加 e.streams[0] fallback、applyRemoteStream 呼叫 .play() 防止 autoPlay 政策阻擋、清除 remoteAudioRef 防止 video call 雙重音訊；修復釘選：ChatWindow 補上 jumpToMessage 解構（原本 ReferenceError）、支援多個釘選訊息（數字徽章 + 展開/收起清單 + 各自查看跳轉） |
| 2026-04-14 | 修復視訊通話畫面裁切：remote video 改 objectFit:contain；監聽 video track mute/unmute 事件，對方關鏡頭時自動顯示頭像與姓名 |
