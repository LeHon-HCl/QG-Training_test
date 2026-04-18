const db = require('../db')

// 获取所有班级
async function getAllClasses(grade = null) {
  let sql = 'SELECT id, class_name, grade FROM classes'
  const params = []
  if (grade) {
    sql += ' WHERE grade = ?'
    params.push(grade)
  } //如果有年级，添加 WHERE 条件
  sql += ' ORDER BY grade DESC, class_name ASC' // 按年级降序，班级名称升序排序
  const [rows] = await db.query(sql, params) // 执行查询
  return rows
}

//根据ID获取单个班级
async function getClassById(classId) {
  const [rows] = await db.execute(
    'SELECT id, class_name, grade FROM classes WHERE id = ?',
    [classId]
  )
  return rows[0]
}

// 创建班级
async function createClass(className, grade) {
  // 检查是否已存在同年级同名班级
  const [existing] = await db.execute(
    'SELECT id FROM classes WHERE class_name = ? AND grade = ?',
    [className, grade]
  );
  if (existing.length > 0) {
    throw new Error('DUPLICATE_CLASS_NAME');
  }

  const [result] = await db.execute(
    'INSERT INTO classes (class_name, grade) VALUES (?, ?)',
    [className, grade]
  )
  return { id: result.insertId, className, grade }
}

//更新班级
async function updateClass(classId, className, grade) {
  //先检查是否存在同名的其他班级
  const [existing] = await db.execute(
    'SELECT id FROM classes WHERE class_name = ? AND grade = ? AND id != ?',
    [className, grade, classId]
  )
  if (existing.length > 0) {
    throw new Error('班级名称已存在')
  }

  const [result] = await db.execute(
    'UPDATE classes SET class_name = ?, grade = ? WHERE id = ?',
    [className, grade, classId]
  )
  return result.affectedRows > 0
}

//删除班级
async function deleteClass(classId) {
  const [result] = await db.execute('DELETE FROM classes WHERE id = ?', [classId])
  return result.affectedRows > 0 // 如果影响行数大于0，说明删除成功
}

// 绑定班主任（支持替换，先删后插）
async function bindTeacher(classId, teacherId) {
  // 确保教师角色为 ‘teacher’
  const [teacherCheck] = await db.execute(
    'SELECT role FROM users WHERE id = ? AND role = ?',
    [teacherId, 'teacher']
  )
  if (teacherCheck.length === 0) {
    throw new Error('指定的用户不是教师')
  }

  // 先删除旧的绑定
  await db.execute(
    'DELETE FROM class_teacher WHERE class_id = ?',
    [classId]
  )
  // 再插入新的绑定
  await db.execute(
    'INSERT INTO class_teacher (class_id, teacher_id) VALUES (?, ?)',
    [classId, teacherId]
  )
  return true
}

//解绑班主任
async function unbindTeacher(classId) {
  const [result] = await db.execute('DELETE FROM class_teacher WHERE class_id = ?', [classId])
  return result.affectedRows > 0 // 如果影响行数大于0，说明解绑成功
}

//获取班级的班主任信息
async function getClassTeacher(classId) {
  const [rows] = await db.execute(
    `SELECT u.id, u.username, u.real_name
    FROM class_teacher ct
    JOIN users u ON ct.teacher_id = u.id
    WHERE ct.class_id = ?`,
    [classId]
  )
  return rows[0] || null
}

//获取班级学生列表
async function getClassStudents(classId) {
  const [rows] = await db.execute(
    `SELECT u.id, u.username, u.real_name
    FROM class_student cs
    JOIN users u ON cs.student_id = u.id
    WHERE cs.class_id = ? `,
    [classId]
  )
  return rows
}

//向班级添加学生
async function addStudentToClass(classId, studentId) {
  //检查学生身份
  const [studentCheck] = await db.execute(
    'SELECT role FROM users WHERE id = ? AND role = ?',
    [studentId, 'student']
  )
  if (studentCheck.length === 0) {
    throw new Error('指定的用户不是学生')
  }

  // 检查学生是否已经在某个班级中
  const [existing] = await db.execute(
    'SELECT class_id FROM class_student WHERE student_id = ?',
    [studentId]
  )
  if (existing.length > 0) {
    throw new Error('该学生已属于其他班级，不能重复添加')
  }

  await db.execute(
    'INSERT INTO class_student (class_id, student_id) VALUES (?, ?)',
    [classId, studentId]
  )
  return true
}

//从班级移除学生
async function removeStudentFromClass(classId, studentId) {
  const [result] = await db.execute(
    'DELETE FROM class_student WHERE class_id = ? AND student_id = ?',
    [classId, studentId]
  )
  return result.affectedRows > 0 // 如果影响行数大于0，说明移除成功
}

// 获取教师管理的班级
async function getTeacherClasses(teacherId) {
  const [rows] = await db.execute(
    `SELECT c.id, c.class_name, c.grade 
         FROM classes c
         JOIN class_teacher ct ON c.id = ct.class_id
         WHERE ct.teacher_id = ?`,
    [teacherId]
  )
  return rows
}

// 获取学生所在班级
async function getStudentClass(studentId) {
  const [rows] = await db.execute(
    `SELECT c.id, c.class_name, c.grade 
         FROM classes c
         JOIN class_student cs ON c.id = cs.class_id
         WHERE cs.student_id = ?`,
    [studentId]
  )
  return rows[0] || null
}

// 别忘了在 module.exports 中导出这两个新函数

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  bindTeacher,
  unbindTeacher,
  getClassTeacher,
  getClassStudents,
  addStudentToClass,
  removeStudentFromClass,
  getTeacherClasses,
  getStudentClass,
}