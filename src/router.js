const { act } = require("react")
const authRoutes = require('./routes/auth')

const routes = {
  // 按 'METHOD path'作为key
  'GET /api/classes': (req, res, query) => { },
  'POST /api/classes': (req, res, body) => { },
  'PUT /api/classes': (req, res, params, body) => { }
}

function routeRequest(req, res) {
  const parsedUrl = url.parse(req.url, true) // 解析URL，包括查询参数; true 表示query转为对象
  const path = parsedUrl.pathname // 获取路径
  const method = req.method // 获取请求方法

  // 1.先尝试精确匹配
  const key = `${method} ${path}`
  if (routes[key]) {
    return routes[key](req, res, parsedUrl.query)
  }

  // 2.动态路由分配
  for (const routeKey in routes) {
    if (routeKey.startsWith(method)) {
      const routePath = routeKey.split(' ')[1] // 提取路径部分
      const params = matchRoute(routePath, path)
      if (params) {
        return routes[routeKey](req, res, params, parsedUrl.query)
      }
    }
  }

  // 3.如果所有路由都不匹配，返回404
  sendError(res, 404, 'Not Found')
}

// 动态路由匹配函数
function matchRoute(routePath, actualPath) {
  const routeParts = routePath.split('/')
  const actualParts = actualPath.split('/')
  if (routeParts.length !== actualParts.length) {
    return null
  }

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