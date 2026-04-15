console.log('[ROUTER] 模块被加载');

const url = require('url')
const { sendError } = require('./utils/response')

//导入所有路由模块
const authRoutes = require('./routes/auth')
const classRoutes = require('./routes/classes')
const scoreRoutes = require('./routes/scores')
const noticeRoutes = require('./routes/notices')
const logRoutes = require('./routes/logs')
const testRoutes = require('./routes/test')

//合并路由表
const routes = {
  ...authRoutes,
  ...classRoutes,
  ...scoreRoutes,
  ...noticeRoutes,
  ...logRoutes,
  ...testRoutes,
}
console.log('[ROUTER] 所有路由键:', Object.keys(routes))

// 动态路由匹配函数
function matchRoute(routePath, actualPath) {
  const routeParts = routePath.split('/')
  const actualParts = actualPath.split('/')
  if (routeParts.length !== actualParts.length) return null

  const params = {}
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1)
      params[paramName] = actualParts[i]
    } else if (routeParts[i] !== actualParts[i]) {
      return null
    }
  }
  return params
}

async function routeRequest(req, res) {
  console.log('[ROUTER] routeRequest 被调用');
  console.log('进入 routeRequest，path:', req.url, 'method:', req.method);
  const parsedUrl = url.parse(req.url, true) // 解析URL，包括查询参数; true 表示query转为对象
  const path = parsedUrl.pathname // 获取路径
  const method = req.method // 获取请求方法

  // 1.先尝试精确匹配
  const exactKey = `${method} ${path}`
  console.log('[ROUTER] 精确匹配 key:', exactKey);
  if (routes[exactKey]) {
    console.log('[ROUTER] 精确匹配成功，调用处理函数')
    return await routes[exactKey](req, res, parsedUrl.query)
  }

  // 2.动态路由分配
  for (const routeKey in routes) {
    if (routeKey.startsWith(method)) {
      const routePath = routeKey.split(' ')[1] // 提取路径部分
      const params = matchRoute(routePath, path)
      if (params) {
        console.log('[ROUTER] 动态匹配成功，key:', routeKey, 'params:', params)
        return await routes[routeKey](req, res, params, parsedUrl.query)
      }
    }
  }

  // 3.如果所有路由都不匹配，返回404
  console.log('[ROUTER] 未匹配到任何路由，返回 404');
  sendError(res, 404, 'Not Found')
}

module.exports = routeRequest
