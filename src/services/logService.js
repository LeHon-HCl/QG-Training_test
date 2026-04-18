const db = require('../db')

/**
 * 记录日志
 * @param {number} opertorId - 操作人ID
 * @param {string} operatorName - 操作人姓名
 * @param {string} operationType - 操作类型
 * @param {string} content - 操作内容描述
 * @param {string} targetType - 操作目标类型
 * @param {string} targetId - 操作目标ID
 */

async function createLog(opertorId, operatorName, operationType, content, targetType = null, targetId = null) {
  await db.execute(
    `INSERT INTO operation_logs (operator_id, operator_name, operation_type, content, target_type, target_id)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [opertorId, operatorName, operationType, content, targetType, targetId]
  )
}

/**
 * 查询操作日志（分页、筛选、权限过滤）
 * @param {object} filters - 筛选条件 {operatorId, operationType, targetType, targetId}
 * @param {object} pagination - 分页参数 {page, pageSize}
 * @param {object} user - 当前用户 {userId, role}
 */

async function getLogs(filters, pagination, user) {
  let sql = `
  SELECT l.id, l.operator_id, l.operator_name, l.operation_type, l.content, l.target_type, l.target_id, l.created_at
  FROM operation_logs l`
  const conditions = []
  const params = []

  if (user.role === 'teacher') {
    // 获取该教师管理的所有班级ID
    const [classRows] = await db.execute(
      `SELECT class_id FROM class_teacher WHERE teacher_id = ?`,
      [user.userId]
    );
    const classIds = classRows.map(r => r.class_id);

    if (classIds.length > 0) {
      const placeholders = classIds.map(() => '?').join(',');
      // 条件：(班级相关) 或 (操作人自己)
      conditions.push(`( (l.target_type = 'class' AND l.target_id IN (${placeholders})) OR l.operator_id = ? )`);
      params.push(...classIds, user.userId);
    } else {
      // 无班级时，只能看自己的操作
      conditions.push(`l.operator_id = ?`);
      params.push(user.userId);
    }
  }
  // 教务主任无限制

  // 通用筛选
  if (filters.operationType) {
    conditions.push('l.operation_type = ?')
    params.push(filters.operationType)
  }
  if (filters.operatorId) {
    conditions.push('l.operator_id = ?')
    params.push(filters.operatorId)
  }
  if (filters.startDate) {
    conditions.push('l.created_at >= ?')
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    conditions.push('l.created_at <= ?')
    params.push(filters.endDate)
  }
  if (filters.targetType) {
    conditions.push('l.target_type = ?')
    params.push(filters.targetType)
  }
  if (filters.targetId) {
    conditions.push('l.target_id = ?')
    params.push(filters.targetId)
  }

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  sql += ` ORDER BY l.created_at DESC`

  // 分页（数字拼接）
  const page = parseInt(pagination.page) || 1
  const pageSize = parseInt(pagination.pageSize) || 20
  const offset = (page - 1) * pageSize
  sql += ` LIMIT ${offset}, ${pageSize}`

  const [rows] = await db.execute(sql, params)
  return rows
}

/**
 * 获取日志总数
 */
async function getLogsCount(filters, user) {
  let sql = `SELECT COUNT(*) as total FROM operation_logs l`
  const conditions = []
  const params = []

  if (user.role === 'teacher') {
    const [classRows] = await db.execute(
      `SELECT class_id FROM class_teacher WHERE teacher_id = ?`,
      [user.userId]
    );
    const classIds = classRows.map(r => r.class_id);

    if (classIds.length > 0) {
      const placeholders = classIds.map(() => '?').join(',');
      conditions.push(`( (l.target_type = 'class' AND l.target_id IN (${placeholders})) OR l.operator_id = ? )`);
      params.push(...classIds, user.userId);
    } else {
      conditions.push(`l.operator_id = ?`);
      params.push(user.userId);
    }
  }

  if (filters.operationType) {
    conditions.push('l.operation_type = ?')
    params.push(filters.operationType)
  }
  if (filters.operatorId) {
    conditions.push('l.operator_id = ?')
    params.push(filters.operatorId)
  }
  if (filters.startDate) {
    conditions.push('l.created_at >= ?')
    params.push(filters.startDate)
  }
  if (filters.endDate) {
    conditions.push('l.created_at <= ?')
    params.push(filters.endDate)
  }
  if (filters.targetType) {
    conditions.push('l.target_type = ?')
    params.push(filters.targetType)
  }
  if (filters.targetId) {
    conditions.push('l.target_id = ?')
    params.push(filters.targetId)
  }

  if (conditions.length) {
    sql += ` WHERE ` + conditions.join(' AND ')
  }

  const [rows] = await db.execute(sql, params)
  return rows[0].total
}

module.exports = {
  createLog,
  getLogs,
  getLogsCount,
}