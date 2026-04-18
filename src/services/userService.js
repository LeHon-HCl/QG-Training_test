// src/services/userService.js
const db = require('../db');

async function getUsers(filters = {}) {
  let sql = `SELECT id, username, real_name, role FROM users WHERE 1=1`;
  const params = [];

  if (filters.role) {
    sql += ` AND role = ?`;
    params.push(filters.role);
  }
  if (filters.username) {
    sql += ` AND username LIKE ?`;
    params.push(`%${filters.username}%`);
  }

  const [rows] = await db.execute(sql, params);
  return rows;
}

module.exports = { getUsers };