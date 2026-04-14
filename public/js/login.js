document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#loginForm')
  const loginBtn = document.querySelector('#loginBtn')
  const errorMsg = document.querySelector('#errorMsg')
  const usernameInput = document.querySelector('#username')
  const passwordInput = document.querySelector('#password')
  const rememberCheck = document.querySelector('#rememberMe')

  //自动填充测试账号（开发用）
  usernameInput.value = 'admin'
  passwordInput.value = '123456'

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const username = usernameInput.value
    const password = passwordInput.value

    if (!username || !password) {
      errorMsg.textContent = '用户名或密码不能为空'
      return
    }

    //按钮loading状态
    loginBtn.disabled = true
    loginBtn.textContent = '登录中...'
    errorMsg.textContent = ''

    try {
      const result = await login(username, password)

      if (result.error) {
        errorMsg.textContent = result.error
        return
      }

      //登录成功，存储信息
      const { token, user } = result
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      //跳转到首页
      window.location.href = '../index.html'
    } catch (err) {
      console.error('Login error:', err)
      errorMsg.textContent = '登录失败，请稍后重试'
    } finally {
      loginBtn.disabled = false
      loginBtn.textContent = '登录'
    }
  })
})