const routes = {
  'classes': { title: '班级管理', roles: ['admin'] },
  'scores': { title: '成绩管理', roles: ['admin', 'teacher', 'student'] },
  'notices': { title: '通知管理', roles: ['admin', 'teacher', 'student'] },
  'logs': { title: '日志管理', roles: ['admin', 'teacher'] }
}

let currentView = null

// 获取当前用户
function getUser() {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}

// 检查权限
function hasAccess(routeKey) {
  const user = getUser()
  if (!user) return false
  const route = routes[routeKey]
  return route && route.roles.includes(user.role)
}

// 渲染视图（由app.js实现具体渲染函数）
async function renderView(routeKey) {
  const container = document.querySelector('#viewContainer')
  if (!container) return

  if (!hasAccess(routeKey)) {
    container.innerHTML = '<div class="access-denied">您没有权限访问该页面</div>'
    return
  }

  // 显示骨架屏
  container.innerHTML = `<div class="skeleton-table"><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div></div>`

  try {
    const renderFn = window.viewRenderers[routeKey]
    if (typeof renderFn !== 'function') {
      throw new Error(`window.viewRenderers[${routeKey}] is not a function`)
    }
    const viewContent = await renderFn();
    container.innerHTML = viewContent;
  } catch (err) {
    container.innerHTML = `<div class="error-page">
      加载失败：${err.message}
      请联系管理员
    </div>
    `
  }
}

// 更新导航菜单高亮
function updateActiveNav(routeKey) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.route === routeKey)
  })
}

// 路由处理
function handleRoute() {
  const hash = window.location.hash.slice(1) || 'classes'
  const routeKey = hash.split('?')[0]
  if (!routes[routeKey]) {
    window.location.hash = 'classes'
    return
  }
  // 权限检查
  if (!hasAccess(routeKey)) {
    // 无权限时，跳转到该角色有权限的第一个路由
    const user = getUser();
    const accessibleRoute = Object.keys(routes).find(key => routes[key].roles.includes(user.role));
    if (accessibleRoute) {
      window.location.hash = accessibleRoute;
    } else {
      // 没有任何权限，退出登录
      localStorage.clear();
      window.location.href = 'login.html';
    }
    return;
  }
  updateActiveNav(routeKey)
  renderView(routeKey)
}

window.addEventListener('hashchange', handleRoute)
window.addEventListener('DOMContentLoaded', handleRoute)