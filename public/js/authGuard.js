function isAuthenticated() {
  const token = localStorage.getItem('token')
  if (!token) return false

  //简单判断是否过期（解析 payload 中的 exp 字段）
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp > Date.now()
  } catch (e) {
    return false
  }
}

function requireAuth() {
  if (!isAuthenticated()) {
    sessionStorage.setItem('redirect', window.location.hash)
    window.location.hash = '#/login'
    return false
  }
  return true
}

//在主应用初始化时调用
function initAuthGuard() {
  //监听 hash 变化
  window.addEventListener('hashchange', () => {
    const publicRoutes = ['#/login', '#/register']
    if (!publicRoutes.includes(window.location.hash) && !isAuthenticated()) {
      window.location.hash = '#/login'
    }
  })

  //初始检查
  if (!window.location.hash || window.location.hash === '#/') {
    if (isAuthenticated()) {
      window.location.hash = '#/dashboard'
    } else {
      window.location.hash = '#/login'
    }
  }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.hash = '#/login'
}