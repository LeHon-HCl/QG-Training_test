function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  //跨域头可全局统一设置
  res.end(JSON.stringify(data))  //返回JSON字符串
}

function sendError(res, statusCode, message) {
  sendResponse(res, statusCode, { error: message })
}

module.exports = {
  sendResponse,
  sendError
}