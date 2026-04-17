const logService = require('../services/logService')
const { sendJson, sendError } = require('../utils/response')

async function handleGetLogs(req, res) {
  const user = req.user
  //学生无权查看日志
  if (user.role === 'student') {
    return sendError(res, 403, '无权限查看操作日志')
  }

  const filters = {
    operationType: req.query.operationType || null,
    operatorId: req.query.operatorId ? parseInt(req.query.operatorId) : null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
    targetType: req.query.targetType || null,
    targetId: req.query.targetId ? parseInt(req.query.targetId) : null,
  }

  const pagination = {
    page: req.query.page || 1,
    pageSize: req.query.pageSize || 20
  }

  try {
    const [logs, total] = await Promise.all([
      logService.getLogs(filters, pagination, user),
      logService.getLogsCount(filters, user)
    ])
    sendJson(res, 200, {
      data: logs,
      paginaion: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    })
  } catch (err) {
    console.error('查询日志失败：', err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'GET /api/logs': handleGetLogs
}