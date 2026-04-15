const { sendError } = require('../utils/response')
const { parseBody } = require('../utils/parseBody.js')

async function bodyParser(req, res, next) {
  // console.log('[BODY-PARSER] 进入，method:', req.method)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      console.log('[BODY-PARSER] 开始解析 body...');
      req.body = await parseBody(req)
      console.log('[BODY-PARSER] body 解析完成:', req.body);
    } catch (e) {
      console.error('[BODY-PARSER] 解析失败:', e);
      return sendError(res, 400, '请求体解析错误')
    }
  }
  console.log('[BODY-PARSER] 调用 next()');
  next()
}

module.exports = bodyParser