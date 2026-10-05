# 福大失物招领（移动端 Web MVP）

福州大学软件工程结对作业——「校园失物招领」纯前端实现。
核心流程：**登录引导 → 发布信息 → 浏览/搜索 → 查看详情 → 联系发布者 → 更新状态 → 个人中心管理**。

## 功能简介

- **启动 / 登录引导**：首次打开展示启动页与登录页（学号格式校验 / 游客模式），记录本机登录态。
- **首页**：卡片式列表；校区切换（旗山 / 铜盘）；关键词搜索（名称、描述、地点、类别）；类型筛选（全部/寻物/招领）与类别筛选；空状态引导。
- **发布页**：寻物 / 招领；字段含类型、名称、类别（"其他"可自定义 1-10 字）、物品图片（选填，最多 3 张，本地压缩）、地点（支持按校区快捷选择）、时间、描述、联系方式、发布者昵称（自动带入个人中心昵称）；完整表单校验；发布成功跳转成功页。
- **发布成功页**：成功动画 + 信息摘要 +「返回首页 / 查看详情」。
- **详情页**：完整信息、图片画廊（点击全屏查看）、状态标签（寻物中/已找到、招领中/已归还）、复制联系方式、收藏、**举报**、发布者行可点击进入发布者主页。
- **举报（新）**：独立举报页，五种原因单选（虚假信息 / 冒领他人财物 / 内容违规 / 骚扰 / 其他）+ 补充说明（选填，填写需 ≥10 字）；记录存 localStorage；同一用户对同一帖子只能举报一次，详情页入口随之变为"已举报"。
- **发布者主页（新）**：`user-profile.html?name=昵称`；红色资料卡展示头像（昵称哈希生成的 emoji，全站一致）、累计发布数、找回率；一键复制该发布者联系方式；下方"TA的发布"复用公共卡片渲染。
- **编辑帖子（新）**：我的发布页每张卡片带"✏️ 编辑"按钮 → `publish.html?id=xxx` 进入编辑模式：标题变"修改信息"、表单预填原数据（含类别自定义与图片）、提交调用 `updateItem` 更新，成功后跳详情页并提示"修改成功"。
- **个人中心**：资料卡、统计、我的发布（编辑/标记完成/删除）、我的收藏、消息通知、设置（昵称/头像/清除数据）。
- **底部导航**：首页、发布（凸起按钮）、我的。

## 目录说明

```
lost-found/
├── splash.html / index.html     # 启动与首页（引导逻辑见 js/auth.js）
├── publish.html                 # 发布 / 编辑二合一（URL 带 id 即编辑模式）
├── success.html                 # 发布成功页
├── detail.html                  # 详情页（收藏 / 举报 / 发布者入口）
├── report.html                  # 举报页（新）
├── user-profile.html            # 发布者主页（新）
├── mine.html / favorites.html / messages.html / settings.html / profile.html
├── css/style.css                # 全局样式（红色主题，移动端优先 480px）
├── js/
│   ├── storage.js               # 数据层：信息 CRUD、updateItem、收藏、资料、举报、校区
│   ├── common.js                # 公共层：DOM/转义/Toast/卡片渲染/复制/hashAvatar
│   ├── auth.js                  # 启动页与登录引导
│   ├── index.js / publish.js / detail.js / mine.js
│   ├── report.js                # 举报逻辑（新）
│   ├── user-profile.js          # 发布者主页逻辑（新）
│   └── profile.js / favorites.js / messages.js / settings.js
├── img/                         # 内置资源
└── assets/
```

## 使用说明

1. 保持目录结构，双击 **`index.html`** 用 Google Chrome 打开（首次进入启动页 → 登录/游客）；
2. 也可用本地服务器：`python3 -m http.server 8000` 后访问 `http://localhost:8000/index.html`；
3. 纯原生 HTML + CSS + JS，无框架、无 npm、无外部 CDN，断网可用。

## 数据存储说明

所有数据保存在浏览器 **localStorage**，不上传服务器：

| key | 内容 |
|---|---|
| `lost_found_items_v2` | 全部失物招领信息（含 `campus`、`images` 字段） |
| `lost_found_mine_ids_v2` | 本机发布的信息 id 列表 |
| `lost_found_favorites_v2` | 收藏的信息 id 列表 |
| `lost_found_campus_v2` | 当前选中校区 |
| `lost_found_profile_v1` | 个人资料（昵称、头像） |
| `lost_found_reports_v1` | 举报记录 `{ 帖子id: { reason, detail, time } }`（新） |
| `lost_found_auth_v1` / `lost_found_first_open_v1` | 登录态 / 首开标记 |

- 信息数据模型：`id, type('lost'|'found'), title, category, campus, location, time, description, contact, publisher, images[], status('active'|'done'), createdAt`。
- `status=done` 时按类型显示「已找到」（寻物）/「已归还」（招领）。
- 恢复初始数据：设置页「清除全部数据」，或控制台执行 `localStorage.clear()` 后刷新。
