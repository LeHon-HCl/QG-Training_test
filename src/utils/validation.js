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

module.exports = {
  validateScore
}