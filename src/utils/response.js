function sendJson(res, statusCode, data) {
  console.log('[RESPONSE] 发送响应，状态码:', statusCode);
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  //跨域头可全局统一设置
  res.end(JSON.stringify(data))  //返回JSON字符串
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message })
}

module.exports = {
  sendJson,
  sendError
}