// src/routes/users.js
const userService = require('../services/userService');
const { sendJson, sendError } = require('../utils/response');

async function handleGetUsers(req, res) {
  const user = req.user;
  // 仅允许教师、教务主任访问，学生不可查看用户列表
  if (user.role === 'student') {
    return sendError(res, 403, '无权限');
  }

  const filters = {
    role: req.query.role || null,
    username: req.query.username || null
  };

  try {
    const users = await userService.getUsers(filters);
    sendJson(res, 200, users);
  } catch (err) {
    console.error('获取用户列表失败:', err);
    sendError(res, 500, '服务器错误');
  }
}

module.exports = {
  'GET /api/users': handleGetUsers
};