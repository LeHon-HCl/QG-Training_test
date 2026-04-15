const { addScore } = require('../services/scoreService')
const { sendJson, sendError } = require('../utils/response')
const { validateScore } = require('../utils/validation')
const db = require('../db')

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
    const result = await addScore(scoreData, user.userId)
    //记录日志
    sendJson(res, 201, { id: result.insertId })
  } catch (err) {
    console.error(err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'POST /api/scores': handleAddScore,
}