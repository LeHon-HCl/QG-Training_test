const db = require('../db')

async function addScore(scoreData, operatorId) {
  const { studentId, subject, score, examDate, classId } = scoreData
  const [result] = await db.execute(`
    INSERT INTO scores (student_id, subject, score, exam_Date, class_id) 
    VALUES (?, ?, ?, ?, ?)`, [studentId, subject, score, examDate, classId])
  return result
}

module.exports = {
  addScore
}
