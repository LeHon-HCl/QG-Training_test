const scoreService = require('../services/scoreService')
const { sendJson, sendError } = require('../utils/response')
const { validateScore, validateScoreUpdate } = require('../utils/validation')
const { exportToCSV } = require('../utils/export')
const db = require('../db')
const recordOperation = require('../utils/operationLogger')

async function handleAddScore(req, res) {
  console.log('进入 handleAddScore，user:', req.user);
  // 1.校验权限
  const user = req.user
  if (user.role === 'student') {
    return sendError(res, 403, '无权限')
  }

  // 2.获取并校验请求体数据
  const scoreData = req.body
  const error = validateScore(scoreData)
  if (error) {
    return sendError(res, 400, error)
  }

  //3.班主任只能添加自己班级的成绩（业务权限）
  if (user.role === 'teacher') {
    const [rows] = await db.execute(
      `SELECT cs.class_id
      FROM class_student cs
      JOIN class_teacher ct ON cs.class_id = ct.class_id
      WHERE ct.teacher_id = ? AND cs.student_id = ?`,
      [user.userId, scoreData.studentId]
    )
    if (rows.length === 0) {
      return sendError(res, 403, '您没有权限为该学生添加成绩')
    }
    scoreData.classId = rows[0].class_id
  }

  //4.调用服务层添加成绩
  try {
    const result = await scoreService.addScore(scoreData, user.userId)
    //记录日志
    await recordOperation(
      req.user,
      'ADD_SCORE',
      `添加成绩 ${result.insertId}，学生 ${scoreData.studentId}，班级 ${scoreData.classId}`,
      'score',
      result.insertId
    )
    sendJson(res, 201, { id: result.insertId })
  } catch (err) {
    console.error(err)
    sendError(res, 500, '服务器错误')
  }
}

// 批量添加成绩
async function handleBatchAddScores(req, res) {
  const user = req.user
  if (user.role === 'student') return sendError(res, 403, '无权限')

  const { scores } = req.body
  if (!Array.isArray(scores) || scores.length === 0) {
    return sendError(res, 400, '请提供成绩数据')
  }

  // 校验每个成绩数据
  for (const item of scores) {
    const error = validateScore(item)
    if (error) {
      return sendError(res, 400, `数据错误：${error}`)
    }
  }

  //班主任权限：确保所有学生都属于自己班级
  if (user.role === 'teacher') {
    const studentIds = [...new Set(scores.map(s => s.studentId))]
    const [rows] = await db.execute(
      `SELECT cs.student_id
      FROM class_student cs
      JOIN class_teacher ct ON cs.class_id = ct.class_id
      WHERE ct.teacher_id = ? AND cs.student_id IN (${studentIds.map(() => '?').join(',')})`,
      [user.userId, ...studentIds]
    )
    const allowedIds = rows.map(r => r.student_id)
    for (const item of scores) {
      if (!allowedIds.includes(item.studentId)) {
        return sendError(res, 403, `学生ID ${item.studentId} 不属于您的班级`)
      }
      //自动填充classId
      const studentRow = rows.find(r => r.student_id === item.studentId)
      item.classId = studentRow.class_id
    }
  }

  try {
    const results = await scoreService.addScoresBatch(scores, user.userId)
    //记录日志
    await recordOperation(
      req.user,
      'ADD_SCORES_BATCH',
      `批量添加 ${results.insertedCount} 条成绩`,
      'score',
      results.insertedCount
    )
    sendJson(res, 201, { insertedCount: results.insertedCount })
  } catch (err) {
    console.error(err)
    sendError(res, 500, '服务器错误')
  }
}

// 查询成绩列表
async function handleGetScores(req, res) {
  const user = req.user
  const filters = {
    classId: req.query.classId ? parseInt(req.query.classId) : null,
    subject: req.query.subject || null,
    studentId: req.query.studentId ? parseInt(req.query.studentId) : null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
  }
  const pagination = {
    page: parseInt(req.query.page || 1),
    pageSize: parseInt(req.query.pageSize || 20),
  }

  try {
    const [scores, total] = await Promise.all([
      scoreService.getScores(filters, pagination, user),
      scoreService.getScoresCount(filters, user)
    ])
    sendJson(res, 200, {
      data: scores,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    })
  } catch (err) {
    console.error('查询成绩列表失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//修改成绩
async function handleUpdateScore(req, res) {
  const user = req.user
  if (user.role === 'student') return sendError(res, 403, '无权限')

  const scoreId = parseInt(req.routeParams.id)
  const updateData = req.body
  const error = validateScoreUpdate(updateData)
  if (error) return sendError(res, 400, error)

  try {
    // 获取原成绩信息用于权限校验
    const original = await scoreService.getScoreById(scoreId)
    if (!original) return sendError(res, 404, '成绩不存在')

    // 班主任权限：确保只能修改自己班级的成绩
    if (user.role === 'teacher') {
      const [rows] = await db.execute(
        `SELECT 1 FROM class_teacher WHERE teacher_id = ? AND student_id = ?`,
        [user.userId, original.class_id]
      )
      if (rows.length === 0) {
        return sendError(res, 403, '您没有权限修改该学生的成绩')
      }
    }

    const success = await scoreService.updateScore(scoreId, updateData)
    if (!success) return sendError(res, 404, '更新失败')
    await recordOperation(
      req.user,
      'UPDATE_SCORE',
      `更新成绩 ${scoreId}，学生 ${original.student_id}，班级 ${original.class_id}`,
      'score',
      scoreId
    )
    sendJson(res, 200, { message: '更新成功' })
  } catch (err) {
    console.error(err)
    sendError(res, 500, '服务器错误')
  }
}

// 删除成绩
async function handleDeleteScore(req, res) {
  const user = req.user
  if (user.role === 'student') return sendError(res, 403, '无权限')

  const scoreId = parseInt(req.routeParams.id)

  try {
    const original = await scoreService.getScoreById(scoreId)
    if (!original) return sendError(res, 404, '成绩不存在')

    if (user.role === 'teacher') {
      const [rows] = await db.execute(
        `SELECT 1 FROM class_teacher WHERE teacher_id = ? AND student_id = ?`,
        [user.userId, original.class_id]
      )
      if (rows.length === 0) {
        return sendError(res, 403, '您没有权限删除该学生的成绩')
      }
    }

    const success = await scoreService.deleteScore(scoreId)
    if (!success) return sendError(res, 404, '删除失败')
    await recordOperation(
      req.user,
      'DELETE_SCORE',
      `删除成绩 ${scoreId}，学生 ${original.student_id}，班级 ${original.class_id}`,
      'score',
      scoreId
    )
    sendJson(res, 200, { message: '删除成功' })
  } catch (err) {
    console.error('删除成绩失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//成绩统计
async function handleGetStatistics(req, res) {
  const user = req.user
  const filters = {
    classId: req.query.classId ? parseInt(req.query.classId) : null,
    subject: req.query.subject || null,
  }
  try {
    const stats = await scoreService.getScoreStatistics(filters, user)
    sendJson(res, 200, stats)
  } catch (err) {
    console.error('查询成绩统计失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//导出成绩为CSV
async function handleExportScores(req, res) {
  const user = req.user
  if (user.role === 'student') return sendError(res, 403, '无权限')

  const filters = {
    classId: req.query.classId ? parseInt(req.query.classId) : null,
    subject: req.query.subject || null,
    studentId: req.query.studentId ? parseInt(req.query.studentId) : null,
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null,
  }
  try {
    // 不分页，获取全部符合条件的数据
    const scores = await scoreService.getScores(filters, null, user)
    const columns = [
      { label: '学生姓名', value: 'student_name' },
      { label: '科目', value: 'subject' },
      { label: '分数', value: 'score' },
      { label: '考试日期', value: 'exam_date' },
      { label: '班级', value: 'class_name' },
      { label: '年级', value: 'grade' },
    ]
    const csv = exportToCSV(scores, columns)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="scores.csv"`)
    res.end('\uFFFE' + csv)
  } catch (err) {
    console.error('导出成绩失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'POST /api/scores': handleAddScore,
  'POST /api/scores/batch': handleBatchAddScores,
  'GET /api/scores': handleGetScores,
  'PUT /api/scores/:id': handleUpdateScore,
  'DELETE /api/scores/:id': handleDeleteScore,
  'GET /api/statistics/scores': handleGetStatistics,
  'GET /api/scores/export': handleExportScores,
}