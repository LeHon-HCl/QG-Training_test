const classService = require('../services/classService')
const { sendJson, sendError } = require('../utils/response')
const { validateClass, validateBindTeacher, validateStudentOperation } = require('../utils/validation')
const { recordOperation } = require('../utils/operationLogger')


// 1. 获取所有班级
async function handleGetClasses(req, res) {
  const user = req.user
  try {
    let classes;
    if (user.role === 'admin') {
      classes = await classService.getAllClasses(req.query.grade)
    } else if (user.role === 'teacher') {
      // 获取该教师管理的班级
      classes = await classService.getTeacherClasses(user.userId)
    } else if (user.role === 'student') {
      // 获取学生所在班级（单个）
      const studentClass = await classService.getStudentClass(user.userId)
      classes = studentClass ? [studentClass] : []
    } else {
      return sendError(res, 403, '无权限')
    }
    sendJson(res, 200, classes)
  } catch (err) {
    console.error('获取班级列表失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

//2. 创建班级
async function handleCreateClass(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const { className, grade } = req.body
  const error = validateClass({ className, grade })
  if (error) return sendError(res, 400, error)

  try {
    const newClass = await classService.createClass(className, grade)
    await recordOperation(
      req.user,
      'CREATE_CLASS',
      `创建班级 ${className}，年级 ${grade}`,
      'class',
      newClass.id
    )
    sendJson(res, 201, newClass)
  } catch (err) {
    if (err.message === 'DUPLICATE_CLASS_NAME') {
      return sendError(res, 400, '同年级已存在相同名称的班级');
    }
    console.error('创建班级失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 3. 更新班级
async function handleUpdateClass(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const classId = parseInt(req.routeParams.id)
  const { className, grade } = req.body
  const error = validateClass({ className, grade })

  console.log('req.params:', req.params);
  console.log('req.routeParams:', req.routeParams);

  if (error) return sendError(res, 400, error)
  console.log('准备更新班级，ID:', classId, '数据:', { className, grade });
  try {
    const success = await classService.updateClass(classId, className, grade)  // 更新班级

    // 如果更新成功，返回更新后的班级信息
    await recordOperation(
      req.user,
      'UPDATE_CLASS',
      `更新班级 ${classId}，班级名称 ${className}，年级 ${grade}`,
      'class',
      classId
    )
    sendJson(res, 200, { message: '班级更新成功' })
  } catch (err) {
    if (!success) return sendError(res, 404, '班级不存在')
    if (err.message === '班级名称已存在') {
      return sendError(res, 400, '同年级已存在相同名称的班级')
    }
    console.error('更新班级失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 4. 删除班级
async function handleDeleteClass(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const classId = parseInt(req.routeParams.id)
  try {
    const success = await classService.deleteClass(classId)
    if (!success) return sendError(res, 404, '班级不存在')
    // 如果删除成功，返回删除成功信息
    await recordOperation(
      req.user,
      'DELETE_CLASS',
      `删除班级 ${classId}`,
      'class',
      classId
    )
    sendJson(res, 200, { message: '班级删除成功' })
  } catch (err) {
    console.error('删除班级失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 5. 绑定班主任
async function handleBindTeacher(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const { classId, teacherId } = req.body
  const error = validateBindTeacher({ classId, teacherId })
  if (error) return sendError(res, 400, error)

  try {
    await classService.bindTeacher(classId, teacherId)
    // 如果绑定成功，返回绑定成功信息
    await recordOperation(
      req.user,
      'BIND_TEACHER',
      `绑定班级 ${classId}，教师 ${teacherId}`,
      'class',
      classId
    )
    sendJson(res, 200, { message: '班主任绑定成功' })
  } catch (err) {
    if (err.message.includes('不是教师')) return sendError(res, 400, err.message) //如果指定的用户不是教师，返回400错误信息
    console.error('绑定班主任失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 6. 解绑班主任
async function handleUnbindTeacher(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const { classId } = req.body
  if (!classId) return sendError(res, 400, '班级ID不能为空')

  try {
    const success = await classService.unbindTeacher(classId)
    if (!success) return sendError(res, 404, '该班级未绑定班主任')
    // 如果解绑成功，返回解绑成功信息
    await recordOperation(
      req.user,
      'UNBIND_TEACHER',
      `解绑班级 ${classId}`,
      'class',
      classId
    )
    sendJson(res, 200, { message: '班主任解绑成功' })
  } catch (err) {
    console.error('解绑班主任失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 7. 获取班级详情 （包括班主任、学生列表）
async function handleGetClassDetail(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const classId = parseInt(req.routeParams.id)
  try {
    const classInfo = await classService.getClassById(classId)
    if (!classInfo) return sendError(res, 404, '班级不存在')

    const teacher = await classService.getClassTeacher(classId)
    const students = await classService.getClassStudents(classId)

    sendJson(res, 200, {
      ...classInfo,
      teacher: teacher || null,
      students
    }) // 返回班级详情，包括班主任和学生列表
  } catch (err) {
    console.error('获取班级详情失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 8. 向班级添加学生
async function handleAddStudent(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const { classId, studentId } = req.body
  const error = validateStudentOperation({ classId, studentId })
  if (error) return sendError(res, 400, error)

  try {
    await classService.addStudentToClass(classId, studentId)
    // 如果添加成功，返回添加成功信息
    await recordOperation(
      req.user,
      'ADD_STUDENT',
      `添加学生 ${studentId} 到班级 ${classId}`,
      'class',
      classId
    )
    sendJson(res, 200, { message: '学生添加成功' })
  } catch (err) {
    console.log('添加学生错误详情:', err.message)
    if (err.message.includes('不是学生') || err.message.includes('已属于其他班级')) {
      return sendError(res, 400, err.message)
    }
    console.error('添加学生失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

// 9. 从班级移除学生
async function handleRemoveStudent(req, res) {
  if (req.user.role !== 'admin') {
    return sendError(res, 403, '需要教务主任权限');
  }
  const { classId, studentId } = req.body
  const error = validateStudentOperation({ classId, studentId })
  if (error) return sendError(res, 400, error)

  try {
    const success = await classService.removeStudentFromClass(classId, studentId)
    if (!success) return sendError(res, 404, '该学生不在该班级中')
    // 如果移除成功，返回移除成功信息
    sendJson(res, 200, { message: '学生移除成功' })
  } catch (err) {
    console.error('移除学生失败:', err)
    sendError(res, 500, '服务器错误')
  }
}

module.exports = {
  'GET /api/classes': handleGetClasses,
  'POST /api/classes': handleCreateClass,
  'PUT /api/classes/:id': handleUpdateClass,
  'DELETE /api/classes/:id': handleDeleteClass,
  'POST /api/classes/bind-teacher': handleBindTeacher,
  'POST /api/classes/unbind-teacher': handleUnbindTeacher,
  'GET /api/classes/:id': handleGetClassDetail,
  'POST /api/classes/add-student': handleAddStudent,
  'POST /api/classes/remove-student': handleRemoveStudent
}