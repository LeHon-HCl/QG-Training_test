const logService = require('../services/logService')

/** 
 * 记录操作日志的便捷函数
 * @param {object} user - 当前用户对象 （包含 userId, realName）
 * @param {string} type - 操作类型
 * @param {string} content - 操作描述
 * @param {string} targetType - 目标类型(如'class','score','notice')
 * @param {number} targetId - 目标ID
 */

async function recordOperation(user, type, content, targetType = null, targetId = null) {
  try {
    await logService.createLog(
      user.userId,
      user.realName,
      type,
      content,
      targetType,
      targetId
    )
  } catch (err) {
    console.error('记录操作日志失败:', err)
    // 日志记录失败不应影响主流程，仅记录错误日志
  }
}

module.exports = { recordOperation }