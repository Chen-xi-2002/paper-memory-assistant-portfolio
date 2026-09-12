# 从零开始：GitHub 上传与 Vercel 永久部署

目标：把论文记忆与引用助手部署成一个 HR 可以直接打开的永久网址。

项目目录：

```text
/Users/chenxiping/Project/实习准备/paper-memory-assistant
```

推荐方式：GitHub Desktop + Vercel 网页版。全程不需要命令行。

## 第一部分：创建 GitHub 账号

1. 打开 [github.com](https://github.com/)。
2. 点击右上角 `Sign up`。
3. 使用邮箱注册并完成邮箱验证。
4. 记住你的 GitHub 用户名，例如 `chenxiping`。

如果已经有 GitHub 账号，直接登录并跳到第二部分。

## 第二部分：安装 GitHub Desktop

1. 打开 [GitHub Desktop](https://desktop.github.com/)。
2. 下载 macOS 版本。
3. 把 GitHub Desktop 拖进 Applications。
4. 打开 GitHub Desktop。
5. 点击 `Sign in to GitHub.com`。
6. 浏览器会打开 GitHub 授权页面，点击授权并返回 GitHub Desktop。

## 第三部分：把当前项目加入 GitHub Desktop

1. 打开 GitHub Desktop。
2. 顶部菜单选择 `File` → `Add Local Repository...`。
3. 点击 `Choose...`。
4. 选择：

```text
/Users/chenxiping/Project/实习准备/paper-memory-assistant
```

5. 点击 `Add Repository`。

当前目录已经初始化 Git，GitHub Desktop 应该能识别它。

如果提示 `This directory does not appear to be a Git repository`，点击 `create a repository here instead`，名称填写：

```text
paper-memory-assistant
```

不要勾选 `Initialize with README`，因为项目里已经有 README。

## 第四部分：提交当前项目

1. 左侧会显示大量 `Changes`，这是正常现象，表示这些文件是新文件。
2. 左下角 `Summary` 填写：

```text
Initial release: paper memory and citation assistant
```

3. 点击 `Commit to main`。
4. 如果 GitHub Desktop 提示需要填写姓名和邮箱：
   - Name：填写你的名字或 GitHub 用户名。
   - Email：填写注册 GitHub 时使用的邮箱。
5. 提交成功后，左侧的 Changes 应该变空。

## 第五部分：发布到 GitHub

1. 点击顶部 `Publish repository`。
2. Name 填写：

```text
paper-memory-assistant
```

3. Description 可以填写：

```text
A local-first paper memory, full-text search and citation evidence assistant.
```

4. `Keep this code private`：
   - 想让作品集公开可见：取消勾选。
   - 只想让 Vercel 访问：可以保持勾选。
5. 点击 `Publish Repository`。
6. 点击 `View on GitHub`，确认网页上能看到 `app.js`、`demo.html`、`guided-demo.html` 和 `docs/`。

## 第六部分：使用 Vercel 部署

1. 打开 [vercel.com](https://vercel.com/)。
2. 点击 `Sign Up` 或 `Log In`。
3. 选择 `Continue with GitHub`。
4. GitHub 会询问授权，选择允许 Vercel 读取仓库。
5. 进入 Vercel Dashboard。
6. 点击 `Add New...` → `Project`。
7. 在 `Import Git Repository` 中找到：

```text
paper-memory-assistant
```

8. 如果仓库没有显示：
   - 点击 `Adjust GitHub App Permissions`。
   - 在 GitHub 中允许 Vercel 访问这个仓库。
   - 返回 Vercel 刷新页面。

## 第七部分：Vercel 项目配置

保持配置尽量简单：

| 配置项 | 填写内容 |
| --- | --- |
| Project Name | `paper-memory-assistant` |
| Framework Preset | `Other` |
| Root Directory | `./` |
| Build Command | 留空 |
| Output Directory | 留空 |
| Install Command | 留空 |
| Environment Variables | 不添加 |

如果你的 GitHub 仓库根目录包含多个项目，才需要把 Root Directory 改成 `paper-memory-assistant`。

点击 `Deploy`，等待大约 30–90 秒。

## 第八部分：获得永久地址

部署完成后，Vercel 会显示：

```text
https://paper-memory-assistant-xxxx.vercel.app
```

打开这个地址，如果根页面没有自动进入 Demo，就手动访问：

```text
https://paper-memory-assistant-xxxx.vercel.app/demo.html
```

推荐把 `/demo.html` 作为简历链接和二维码地址，因为它包含：

- 慢速自动演示
- 自由体验 Demo
- 产品说明书
- PRD
- 用户流程
- 验证方案
- Demo 讲稿

## 第九部分：用无痕窗口验收

打开 Chrome 或 Safari 的无痕窗口，访问 Vercel 地址，检查：

- [ ] 页面能在不启动本地终端的情况下打开
- [ ] 点击“自动播放 Demo”能进入五步演示
- [ ] 第 2 步能看到 PDF 全文状态
- [ ] 第 3 步能保存演示笔记
- [ ] 第 4 步能返回目标论文
- [ ] 第 5 步能显示全文命中片段
- [ ] 产品说明书和 PRD 链接能打开
- [ ] 手机打开时右侧 Demo 画面显示在说明区上方

## 第十部分：生成最终简历二维码

部署成功后，最终链接格式是：

```text
https://paper-memory-assistant-xxxx.vercel.app/demo.html
```

二维码只使用这个地址，不要使用：

- `127.0.0.1`
- `file://`
- `trycloudflare.com`
- 本机局域网 IP

可以把最终 Vercel 地址发给我，我会生成正式二维码 PNG 和 SVG。

## 常见问题

### Vercel 部署后根页面打开的是普通应用

直接使用 `/demo.html`：

```text
https://你的项目.vercel.app/demo.html
```

### Vercel 提示找不到项目

检查 Vercel 的 `Root Directory`。如果 GitHub 仓库根目录就是 `paper-memory-assistant`，保持 `./`；如果仓库中还有一层 `paper-memory-assistant`，就填写这个目录名。

### 更新项目后 Vercel 没有变化

在 GitHub Desktop 中：

1. 修改文件后打开 GitHub Desktop。
2. 填写 Summary。
3. `Commit to main`。
4. 点击 `Push origin`。
5. Vercel 会检测新提交并自动重新部署。

### 想让链接更像自己的品牌

Vercel 项目设置中可以添加自定义域名。没有域名时，免费的 `vercel.app` 地址已经足够用于简历和面试。
