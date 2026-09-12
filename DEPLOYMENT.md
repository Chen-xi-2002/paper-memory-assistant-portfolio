# 公开 Demo 部署说明

## 当前限制

`http://127.0.0.1:8765/` 只运行在你的电脑上，HR 无法访问。公开 Demo 必须部署到公网静态托管平台。

## 推荐方案：Netlify Drop

这是最快的方法，不需要写代码。

1. 打开 [Netlify Drop](https://app.netlify.com/drop)。
2. 把 `paper-memory-assistant` 文件夹拖入页面，或者上传 `paper-memory-assistant-public-demo.zip`。
3. 等待生成公开网址，例如：

```text
https://your-project-name.netlify.app/
```

4. 简历二维码和链接统一填写：

```text
https://your-project-name.netlify.app/demo.html
```

5. 使用无痕窗口打开该地址，确认自动演示可以进入步骤 1。

## Vercel 部署

1. 把项目上传到 GitHub。
2. 在 Vercel 中导入仓库。
3. Root Directory 选择 `paper-memory-assistant`。
4. Framework Preset 选择 `Other`。
5. Build Command 留空。
6. Output Directory 填写 `.`。
7. 部署后访问：

```text
https://your-project.vercel.app/demo.html
```

## GitHub Pages

1. 将 `paper-memory-assistant` 中的静态文件放到仓库根目录或 `docs/` 目录。
2. 在仓库 Settings → Pages 中选择部署分支和目录。
3. 地址格式为：

```text
https://username.github.io/repository/demo.html
```

## 公开 Demo 的数据策略

公开站点不会包含你本机浏览器中的 PDF、笔记和对话。项目已加入一份明确标注为“合成公开演示论文”的全文，用于保证 HR 在全新浏览器中也能完成五步演示。

本机运行时，自动演示会优先复制你实际导入的 L1 Prosody 论文；公开部署后，则使用合成论文作为全文回退，不会泄露本地私有资料。

不要把以下内容直接打包到公开站点：

- 未获授权传播的论文 PDF
- 你的真实读后笔记
- 浏览器导出的个人 JSON 数据
- 带个人信息、账号或 API Key 的配置

## 发布前检查

- [ ] `demo.html` 可以在无痕窗口打开
- [ ] `guided-demo.html?autoplay=1` 能自动完成五步
- [ ] 第 2 步能看到全文状态
- [ ] 第 3 步能保存演示笔记
- [ ] 第 4 步能返回目标论文
- [ ] 第 5 步能显示全文命中片段
- [ ] 在线接口不可用时仍保留搜索链接
- [ ] 页面没有暴露本地文件路径
- [ ] 二维码指向 `/demo.html`，不是 `127.0.0.1`

## 二维码建议

一个二维码即可，指向公开项目页：

```text
https://your-project.netlify.app/demo.html
```

进入后用户可以：

1. 点击“自动播放 Demo”
2. 查看产品说明书
3. 阅读 PRD
4. 查看用户流程与验证方案
