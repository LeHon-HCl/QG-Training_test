const http = require('http')
const { compose } = require('./src/middlewares')
const { logger, bodyParser, authMiddleware, routeHandler } = require('./src/middlewares')
const { sendJson, sendError } = require('./src/utils/response')
const authMiddleware = require('./src/middlewares/auth')

const middlewares = [logger, bodyParser, authMiddleware, routeHandler]
const handle = compose(middlewares)

const server = http.createServer(async (req, res) => {
  //设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  try {
    await handle(req, res)
  } catch (err) {
    console.error(err)
    sendError(res, 500, '服务器错误')
  }
})

server.listen(3000, () => {
  console.log('Server is running on port 3000')
})