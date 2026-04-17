const noticeService = require('../services/noticeService')
const { sendJson, sendError } = require('../utils/response')
const db = require('../db')
const recordOperation = require('../utils/operationLogger')

//1.发布通知（班主任）
async function handleCreateNotice(req, res) {
  const user = req.user
  if (user.role !== 'teacher') {
    return sendError(res, 403, '只有班主任才能发布通知')
  }

  const { classId, title, content } = req.body
  if (!classId || !title || !content) {
    return sendError(res, 400, '班级、标题、内容不能为空')
  }

  try {
    //验证该教师是否是班级的班主任
    const [rows] = await db.execute(`
      SELECT 1 FROM class_teacher WHERE teacher_id = ? AND class_id = ?`,
      [user.userId, classId])
    if (rows.length === 0) {
      return sendError(res, 403, '您不是该班级的班主任')
    }

    const result = await noticeService.createNotice(user.userId, classId, title, content)
    await recordOperation(
      req.user,
      'CREATE_NOTICE',
      `发布通知 ${result.id}，班级 ${classId}，标题 ${title}`,
      'notice',
      result.id
    )
    sendJson(res, 201, { id: result.id, message: '通知发布成功' })
  } catch (err) {
    console.error('通知发布失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//2. 获取通知列表 （教务/班主任/学生）
async function handleGetNotices(req, res) {
  const user = req.user

  const filters = {
    classId: req.query.classId ? parseInt(req.query.classId) : null,
    isPublished: (req.query.isPublished === 'true') ? true : (req.query.isPublished === 'false' ? false : undefined),
    page: parseInt(req.query.page) || 1,
    pageSize: parseInt(req.query.pageSize) || 20
  };

  try {
    const [notices, total] = await Promise.all([
      noticeService.getNotices(filters, user),
      noticeService.getNoticesCount(filters, user)
    ])
    sendJson(res, 200, {
      data: notices,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      }
    })
  } catch (err) {
    console.error('获取通知列表失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//3. 编辑通知（班主任）
async function handleUpdateNotice(req, res) {
  const user = req.user
  if (user.role !== 'teacher') {
    return sendError(res, 403, '只有班主任才能编辑通知')
  }

  const noticeId = parseInt(req.routeParams.id)
  const { title, content } = req.body
  if (!title || !content) {
    return sendError(res, 400, '标题、内容不能为空')
  }
  try {
    const notice = await noticeService.getNoticeById(noticeId)
    if (!notice) {
      return sendError(res, 404, '通知不存在')
    }

    // 验证该教师是否是班级的班主任
    const [rows] = await db.execute(`
      SELECT 1 FROM class_teacher WHERE teacher_id = ? AND class_id = ?`,
      [user.userId, notice.classId])
    if (rows.length === 0) {
      return sendError(res, 403, '您不是该班级的班主任')
    }

    const success = await noticeService.updateNotice(noticeId, title, content)
    if (!success) {
      return sendError(res, 500, '更新通知失败')
    }
    await recordOperation(
      req.user,
      'UPDATE_NOTICE',
      `更新通知 ${noticeId}，标题 ${title}`,
      'notice',
      noticeId
    )
    sendJson(res, 200, { message: '通知更新成功' })
  } catch (err) {
    console.error('更新通知失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//4. 删除通知（班主任）
async function handleDeleteNotice(req, res) {
  const user = req.user
  if (user.role !== 'teacher') {
    return sendError(res, 403, '只有班主任才能删除通知')
  }

  const noticeId = parseInt(req.routeParams.id)

  try {
    const notice = await noticeService.getNoticeById(noticeId)
    if (!notice) {
      return sendError(res, 404, '通知不存在')
    }
    const [rows] = await db.execute(`
      SELECT 1 FROM class_teacher WHERE teacher_id = ? AND class_id = ?`,
      [user.userId, notice.classId])
    if (rows.length === 0) {
      return sendError(res, 403, '您没有权限删除该通知')
    }
    await noticeService.deleteNotice(noticeId)
    await recordOperation(
      req.user,
      'DELETE_NOTICE',
      `删除通知 ${noticeId}`,
      'notice',
      noticeId
    )
    sendJson(res, 200, { message: '通知删除成功' })
  } catch (err) {
    console.error('删除通知失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 5.标记已读（学生）
async function handleMarkRead(req, res) {
  const user = req.user
  if (user.role !== 'student') {
    return sendError(res, 403, '只有学生才能标记已读')
  }
  const noticeId = parseInt(req.routeParams.id)
  try {
    // 验证该通知是否属于学生所在班级
    const notice = await noticeService.getNoticeById(noticeId)
    if (!notice) return sendError(res, 404, '通知不存在')

    const [rows] = await db.execute(
      `SELECT 1 FROM class_student WHERE student_id = ? AND class_id = ?`,
      [user.userId, notice.class_id]
    )
    if (rows.length === 0) {
      return sendError(res, 403, '您没有权限访问该通知')
    }

    await noticeService.markAsRead(noticeId, user.userId)
    sendJson(res, 200, { message: '通知已标记为读' })
  } catch (err) {
    console.error('标记已读失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 6. 获取已读统计（班主任）
async function handleGetReadStatistics(req, res) {
  const user = req.user
  if (user.role !== 'teacher') {
    return sendError(res, 403, '只有班主任才能获取已读统计')
  }
  const noticeId = parseInt(req.routeParams.id)

  try {
    const notice = await noticeService.getNoticeById(noticeId)
    if (!notice) {
      return sendError(res, 404, '通知不存在')
    }

    //验证班主任身份
    const [rows] = await db.execute(`
      SELECT 1 FROM class_teacher WHERE teacher_id = ? AND class_id = ?`,
      [user.userId, notice.class_id])
    if (rows.length === 0) {
      return sendError(res, 403, '您不是该班级的班主任')
    }
    const stats = await noticeService.getReadStatistics(noticeId)
    sendJson(res, 200, stats)
  } catch (err) {
    console.error('获取已读统计失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'POST /api/notices': handleCreateNotice,
  'GET /api/notices': handleGetNotices,
  'PUT /api/notices/:id': handleUpdateNotice,
  'DELETE /api/notices/:id': handleDeleteNotice,
  'POST /api/notices/:id/read': handleMarkRead,
  'GET /api/notices/:id/read-status': handleGetReadStatistics,
}