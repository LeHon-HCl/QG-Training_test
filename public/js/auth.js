document.querySelector('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  const username = document.querySelector('#username').value.trim()
  const password = document.querySelector('#password').value.trim()
  const errorDiv = document.querySelector('#errorMsg')
  const btn = document.querySelector('#loginBtn')

  btn.disabled = true
  btn.textContent = '登录中...'
  errorDiv.textContent = ''

  try {
    const result = await api.login(username, password)
    if (result.error) {
      throw new Error(result.error)
    }
    //存储token和用户信息
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    //登录成功，跳转到首页
    window.location.href = 'index.html'
  } catch (err) {
    errorDiv.textContent = err.message || '登录失败,请稍后重试'
    btn.disabled = false
    btn.textContent = '登录'
  }
})