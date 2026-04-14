const db = require('../db')

async function addScore(scoreData, operatorId) {
  const { studentId, subject, score, examDate, classId } = scoreData
  const [result] = await db.execute(`
    INSERT INTO scores (studentId, subject, score, exam_Date, classId) 
    VALUES (?, ?, ?, ?, ?)`, [studentId, subject, score, examDate, classId])
  return result
}


