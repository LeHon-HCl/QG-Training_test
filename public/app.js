(function () {
  const user = getUser()
  if (!user) {
    window.location.href = './login.html'
    return
  }

  // 定义默认路由映射
  const defaultRouteMap = {
    admin: 'classes',
    teacher: 'scores',
    student: 'notices'
  };
  const defaultRoute = defaultRouteMap[user.role] || 'classes';

  // 如果当前无 hash 或为根路径，跳转到默认路由
  if (!window.location.hash || window.location.hash === '#') {
    window.location.hash = defaultRoute;
  }

  // 显示用户信息
  document.querySelector('#userInfo').textContent = `${user.realName} (${user.role === 'admin' ? '教务主任' : user.role === 'teacher' ? '班主任' : '学生'})`

  // 生成导航菜单
  const navMenu = document.querySelector('#navMenu')
  const menuItems = []
  for (const [key, config] of Object.entries(routes)) {
    if (config.roles.includes(user.role)) {
      menuItems.push(`
          <a href="#${key}" class="nav-item" data-route="${key}">
            <span>${config.title}</span>
          </a>
        `)
    }
  }
  navMenu.innerHTML = menuItems.join('')

  // 退出登录
  document.querySelector('#logoutBtn').addEventListener('click', () => {
    localStorage.clear()
    window.location.href = './login.html'
  })

  // 注册视图渲染器
  window.viewRenderers = {
    classes: window.renderClassesView || (() => '<div class="error-page">班级视图未加载</div>'),
    scores: window.renderScoresView || (() => '<div class="error-page">成绩视图未加载</div>'),
    notices: window.renderNoticesView || (() => '<div class="error-page">通知视图未加载</div>'),
    logs: window.renderLogsView || (() => '<div class="error-page">日志视图未加载</div>')
  }

  // 初始化路由
  if (typeof handleRoute === 'function') {
    handleRoute()
  }
})();