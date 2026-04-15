const http = require('http')
const { handle } = require('./src/middlewares')
const { sendJson, sendError } = require('./src/utils/response')

const server = http.createServer(async (req, res) => {
  console.log('>>> 收到请求：', req.method, req.url)
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
    console.log('>>> 开始调用 handle...');
    await handle(req, res)
    console.log('>>> handle 调用完成');
  } catch (err) {
    console.error('Unhandled error:', err)
    if (!res.headersSent) {
      sendError(res, 500, '服务器内部错误')
    }
  }
})

process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

server.listen(3000, () => {
  console.log('Server is running on port 3000')
})

