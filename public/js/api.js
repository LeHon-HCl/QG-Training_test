const API_BASE = 'http://localhost:3000/api'

async function request(url, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(API_BASE + url, {
    ...options,
    headers,
  })

  //处理401 自动跳转登录 （在登录页不跳转）
  if (response.status === 401 && !window.location.pathname.includes('login')) {
    localStorage.removeItem('token')
    localStorage.removeItem('remember')
    window.location.href = '/login.html'
  }

  return response.json()
}

//登录专用函数
async function login(username, password) {
  return request('login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}