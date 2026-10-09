# 润锋科技 官网

基于 **Flask** 的轻量企业官网。业务线：网站开发 / Windows 软件 / 手机 APP 开发 / AI 部署。

## 目录结构

```
runfengtech/
├── app.py                 # Flask 入口
├── requirements.txt
├── templates/             # Jinja2 模板（base + 各页面）
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   └── favicon.svg
└── data/
    └── messages/          # 联系表单提交的 JSON（本地落盘，不依赖数据库）
```

## 运行

```powershell
cd F:\www\www\runfengtech
pip install -r requirements.txt
python app.py
```

打开 <http://127.0.0.1:5000>。

- 改端口：`$env:PORT=8080; python app.py`
- 关闭热重载：`$env:DEBUG=0; python app.py`

## 路由

| 路径 | 说明 |
|---|---|
| `/` | 首页 |
| `/services` | 业务线列表 |
| `/services/<id>` | 单业务线详情（web / windows / app / ai） |
| `/about` | 关于我们 |
| `/contact` | 联系表单（GET）/ 提交（POST），提交存到 `data/messages/*.json` |
| `/api/health` | 健康检查 |
| `/api/contact` | JSON 提交接口 |

## 内容定制

站点信息、业务线、流程、客户案例都集中在 `app.py` 顶部的 `SITE` / `SERVICES` / `PROCESS` / `CLIENTS` 几个字典里，改完刷新即生效，不用动模板。
