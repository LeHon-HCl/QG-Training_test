const db = require('../db')
const { generateToken } = require('../utils/jwt')
const { verifyPassword } = require('../utils/password')
const { sendJson, sendError } = require('../utils/response')
const { recordOperation } = require('../utils/operationLogger')

const loginAttempts = new Map()

async function loginHandler(req, res) {
  // console.log('[LOGIN] 进入 loginHandler, body:', req.body);
  //解析请求体
  const { username, password } = req.body
  const ip = req.socket.remoteAddress

  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }
  const lockDuration = 15 * 60 * 1000
  if (attempt.count >= 5 && Date.now() - attempt.lastAttempt < lockDuration) {
    return sendError(res, 403, '登录失败次数过多，请稍后重试')
  }
  // console.log('[LOGIN] 防爆破检查通过')

  if (!username || !password) {
    console.log('[LOGIN] 用户名或密码为空，返回 400')
    return sendError(res, 400, '用户名或密码不能为空')
  }

  try {
    //参数化查询防止注入
    console.log('[LOGIN] 开始查询数据库...')
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username])
    console.log('[LOGIN] 数据库查询完成，行数:', rows.length)

    // if (rows.length === 0 || !verifyPassword(password, rows[0].password)) {
    //   console.log('[LOGIN] 用户不存在，返回 401')
    //   const newCount = attempt.count + 1
    //   loginAttempts.set(ip, { count: newCount, lastAttempt: Date.now() })
    //   return sendError(res, 401, '用户名或密码错误')
    // }
    if (rows.length === 0) {
      console.log('[LOGIN] 用户不存在');
      return sendError(res, 401, '用户名或密码错误');
    }
    const us = rows[0];
    console.log('[LOGIN] 数据库中存储的哈希:', us.password);
    const pwdValid = verifyPassword(password, us.password);
    console.log('[LOGIN] 密码验证结果:', pwdValid);
    if (!pwdValid) {
      return sendError(res, 401, '用户名或密码错误');
    }

    //登录成功，重置尝试次数
    loginAttempts.delete(ip)
    const user = rows[0]
    // console.log('[LOGIN] 找到用户:', user.username, '密码哈希:', user.password);

    console.log('[LOGIN] 开始验证密码...');
    const isValid = verifyPassword(password, user.password);
    console.log('[LOGIN] 密码验证结果:', isValid);

    if (!isValid) {
      console.log('[LOGIN] 密码错误，返回 401');
      // 增加失败计数...
      return sendError(res, 401, '用户名或密码错误');
    }

    // 登录成功...
    console.log('[LOGIN] 密码正确，生成 token...')

    //生成 Token (payload 不放敏感信息)
    const token = generateToken({
      userId: user.id,
      username: user.username,
      realName: user.real_name,
      role: user.role,
    })
    console.log('[LOGIN] token 生成成功');

    await recordOperation(
      { userId: user.id, realName: user.real_name },
      'LOGIN',
      `用户 ${user.username} 登录系统`,
      'user',
      user.id
    )

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
    console.log('[LOGIN] 响应已发送');

    //记录日志
    // logOperation(user.id, user.real_name, 'LOGIN', '用户登录', 'user', 'user.id')
  } catch (err) {
    console.error('Login error:', err)
    sendError(res, 500, '服务器错误')
  }
}

// console.log('[AUTH] 导出的路由键:', Object.keys(module.exports))
module.exports = {
  'POST /api/login': loginHandler
}
// console.log('[AUTH] 实际导出对象:', module.exports)