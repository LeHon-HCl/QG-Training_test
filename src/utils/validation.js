function validateScore(data) {
  const { studentId, subject, score, examDate, classId } = data
  if (!studentId || !subject || !score === undefined) {
    return '缺少必要字段'
  }
  if (typeof score !== 'number' || score < 0 || score > 150) {
    return '成绩必须是数字且在0-150之间（包含0和150）'
  }
  return null
}

// 验证班级数据
function validateClass(data) {
  const { className, grade } = data
  if (!className || typeof className !== 'string' || className.trim().length === 0) {
    return '班级名称不能为空'
  }
  if (!grade || !Number.isInteger(grade) || grade < 2000 || grade > 2100) {
    return '年级必须是有效的四位年份'
  }
  return null
}

// 验证绑定班主任数据
function validateBindTeacher(data) {
  const { classId, teacherId } = data
  if (!classId || !Number.isInteger(classId)) return '班级ID无效'
  if (!teacherId || !Number.isInteger(teacherId)) return '教师ID无效'
  return null
}

// 验证学生操作数据
function validateStudentOperation(data) {
  const { classId, studentId } = data
  if (!classId || !Number.isInteger(classId)) return '班级ID无效'
  if (!studentId || !Number.isInteger(studentId)) return '学生ID无效'
  return null
}

module.exports = {
  validateScore,
  validateClass,
  validateBindTeacher,
  validateStudentOperation
}