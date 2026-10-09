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
    'icp': '沪ICP备2026000000号-1',
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

# ---------------------------------------------------------------------------
# 页面路由
# ---------------------------------------------------------------------------
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

@app.route('/about')
def about():
    return render_template('about.html', site=SITE, process=PROCESS, clients=CLIENTS)

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
        if re.match(r'^1[3-9]\d{9}$', phone) is None and phone:
            errors.append('手机号格式不正确')
        if '@' in email and len(email.split('@')[0]) < 1:
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
        ('/contact', 'contact/index.html'),
    ]

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
    for fn in ('favicon.svg', 'robots.txt', 'sitemap.xml'):
        p = os.path.join(BASE_DIR, 'static', fn)
        if os.path.exists(p):
            shutil.copy2(p, os.path.join(out_dir, 'static', fn))
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


# 静态表单端点（GitHub Pages 模式）—— 提交到配置的 API，或落本地
CONTACT_API = os.environ.get('CONTACT_API', 'http://127.0.0.1:5000/api/contact')

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'build':
        build_static()
    else:
        port = int(os.environ.get('PORT', 5000))
        debug = os.environ.get('DEBUG', '1') == '1'
        log.info('RunFeng Tech server starting on http://127.0.0.1:%s', port)
        app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
