const db = require('../db')

// 添加成绩
async function addScore(scoreData, operatorId) {
  const { studentId, subject, score, examDate, classId } = scoreData
  const [result] = await db.execute(`
    INSERT INTO scores (student_id, subject, score, exam_Date, class_id) 
    VALUES (?, ?, ?, ?, ?)`, [studentId, subject, score, examDate, classId])
  return result
}

// 批量添加成绩
async function addScoresBatch(scoresArray, operatorId) {
  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()
    for (const item of scoresArray) {
      await connection.execute(
        `INSERT INTO scores (student_id, subject, score, exam_date, class_id)
        VALUES (?, ?, ?, ?, ?)`,
        [item.studentId, item.subject, item.score, item.examDate, item.classId]
      )
    }
    await connection.commit()
    return { insertedCount: scoresArray.length }
  } catch (err) {
    await connection.rollback()
    throw err
  } finally {
    connection.release()
  }
}

// 查询成绩
async function getScores(filters, pagination, user) {
  let sql = `
    SELECT s.id, s.student_id, u.real_name as student_name, s.subject, s.score, s.exam_date, 
            c.id as class_id, c.class_name, c.grade
    FROM scores s
    JOIN users u ON s.student_id = u.id
    JOIN classes c ON s.class_id = c.id
  `
  const conditions = []
  const params = []

  // 权限过滤：班主任只能看自己班级的学生成绩，学生只能看自己的成绩
  if (user.role === 'teacher') {
    sql += `JOIN class_teacher ct ON c.id = ct.class_id`
    conditions.push('ct.teacher_id = ?')
    params.push(user.userId)
  } else if (user.role === 'student') {
    conditions.push('s.student_id = ?')
    params.push(user.userId)
  }

  // 筛选条件
  if (filters.classId) {
    conditions.push('c.id = ?')
    params.push(filters.classId)
  }  // 筛选班级
  if (filters.subject) {
    conditions.push('s.subject = ?')
    params.push(filters.subject)
  }  // 筛选科目
  if (filters.studentId) {
    conditions.push('s.student_id = ?')
    params.push(filters.studentId)
  }  // 筛选学生
  if (filters.startDate) {
    conditions.push('s.exam_date >= ?')
    params.push(filters.startDate)
  }  // 筛选开始时间
  if (filters.endDate) {
    conditions.push('s.exam_date <= ?')
    params.push(filters.endDate)
  }  // 筛选结束时间

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  sql += ` ORDER BY s.exam_date DESC`

  //分页
  if (pagination) {
    const page = parseInt(pagination.page) || 1
    const pageSize = parseInt(pagination.pageSize) || 20
    const offset = (page - 1) * pageSize
    sql += ` LIMIT ${offset}, ${pageSize}`
  }

  console.log('执行SQL:', sql)
  console.log('参数:', params)

  const [rows] = await db.execute(sql, params)
  return rows
}

// 查询成绩总数
async function getScoresCount(filters, user) {
  let sql = `
    SELECT COUNT(*) as total
    FROM scores s
    JOIN users u ON s.student_id = u.id
    JOIN classes c ON s.class_id = c.id
  `
  const conditions = []
  const params = []

  if (user.role === 'teacher') {
    sql += ` JOIN class_teacher ct ON c.id = ct.class_id`
    conditions.push('ct.teacher_id = ?')
    params.push(user.userId)
  } else if (user.role === 'student') {
    conditions.push('s.student_id = ?')
    params.push(user.userId)
  }

  if (filters.classId) {
    conditions.push('c.id = ?')
    params.push(filters.classId)
  }
  if (filters.subject) {
    conditions.push('s.subject = ?')
    params.push(filters.subject)
  }
  if (filters.studentId) {
    conditions.push('s.student_id = ?')
    params.push(filters.studentId)
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  const [rows] = await db.execute(sql, params)
  return rows[0].total
}

//根据ID获取单条成绩
async function getScoreById(scoreId) {
  const [rows] = await db.execute(`
    SELECT s.*, c.id as class_id
    FROM scores s
    JOIN classes c ON s.class_id = c.id
    WHERE s.id = ?
    `, [scoreId])
  return rows[0]
}

// 更新成绩
async function updateScore(scoreId, updateData) {
  const fields = []
  const params = []
  if (updateData.score !== undefined) {
    fields.push('score = ?')
    params.push(updateData.score)
  }
  if (updateData.examDate) {
    fields.push('exam_date = ?')
    params.push(updateData.subject)
  }
  if (updateData.subject) {
    fields.push('subject = ?')
    params.push(updateData.subject)
  }
  if (fields.length === 0) return false

  params.push(scoreId)
  const [result] = await db.execute(
    ` UPDATE scores SET ${fields.join(', ')} WHERE id = ?`,
    params
  )
  return result.affectedRows > 0
}

// 删除成绩
async function deleteScore(scoreId) {
  const [result] = await db.execute(
    ` DELETE FROM scores WHERE id = ?`,
    [scoreId]
  )
  return result.affectedRows > 0
}

// 成绩统计（按班级、科目维度）
async function getScoreStatistics(filters, user) {
  let sql = `
  SELECT
    c.id as class_id, c.class_name, c.grade,
    s.subject,
    COUNT(*) as total_count,
    AVG(s.score) as avg_score,
    MAX(s.score) as max_score,
    MIN(s.score) as min_score,
    SUM(CASE WHEN s.score >= 60 THEN 1 ELSE 0 END) as pass_count
  FROM scores s
  JOIN classes c ON s.class_id = c.id
  `
  const conditions = []
  const params = []

  if (user.role === 'teacher') {
    sql += ` JOIN class_teacher ct ON c.id = ct.class_id`
    conditions.push('ct.teacher_id = ?')
    params.push(user.userId)
  }
  if (filters.classId) {
    conditions.push('c.id = ?')
    params.push(filters.classId)
  }
  if (filters.subject) {
    conditions.push('s.subject = ?')
    params.push(filters.subject)
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  sql += ` GROUP BY c.id, s.subject ORDER BY c.grade DESC, c.class_name, s.subject`

  const [rows] = await db.execute(sql, params)

  // 计算通过率
  return rows.map(row => ({
    ...row,
    pass_rate: row.pass_count ? (row.pass_count / row.total_count * 100).toFixed(2) : '0.00'
  }))
}

module.exports = {
  addScore,
  addScoresBatch,
  getScores,
  getScoresCount,
  getScoreById,
  updateScore,
  deleteScore,
  getScoreStatistics,
}