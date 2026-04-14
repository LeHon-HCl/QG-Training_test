const db = require('../db')
const { generateToken } = require('../utils/jwt')
const { verifyPassword } = require('../utils/password')
const { sendJson, sendError } = require('../utils/response')

async function loginHandler(req, res) {
  //解析请求体
  const { username, password } = req.body

  if (!username || !password) {
    return sendError(res, 400, '用户名或密码不能为空')
  }

  try {
    //参数化查询防止注入
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username])

    if (rows.length === 0) {
      return sendError(res, 401, '用户名或密码错误')
    }

    const user = rows[0]

    //校验密码
    if (!verifyPassword(password, user.password)) {
      return sendError(res, 401, '用户名或密码错误')
    }

    //生成 Token (payload 不放敏感信息)
    const token = generateToken({
      userId: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role,
    })

    //返回用户信息和 Token
    sendJson(res, 200, {
      user: {
        userId: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
      },
      token,
    })

    //记录日志
    logOperation(user.id, user.real_name, 'LOGIN', '用户登录', 'user', 'user.id')
  } catch (err) {
    console.error('Login error:', err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'POST /api/auth/login': loginHandler
}