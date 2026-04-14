const { verifyToken } = require('../utils/jwt')
const { sendError } = require('../utils/response')

//公开接口白名单
const PUBLIC_PATHS = [
  '/api/login',
  '/api/register',
  '/api/health'
]

function authMiddleware(req, res, next) {
  //解析路径
  const parsedUrl = require('url').parse(req.url)
  const path = parsedUrl.pathname

  //白名单放行
  if (PUBLIC_PATHS.includes(path)) {
    return next()
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startWith('Bearer')) {
    return sendError(res, 401, '未登录')
  }

  const token = authHeader.substring(7) // 去掉‘Bearer

  try {
    const payload = verifyToken(token)
    // 将用户信息挂载到req对象，供后续处理使用
    req.user = payload
    next()
  } catch (err) {
    if (err.message === 'Token expired') {
      return sendError(res, 401, '登录过期')
    }
    return sendError(res, 401, '登录过期或无效')
  }
}

const loginAttempts = new Map()

async function loginHandler(req, res) {
  const ip = req.socket.remoteAddress
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 }

  if (attempts.count >= 5 && Date.now() - attempts.lastAttempt < 900000) {
    return sendError(res, 403, '登录失败次数过多，请稍后重试')
  }

  //...验证用户名密码
  if (loginFailed) {
    attempts.count += 1
    attempts.lastAttempt = Date.now()
    loginAttempts.set(ip, attempts)
  } else {
    loginAttempts.delete(ip)
  }
}

module.exports = authMiddleware