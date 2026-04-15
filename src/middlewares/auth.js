const { verifyToken } = require('../utils/jwt')
const { sendError } = require('../utils/response')

//公开接口白名单
const PUBLIC_PATHS = [
  '/api/login'
]

function authMiddleware(req, res, next) {
  //解析路径
  const parsedUrl = require('url').parse(req.url)
  const path = parsedUrl.pathname
  // console.log('[AUTH] 进入，path:', path)

  //白名单放行
  if (PUBLIC_PATHS.includes(path)) {
    // console.log('[AUTH] 白名单，放行')
    return next()
  }

  const authHeader = req.headers.authorization
  console.log('[AUTH] Authorization header:', authHeader)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // console.log('[AUTH] 无有效 Authorization 头')
    sendError(res, 401, '未登录')
    return
  }

  const token = authHeader.substring(7) // 去掉‘Bearer
  try {
    console.log('[AUTH] 开始验证 token...')
    const payload = verifyToken(token)
    // 将用户信息挂载到req对象，供后续处理使用
    console.log('[AUTH] token 验证成功，payload:', payload)
    req.user = payload
    next()
    // console.log('[AUTH] next() 已调用')
  } catch (err) {
    console.error('[AUTH] token 验证失败:', err.message)
    sendError(res, 401, err.message === 'Token expired' ? '登录已过期' : '无效的令牌')
    return
  }
}

module.exports = authMiddleware