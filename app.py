# -*- coding: utf-8 -*-
"""润锋科技 - 企业官网
Flask 应用主入口
启动: python app.py  (默认 127.0.0.1:5000)
"""
import os
import json
import re
import shutil
import logging
from datetime import datetime
from flask import (
    Flask, render_template, request, redirect,
    url_for, flash, jsonify, send_from_directory
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MESSAGES_DIR = os.path.join(BASE_DIR, 'data', 'messages')
os.makedirs(MESSAGES_DIR, exist_ok=True)

app = Flask(__name__)
app.secret_key = 'runfengtech-dev-secret-2026'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 上传/表单 2MB

logging.basicConfig(level=logging.INFO)
log = logging.getLogger('runfeng')

# ---------------------------------------------------------------------------
# 站点配置（集中管理，方便修改）
# ---------------------------------------------------------------------------
SITE = {
    'name': '润锋科技',
    'full_name': '润锋科技有限公司',
    'slogan': '让技术落地，为业务赋能',
    'domain': 'homesmartlab.com',
    'phone': '177-6047-2101',
    'mobile': '177-6047-2101',
    'email': '262633158@qq.com',
    'address': '四川省南充市嘉陵区九州名苑5栋一楼 菜鸟驿站',
    'year': '2026',
}

# 业务线
SERVICES = [
    {
        'id': 'web',
        'icon': '🌐',
        'title': '网站开发',
        'desc': '从企业官网到 SaaS 平台，覆盖前端、后端、小程序、SEO 与性能优化。',
        'list': ['企业官网', '电商系统', 'SaaS 平台', '小程序开发', 'H5 活动页', 'SEO 优化'],
        'tech': ['React / Vue', 'Python / Node.js', 'MySQL / PostgreSQL', 'Redis', 'Nginx / Docker'],
    },
    {
        'id': 'windows',
        'icon': '🖥️',
        'title': 'Windows 软件',
        'desc': '桌面端业务系统、工具类软件、行业定制软件，C#/.NET 与 C++/Qt 双栈。',
        'list': ['行业定制软件', '桌面工具', '数据可视化', '内网办公系统', '插件开发', '自动化脚本'],
        'tech': ['C# / .NET 8', 'C++ / Qt', 'WPF / WinForms', 'Win32 API', 'MySQL / SQLite'],
    },
    {
        'id': 'app',
        'icon': '📱',
        'title': '手机 APP 开发',
        'desc': 'iOS / Android / 跨端应用，覆盖产品、UI、研发、上架全流程。',
        'list': ['原生 iOS / Android', 'Flutter / React Native', '小程序跨端', 'App 上架', '热更新', '用户增长'],
        'tech': ['Swift', 'Kotlin', 'Flutter', 'React Native', 'Firebase / 极光推送'],
    },
    {
        'id': 'ai',
        'icon': '🤖',
        'title': 'AI 部署',
        'desc': '大模型落地、RAG、智能体、推理服务与边缘计算，从 PoC 到生产环境。',
        'list': ['大模型私有化部署', 'RAG 知识库', 'AI 智能体', '推理服务优化', '边缘 AI', '模型微调'],
        'tech': ['PyTorch / vLLM', 'LangChain', 'Docker / K8s', 'GPU 集群', 'ONNX / TensorRT'],
    },
]

PROCESS = [
    {'step': 1, 'title': '需求调研', 'desc': '1 对 1 沟通，明确目标、预算与交付标准。'},
    {'step': 2, 'title': '方案设计', 'desc': '输出架构与原型，确认技术路线。'},
    {'step': 3, 'title': '开发实施', 'desc': '敏捷迭代，每周可交付、可演示。'},
    {'step': 4, 'title': '测试上线', 'desc': '全链路测试，灰度发布，平滑上线。'},
    {'step': 5, 'title': '运维保障', 'desc': '7×24 响应，持续迭代与性能优化。'},
]

CLIENTS = [
    {'name': '某连锁零售集团', 'domain': '零售', 'desc': '电商中台重构，GMV 提升 38%'},
    {'name': '某制造上市公司', 'domain': '制造', 'desc': 'MES 桌面端 + 移动端一体化'},
    {'name': '某新能源车企', 'domain': '汽车', 'desc': '内部 AI 知识库，研发效率提升 25%'},
    {'name': '某医疗机构', 'domain': '医疗', 'desc': 'AI 辅助诊断小程序，覆盖 3 家分院'},
]

# 技术博客（静态种子文章，SEO 长尾词覆盖）
BLOG_POSTS = [
    {
        'slug': 'website-cms-stack',
        'cat': '网站开发',
        'title': '企业官网 2026 技术选型：为什么我们推荐「Flask + Supabase + GitHub Pages」轻架构',
        'excerpt': '不是一定要堆 React + Node + AWS。大多数企业官网用「Flask 静态构建 + Supabase 做 CMS/留言 + GitHub Pages 托管」就能跑，成本近乎为零，改文案后台实时生效，还能加在线客服和深色模式。',
        'date': '2026-10-12',
        'iso': '2026-10-12',
        'read': 6,
        'html': (
            '<h2>先说结论</h2>'
            '<p>给「企业官网」选架构，目标只有三个：<strong>快、省、好维护</strong>。90% 的官网并不需要微服务、不需要 Kubernetes。真正值钱的是「后台能改内容、改完秒生效、访客体验顺」。</p>'
            '<h2>三件套为什么搭</h2>'
            '<ul>'
            '<li><strong>Flask 静态构建</strong>：把页面渲染成纯 HTML 推到 GitHub Pages，托管免费、全球 CDN 快，不用交服务器月费。</li>'
            '<li><strong>Supabase 做 CMS</strong>：一张 KV 表存文案、一张表存留言，前端直连 REST，后台改「标语」访客端实时刷新，不用重新部署。</li>'
            '<li><strong>RLS 行级安全</strong>：匿名可读可写留言，仅管理员邮箱可改网站设置，权限用 SQL 策略锁死，不靠应用层自觉。</li>'
            '</ul>'
            '<h2>踩过的坑</h2>'
            '<p>1）表单在静态托管下没有后端，别用 <code>method="post"</code>，交给前端 JS 直连 Supabase。<br>'
            '2）官网后台千万别套用官网的 header/footer，否则「管理界面」会冒出导航条和页脚，视觉很乱。<br>'
            '3）深色模式用 CSS 变量 + <code>prefers-color-scheme</code>，别写两套 HTML。</p>'
            '<h2>适合谁</h2>'
            '<p>中小官网、产品落地页、技术型公司对外形象站。要复杂业务逻辑的 SaaS，再上完整前后端不迟。</p>'
        ),
    },
    {
        'slug': 'windows-cs-qt-choice',
        'cat': 'Windows 软件',
        'title': 'C#/.NET 8 还是 C++/Qt？桌面端选型决策表（行业定制场景）',
        'excerpt': '「做内网办公系统 / MES 桌面端」时技术栈怎么选？用交付成本、团队、性能三张表一次讲清，并给出我们给客户做行业定制的默认推荐。',
        'date': '2026-10-11',
        'iso': '2026-10-11',
        'read': 7,
        'html': (
            '<h2>一句话结论</h2>'
            '<p>大多数「内网业务系统、桌面工具、数据可视化」选 <strong>C#/.NET 8 + WPF</strong>；涉及高性能渲染、插件热插拔、跨进程通信再上 <strong>C++/Qt</strong>。两者不是对立，常在同一产品里共存。</p>'
            '<h2>决策表</h2>'
            '<ul>'
            '<li><strong>团队</strong>：.NET 招聘池大、上手快；C++/Qt 工程师贵、培养周期长。</li>'
            '<li><strong>交付成本</strong>：同类管理后台 .NET 通常比 C++ 快 30–50%。</li>'
            '<li><strong>性能</strong>：常规 CRUD/报表 .NET 完全够；只有实时信号处理、工业控制才需要 C++。</li>'
            '<li><strong>插件化</strong>：C++ 动态库插件机制更成熟，适合要留扩展口的产品。</li>'
            '</ul>'
            '<h2>我们的默认</h2>'
            '<p>行业定制软件默认 C#/.NET 8 + WPF + SQLite/MySQL；客户点名 C++/Qt 或需要原生 Win32 性能时再切换，并在方案阶段写进合同。</p>'
        ),
    },
    {
        'slug': 'rag-knowledge-base',
        'cat': 'AI 部署',
        'title': 'RAG 知识库落地：从「能跑」到「可用」的关键 5 件事',
        'excerpt': '很多 RAG 项目死在「召回质量」。讲清分块策略、向量库选型、重排、评测闭环，以及私有化部署时数据不出机房怎么做。',
        'date': '2026-10-10',
        'iso': '2026-10-10',
        'read': 8,
        'html': (
            '<h2>「能跑」和「可用」的差距</h2>'
            '<p>一个 demo 级 RAG 十分钟就能搭，但生产环境要扛住：召回不准、答非所问、幻觉、引用不可追溯。差距全在工程细节。</p>'
            '<h2>关键 5 件</h2>'
            '<ul>'
            '<li><strong>分块</strong>：按语义切，别按 512 token 硬切；保留标题层级做上下文。</li>'
            '<li><strong>召回 + 重排</strong>：向量粗排 top-50，再用 cross-encoder 精排 top-5，效果提升肉眼可见。</li>'
            '<li><strong>向量库</strong>：中小规模用 pgvector 够（Supabase 就带），大规模再上专用引擎。</li>'
            '<li><strong>引用可追溯</strong>：每个回答挂回原文 chunk，可点、可审计。</li>'
            '<li><strong>评测闭环</strong>：建 200 条真实问答集，每次换模型/调分块都回归测 R@5。</li>'
            '</ul>'
            '<h2>私有化怎么做</h2>'
            '<p>PyTorch + vLLM 本地推理，模型与语料全在你机房，数据不出内网，满足金融/医疗合规。</p>'
        ),
    },
]

# 常见问题（FAQ 页 + 结构化数据用）
FAQS = [
    {'q': '一个企业官网项目大概多久能上线？',
     'a': '标准企业官网 2–4 周可交付上线：1 周需求与原型、2 周开发与联调、0.5 周测试与灰度发布。涉及 CMS、支付、多端同步的复杂项目周期相应延长，会在方案阶段给出明确节点表。'},
    {'q': '怎么报价？有没有预算区间参考？',
     'a': '按功能模块与人力投入报价，不做一口价。企业官网常见区间 3–15 万，桌面/APP 业务系统 8–50 万，AI 部署按算力与模型规模定制。我们会在 1 个工作日内给出分项报价单，无隐藏费用。'},
    {'q': '交付物包含哪些？源码和文档给不给？',
     'a': '100% 交付可运行源码、部署文档、接口文档、测试报告。代码支持你方技术团队直接接手，不做黑盒交付；关键模块附单元测试。'},
    {'q': '支持二次开发与技术交接吗？',
     'a': '支持。项目尾期提供 2 次 1 对 1 技术交接（代码走查 + 架构说明），并给 30 天免费答疑期，之后可选 SLA 长期陪跑。'},
    {'q': '上线后出问题谁负责？有 SLA 吗？',
     'a': '提供分级 SLA：常规缺陷 48h 内修复，线上故障 7×24 响应、4h 内出处理方案。SLA 违约按合同约定赔付。'},
    {'q': '用 C#/.NET 或 C++/Qt 的 Windows 项目能做吗？',
     'a': '可以做。团队 C#/.NET 8 与 C++/Qt 双栈，WPF/WinForms/Win32 API 均有商用交付案例，支持行业定制软件、内网办公系统、桌面工具。'},
    {'q': 'AI 大模型部署支持私有化吗？数据会不会泄露？',
     'a': '支持全私有化部署（本地 GPU 集群 / 边缘设备），数据不出你的机房。技术栈覆盖 PyTorch、vLLM、LangChain、RAG 知识库，从 PoC 到生产环境全程护航。'},
    {'q': '可以先做一个小模块试点吗？',
     'a': '可以。推荐以 2 周 PoC 起步：明确一个可演示的小闭环（如单个业务页面 / 一个接口 / 一个智能体），验证后再扩展，降低你的试错成本。'},
]

# ---------------------------------------------------------------------------
# 页面路由
# ---------------------------------------------------------------------------
def _load_cms():
    """读取本地 cms-overrides.json（若存在）覆盖默认内容。
    供本地开发（python app.py）用；GitHub Pages 静态构建时由前端 cms.js 直连 Supabase。
    """
    import json as _json
    p = os.path.join(BASE_DIR, 'cms-overrides.json')
    if not os.path.exists(p):
        return {}
    try:
        with open(p, 'r', encoding='utf-8') as f:
            return _json.load(f)
    except Exception:
        return {}


def _apply_cms(d):
    """把 CMS 覆盖数据合并到 SITE / SERVICES 等默认内容上（深合并）。"""
    if not d:
        return

    def deep(base, override):
        if not isinstance(override, dict):
            return base
        for k, v in override.items():
            if isinstance(v, dict) and isinstance(base.get(k), dict):
                base[k] = deep(base[k], v)
            elif v not in (None, ''):
                base[k] = v
        return base

    global SITE
    if 'general' in d:
        g = d['general']
        SITE = dict(SITE)
        keymap = {
            'site_name': 'name', 'full_name': 'full_name', 'slogan': 'slogan',
            'phone': 'phone', 'mobile': 'mobile', 'email': 'email', 'address': 'address',
        }
        for ck, sk in keymap.items():
            if g.get(ck):
                SITE[sk] = g[ck]

    for s in SERVICES:
        o = d.get('services', {}).get(s['id'])
        if o:
            if o.get('title'):
                s['title'] = o['title']
            if o.get('desc'):
                s['desc'] = o['desc']


_CMS = _load_cms()
_apply_cms(_CMS)

@app.route('/')
def index():
    return render_template('index.html', site=SITE, services=SERVICES,
                           process=PROCESS, clients=CLIENTS)

@app.route('/services')
def services():
    return render_template('services.html', site=SITE, services=SERVICES)

@app.route('/services/<sid>')
def service_detail(sid):
    svc = next((s for s in SERVICES if s['id'] == sid), None)
    if not svc:
        return redirect(url_for('services'))
    return render_template('service_detail.html', site=SITE, svc=svc)

@app.route('/admin')
def admin():
    return render_template('admin.html', site=SITE)

@app.route('/about')
def about():
    return render_template('about.html', site=SITE, process=PROCESS, clients=CLIENTS)

@app.route('/faq')
def faq():
    return render_template('faq.html', site=SITE, faqs=FAQS)

@app.route('/blog')
def blog():
    return render_template('blog.html', site=SITE, posts=BLOG_POSTS)

@app.route('/blog/<slug>')
def post(slug):
    for p in BLOG_POSTS:
        if p['slug'] == slug:
            return render_template('post.html', site=SITE, post=p)
    return redirect(url_for('blog'))

@app.route('/contact', methods=['GET', 'POST'])
def contact():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        service = request.form.get('service', '').strip()
        message = request.form.get('message', '').strip()

        errors = []
        if not name:
            errors.append('请填写您的称呼')
        if not phone and not email:
            errors.append('请至少填写一个联系方式（电话或邮箱）')
        if not message:
            errors.append('请描述您的需求')
        # 手机号：若填写，需为 11 位 1 开头（允许带横线的格式先去掉再判）
        if phone:
            phone_digits = re.sub(r'[\s\-]', '', phone)
            if not re.match(r'^1[3-9]\d{9}$', phone_digits):
                errors.append('手机号格式不正确（应为 11 位、1 开头）')
        if email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            errors.append('邮箱格式不正确')

        if errors:
            for e in errors:
                flash(e, 'error')
            return render_template('contact.html', site=SITE, services=SERVICES,
                                   form={k: request.form.get(k, '') for k in ('name','phone','email','service','message')})

        record = {
            'name': name, 'phone': phone, 'email': email,
            'service': service, 'message': message,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        }
        safe_name = re.sub(r'[^\w\-]', '_', name)[:20]
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}.json"
        with open(os.path.join(MESSAGES_DIR, filename), 'w', encoding='utf-8') as f:
            json.dump(record, f, ensure_ascii=False, indent=2)
        log.info('new contact: %s', record['name'])
        flash('提交成功！我们将在 1 个工作日内与您联系。', 'success')
        return redirect(url_for('contact'))

    return render_template('contact.html', site=SITE, services=SERVICES, form=None)

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': SITE['name'],
        'time': datetime.now().isoformat(),
        'services': [s['id'] for s in SERVICES],
    })

@app.route('/api/contact', methods=['POST'])
def api_contact():
    data = request.get_json(silent=True) or {}
    if not data.get('message'):
        return jsonify({'ok': False, 'error': 'message required'}), 400
    safe_name = re.sub(r'[^\w\-]', '_', data.get('name', 'anonymous'))[:20]
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_name}.json"
    record = dict(data, created_at=datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    with open(os.path.join(MESSAGES_DIR, filename), 'w', encoding='utf-8') as f:
        json.dump(record, f, ensure_ascii=False, indent=2)
    return jsonify({'ok': True})

@app.route('/sitemap.xml')
def sitemap():
    resp = send_from_directory(os.path.join(BASE_DIR, 'static'), 'sitemap.xml')
    resp.headers['Content-Type'] = 'application/xml'
    return resp

@app.route('/robots.txt')
def robots():
    resp = send_from_directory(os.path.join(BASE_DIR, 'static'), 'robots.txt')
    resp.headers['Content-Type'] = 'text/plain'
    return resp

# ---------------------------------------------------------------------------
# 错误处理
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html', site=SITE), 404

@app.errorhandler(500)
def server_error(e):
    log.exception('server error')
    return render_template('500.html', site=SITE), 500


# ---------------------------------------------------------------------------
# 静态构建模式（用于 GitHub Pages / 任意静态托管）
# 用法:  python build_static.py
# 效果:  生成 build/ 目录，包含所有预渲染 HTML，可直接上传到 GitHub Pages
# ---------------------------------------------------------------------------
def build_static():
    """把所有页面预渲染成与 URL 路径一致的静态 HTML，输出到 build/。

    目录结构示例:
        build/index.html          <- 访问 /
        build/services/index.html <- 访问 /services
        build/services/web/index.html <- 访问 /services/web
        build/about/index.html    <- 访问 /about
    """
    out_dir = os.path.join(BASE_DIR, 'build')
    if os.path.exists(out_dir):
        shutil.rmtree(out_dir)
    os.makedirs(out_dir, exist_ok=True)

    # URL -> 静态文件相对路径（保持 GitHub Pages 的 URL 与 Flask 一致）
    pages = [
        ('/', 'index.html'),
        ('/services', 'services/index.html'),
        ('/services/web', 'services/web/index.html'),
        ('/services/windows', 'services/windows/index.html'),
        ('/services/app', 'services/app/index.html'),
        ('/services/ai', 'services/ai/index.html'),
        ('/about', 'about/index.html'),
        ('/faq', 'faq/index.html'),
        ('/blog', 'blog/index.html'),
        ('/contact', 'contact/index.html'),
        ('/admin', 'admin/index.html'),
    ]
    # 博客详情子页（动态追加）
    for p in BLOG_POSTS:
        pages.append(('/blog/' + p['slug'], 'blog/' + p['slug'] + '/index.html'))
    # 博客详情子页
    for p in BLOG_POSTS:
        pages.append(('/blog/' + p['slug'], 'blog/' + p['slug'] + '/index.html'))

    # 构建路径前缀：
    #   绑自定义域名（homesmartlab.com）→ 空（路径从 / 开始）
    #   纯子路径（user.github.io/runfengtech/）→ /runfengtech
    # 由 workflow 里的 PAGES_PREFIX 环境变量控制，默认空（即按绑域名构建）
    prefix = os.environ.get('PAGES_PREFIX', '')

    with app.test_client() as c:
        for url, rel in pages:
            r = c.open(url)
            assert r.status_code == 200, f'page {url} returned {r.status_code}'
            html = r.data.decode('utf-8')
            if prefix:
                html = html.replace('href="/', f'href="{prefix}/')
                html = html.replace('src="/', f'src="{prefix}/')
            target = os.path.join(out_dir, rel)
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, 'w', encoding='utf-8') as f:
                f.write(html)
            log.info('built %s -> %s (prefix=%s)', url, rel, prefix or '-')

    # 404.html
    r = c.open('/__nonexistent__')
    with open(os.path.join(out_dir, '404.html'), 'w', encoding='utf-8') as f:
        f.write(r.data.decode('utf-8'))

    # 静态资源 -> build/static/
    for sub in ('css', 'js'):
        src = os.path.join(BASE_DIR, 'static', sub)
        dst = os.path.join(out_dir, 'static', sub)
        os.makedirs(dst, exist_ok=True)
        for fn in os.listdir(src):
            shutil.copy2(os.path.join(src, fn), os.path.join(dst, fn))
    # 复制 static/ 根目录下的所有静态文件（favicon/logo/robots/sitemap 等）
    static_root = os.path.join(BASE_DIR, 'static')
    static_dst = os.path.join(out_dir, 'static')
    os.makedirs(static_dst, exist_ok=True)
    for fn in os.listdir(static_root):
        p = os.path.join(static_root, fn)
        if os.path.isfile(p):
            shutil.copy2(p, os.path.join(static_dst, fn))
    # robots.txt / sitemap.xml 在 build 根目录（网站路由 /robots.txt 是根路径）
    for fn in ('robots.txt', 'sitemap.xml'):
        src = os.path.join(static_root, fn)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(out_dir, fn))
    log.info('static assets copied to build/static/')

    print(f'\nStatic build complete. Files in {out_dir}:')
    for root, _, files in os.walk(out_dir):
        level = root.replace(out_dir, '').count(os.sep)
        if level == 0:
            print('  build/')
        else:
            print('  ' * level + os.path.basename(root) + '/')
        for fn in sorted(files):
            print('  ' * (level + 1) + fn)


# GitHub Pages 模式下没有可运行的后端，/contact 的 POST 由前端 JS 直连 Supabase；
# 本地开发（python app.py 直接跑）时保留旧端点用于调试。
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        build_static()
    else:
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('DEBUG', '1') == '1'
        log.info('RunFeng Tech server starting on http://127.0.0.1:%s', port)
        app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
