const db = require('../db')

//1. 班主任发布通知
async function createNotice(publisherId, classId, title, content) {
  const [result] = await db.execute(
    `INSERT INTO notices (publisher_id, class_id, title, content)
    VALUES (?, ?, ?, ?)`,
    [publisherId, classId, title, content]
  )
  return { id: result.insertId }
}

// 2.获取通知详情（用于权限校验）
async function getNoticeById(noticeId) {
  const [rows] = await db.execute(
    `SELECT n.*, c.class_name, u.real_name as publisher_name
    FROM notices n
    JOIN classes c ON n.class_id = c.id
    JOIN users u ON n.publisher_id = u.id
    WHERE n.id = ?`,
    [noticeId]
  )
  return rows[0] || null
}

//3. 更新通知（仅标题和内容）
async function updateNotice(noticeId, title, content) {
  const [result] = await db.execute(
    `UPDATE notices SET title = ?, content = ? WHERE id = ?`,
    [title, content, noticeId]
  )
  return result.affectedRows > 0
}

//4. 删除通知
async function deleteNotice(noticeId) {
  const [result] = await db.execute(
    `DELETE FROM notices WHERE id = ?`,
    [noticeId]
  )
  return result.affectedRows > 0
}

//5. 获得通知列表（按角色过滤）
async function getNotices(filters, user) {
  let sql = `
  SELECT n.id, n.title, n.content, n.created_at, n.updated_at,
    n.class_id, c.class_name, c.grade,
    u.real_name as publisher_name
  FROM notices n
  JOIN classes c ON n.class_id = c.id
  JOIN users u ON n.publisher_id = u.id`
  const conditions = []
  const params = []

  // 权限过滤：班主任只能看自己班级的通知，学生只能看自己的通知
  if (user.role === 'teacher') {
    sql += ` JOIN class_teacher ct ON c.id = ct.class_id `
    conditions.push('ct.teacher_id = ?')
    params.push(user.userId)
  } else if (user.role === 'student') {
    sql += ` JOIN class_student cs ON c.id = cs.class_id `
    conditions.push('cs.student_id = ?')
    params.push(user.userId)
  }
  //教务主任无额外JOIN，直接查询所有通知

  //可选筛选条件
  if (filters.classId) {
    conditions.push('n.class_id = ?')
    params.push(filters.classId)
  }
  if (filters.isPublished !== undefined && filters.isPublished !== null) {
    conditions.push('n.is_published = ?')
    params.push(filters.isPublished)
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  sql += ` ORDER BY n.created_at DESC`

  // 分页查询
  if (filters.page && filters.pageSize) {
    const page = parseInt(filters.page) || 1
    const pageSize = parseInt(filters.pageSize) || 20
    const offset = (page - 1) * pageSize
    sql += ` LIMIT ${offset}, ${pageSize}`
  }

  console.log('[NoticeService] SQL:', sql);
  console.log('[NoticeService] Params:', params);
  const [rows] = await db.execute(sql, params)

  //如果是学生，附加已读状态
  if (user.role === 'student' && rows.length > 0) {
    const noticeIds = rows.map(n => n.id)
    const [statuses] = await db.execute(
      `SELECT notice_id, is_read, read_time
        FROM notice_read_status
        WHERE student_id = ? AND notice_id IN (${noticeIds.map(() => '?').join(',')})`,
      [user.userId, ...noticeIds]
    )
    const statusMap = {}
    statuses.forEach(s => { statusMap[s.notice_id] = s })
    rows.forEach(n => {
      n.is_read = statusMap[n.id]?.is_read || false
      n.read_time = statusMap[n.id]?.read_time || null
    })
  }
  return rows
}

// 6. 获取通知总数（用于分页）
async function getNoticesCount(filters, user) {
  let sql = `
    SELECT COUNT(*) as total
    FROM notices n
    JOIN classes c ON n.class_id = c.id
  `
  const conditions = []
  const params = []

  if (user.role === 'teacher') {
    sql += ` JOIN class_teacher ct ON c.id = ct.class_id `
    conditions.push('ct.teacher_id = ?')
    params.push(user.userId)
  } else if (user.role === 'student') {
    sql += ` JOIN class_student cs ON c.id = cs.class_id `
    conditions.push('cs.student_id = ?')
    params.push(user.userId)
  }

  if (filters.classId) {
    conditions.push('n.class_id = ?')
    params.push(filters.classId)
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  const [rows] = await db.execute(sql, params)
  return rows[0].total
}

// 7. 标记通知为已读（学生操作）
async function markAsRead(noticeId, studentId) {
  // 使用 INSERT ... ON DUPLICATE KEY UPDATE 确保幂等
  await db.execute(
    `INSERT INTO notice_read_status (notice_id, student_id, is_read, read_time)
    VALUES (?, ?, TRUE, NOW())
    ON DUPLICATE KEY UPDATE is_read = TRUE, read_time = NOW()
    `,
    [noticeId, studentId]
  )
  return true
}

// 8. 获取通知的已读统计（班主任操作）
async function getReadStatistics(noticeId) {
  //先获取通知所属班级的所有学生
  const [notice] = await db.execute(
    `SELECT class_id FROM notices WHERE id = ?`,
    [noticeId]
  )
  if (!notice.length) throw new Error('通知不存在或已被删除')
  const classId = notice[0].class_id

  // 班级总学生数
  const [totalStudents] = await db.execute(
    `SELECT COUNT(*) as total FROM class_student WHERE class_id = ?`,
    [classId]
  )
  const totalStudentsCount = totalStudents[0].total

  // 已读学生数及名单
  const [readRows] = await db.execute(
    `SELECT u.id, u.real_name, u.username, rs.read_time
    FROM notice_read_status rs
    JOIN users u ON rs.student_id = u.id
    WHERE rs.notice_id = ?
    AND rs.is_read = TRUE
    `,
    [noticeId]
  )
  const readCount = readRows.length

  // 未读学生数
  const [allStudents] = await db.execute(
    `SELECT u.id, u.real_name, u.username
    FROM class_student cs
    JOIN users u ON cs.student_id = u.id
    WHERE cs.class_id = ?
    `,
    [classId]
  )
  const readIds = new Set(readRows.map(r => r.id))
  const unreadList = allStudents.filter(s => !readIds.has(s.id))

  return {
    total: totalStudentsCount,
    readCount,
    unreadCount: totalStudentsCount - readCount,
    readList: readRows,
    unreadList
  }
}

module.exports = {
  createNotice,
  getNoticeById,
  updateNotice,
  deleteNotice,
  getNotices,
  getNoticesCount,
  markAsRead,
  getReadStatistics
}