const http = require('http')
const { handle } = require('./src/middlewares')
const { sendJson, sendError } = require('./src/utils/response')
const fs = require('fs')
const path = require('path')

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

  const parsedUrl = require('url').parse(req.url)
  const pathname = parsedUrl.pathname

  //静态资源处理分支（所有 GET 请求且路径不以/api/开头）
  if (req.method === "GET" && !pathname.startsWith("/api/")) {
    // 确认文件路径
    let filePath = path.join(__dirname, 'public', pathname)
    // 如果请求的是目录或根路径，默认返回index.html(SPA需要)
    if (pathname === '/' || pathname === '') {
      filePath = path.join(__dirname, 'public', 'index.html')
    } else if (!path.extname(filePath)) {
      // 没有扩展名，默认添加.html，由前端路由处理
      filePath += path.join(__dirname, 'public', 'index.html')
    }

    const extname = path.extname(filePath).toLowerCase()

    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon',
    }
    const contentType = mimeTypes[extname] || 'application/octet-stream'

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // 文件不存在，返回index.html(支持 SPA 前端路由)
          const indexPath = path.join(__dirname, 'public', 'index.html')
          fs.readFile(indexPath, (err2, indexData) => {
            if (err2) {
              res.writeHead(404)
              res.end('Not Found')
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(indexData)
            }
          })
        } else {
          res.writeHead(500)
          res.end('Server Error')
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType })
        res.end(data)
      }
    })
    return // 静态资源处理分支结束,不再继续处理后续中间件
  }

  try {
    console.log('>>> 解析后的 body:', req.body);
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

