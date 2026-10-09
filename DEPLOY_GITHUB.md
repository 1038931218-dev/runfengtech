# 润锋科技 官网 — GitHub 部署说明

这个仓库是一个 Flask 应用，**同时支持三种部署方式**，按你的需求选：

## 方式 A：纯静态上 GitHub Pages（推荐，最简单）

适合"前端展示 + 表单走独立 API"的场景。

### 步骤

1. 把整个 `runfengtech` 目录推到一个新 GitHub 仓库，比如：
   ```powershell
   cd F:\www\www\runfengtech
   git init
   git add .
   git commit -m "runfengtech: initial"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/runfengtech.git
   git push -u origin main
   ```

2. 在 GitHub 仓库里开启 Pages：
   - 仓库页 → **Settings** → **Pages** → **Build and deployment**
   - Source 选 **GitHub Actions**
   - 等 1–2 分钟，Actions 跑完，站点就会发到 `https://<你的用户名>.github.io/runfengtech/`

   仓库里的 `.github/workflows/deploy.yml` 会自动：
   - 安装依赖 → 跑 `python app.py build` 把所有页面预渲染成 HTML → 发布 `build/` 到 Pages

3. **表单**：Pages 是纯静态的，提交表单需要配一个后端 API。在 `app.py` 里改 `CONTACT_API`（默认 `http://127.0.0.1:5000/api/contact`），指向你部署的 API 服务即可（用方式 B 部署一个最小 API 即可，或直接接 Formspree/EmailJS 这类免后端服务）。

## 方式 B：把 Flask 后端部署到 Python 平台

适合"前后端一体、表单要落库"的场景。可选平台：

| 平台 | 特点 |
|---|---|
| **Vercel / Netlify** | 免费额度，`vercel.json`/`netlify.toml` 配置即可 |
| **PythonAnywhere** | Python 原生，1 免费 1 付费实例 |
| **Railway / Render** | 支持 Flask 一键部署 |
| **阿里云 / 腾讯云** | 国内机房，备案后访问快 |

### 通用步骤

1. 把整个仓库推到 GitHub。
2. 在目标平台创建应用，指向该仓库。
3. 构建命令：`pip install -r requirements.txt`
4. 启动命令：`python app.py`（或 `flask run --host=0.0.0.0`）
5. 环境变量：`PORT`（平台默认）、`DEBUG=0`（生产）

## 方式 C：自己一台 VPS

```bash
# 服务器上
sudo apt install python3-pip nginx
sudo pip3 install -r requirements.txt
sudo pip3 install waitress
waitress-serve --listen=:8080 app:app
# 前面套 Nginx 做反向代理 + HTTPS
```

## 本地开发

```powershell
cd F:\www\www\runfengtech
pip install -r requirements.txt
python app.py            # 开发模式，热重载，5000 端口
```

访问 <http://127.0.0.1:5000>。

## 常见问题

- **改了文案没生效**：Flask 开发模式会自动重载；生产模式要重启进程。
- **想换端口**：`$env:PORT = 8080; python app.py`
- **联系表单没收到**：查 `data/messages/*.json`（本地模式）；或检查 `CONTACT_API` 是否指向正确端点。
- **GitHub Pages 表单 404**：因为 Pages 没有后端，把 `CONTACT_API` 指到真实 API 服务。

## 仓库结构

```
runfengtech/
├── app.py                  # Flask 主程序 + 静态构建入口
├── requirements.txt        # 依赖：Flask
├── runtime.txt             # Python 版本（PythonAnywhere 用）
├── README.md
├── .gitignore
├── .github/workflows/deploy.yml   # GitHub Pages 构建流水线
├── templates/             # Jinja2 模板
├── static/                # CSS / JS / favicon / robots / sitemap
└── data/messages/         # 联系表单落盘（已 .gitignore 排除）
```
