

function authMiddleware(req, res, next) {
  const publicPaths = ['/api/login']
  if (publicPaths.includes(req.url)) {
    return next()
  }
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return sendError(res, 401, '未登录')
  }
  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyJWT(token) // 验证JWT
    req.user = payload
    next()
  } catch (error) {
    return sendError(res, 401, '登录过期或无效')
  }
}
