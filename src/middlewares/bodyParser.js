async function bodyParser(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      req.body = await parseBody(req)
    } catch (e) {
      return sendError(res, 400, '请求体解析错误')
    }
  }
  next()
}