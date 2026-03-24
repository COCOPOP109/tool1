# 绿电消费质量评价工具 - Vercel 部署说明

## 快速部署（推荐）

### 方式 A：GitHub + Vercel（永久免费）

**第 1 步：创建 GitHub 仓库**
1. 打开 https://github.com/new
2. 仓库名称填写：`gepc-eval-tool`
3. 选择 Private（私有）或 Public（公开）
4. 点击 "Create repository"

**第 2 步：上传代码到 GitHub**

在本地打开终端，运行（项目已准备好，直接复制执行）：

```bash
cd /workspace/gepc-eval-tool
git init
git add .
git commit -m "init: 绿电消费质量评价工具 v1.0"
git branch -M main
git remote add origin https://github.com/你的用户名/gepc-eval-tool.git
git push -u origin main
```

> ⚠️ 如果是首次使用 Git，系统会提示登录认证，按提示操作即可（浏览器弹出 GitHub 登录授权）。

**第 3 步：连接 Vercel**

1. 打开 https://vercel.com/new
2. 点击 "Import Git Repository"
3. 选择刚才创建的 `gepc-eval-tool` 仓库
4. Framework Preset 会自动识别为 Vite
5. 项目名称填写：`gepc-eval-tool`
6. 点击 "Deploy" → 等待约 30 秒完成！

部署成功后，Vercel 会给一个 `*.vercel.app` 的免费域名，你也可以绑定自己的域名。

---

### 方式 B：下载 ZIP 直接部署

1. 告诉我你的 **接收文件的邮箱**，我打包好文件发给你
2. 解压后把文件直接拖进 Vercel 的空项目即可部署

---

## 自定义域名（可选）

部署完成后在 Vercel 控制台：
1. 进入项目 → Settings → Domains
2. 填入你的域名（如 `gepc.yourcompany.com`）
3. 按提示在域名DNS中添加 Vercel 提供的 CNAME 记录

---

## 注意事项

- Vercel 免费版已包含 SSL（HTTPS）
- 无需购买服务器，完全免费
- 代码更新：推送到 GitHub 后，Vercel 会**自动重新部署**
