(function () {
  // 全局状态：当前班级列表
  let currentClasses = []
  let currentTeacherList = []
  let currentStudentList = []

  async function renderClassesView() {
    const user = getUser()
    const isAdmin = user.role === 'admin'

    // 如果非管理员，显示无权限
    if (!isAdmin) {
      return '<div class="error-page">您没有权限访问班级管理功能</div>'
    }

    // 构建基础HTML结构
    let html = `
        <div class="view-header">
            <h2>班级管理</h2>
            <button class="btn-primary" id="createClassBtn">+ 新建班级</button>
        </div>
        <div class="filter-bar">
            <select id="gradeFilter" class="filter-select">
                <option value="">全部年级</option>
                <!-- 动态生成年级选项 -->
            </select>
            <button class="btn-secondary" id="refreshBtn">刷新</button>
        </div>
        <div id="classTableContainer" class="table-responsive">
            <table class="data-table" id="classTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>班级名称</th>
                        <th>年级</th>
                        <th>班主任</th>
                        <th>学生人数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="classTableBody">
                    <tr><td colspan="6" class="loading-placeholder">加载中...</td></tr>
                </tbody>
            </table>
        </div>
        <div id="paginationContainer" class="pagination"></div>
    `

    // 异步获取数据后更新表格
    setTimeout(async () => {
      await loadClasses('')
      await loadTeachers()
      await loadGradeOptions()
      const gradeSelect = document.querySelector('#gradeFilter');
      if (gradeSelect && !gradeSelect.dataset.listener) {
        gradeSelect.addEventListener('change', (e) => loadClasses(e.target.value));
        gradeSelect.dataset.listener = 'true';
      }
    }, 10)
    return html
  }

  // 加载班级列表
  async function loadClasses(grade = '') {
    const tbody = document.querySelector('#classTableBody')
    if (!tbody) return
    tbody.innerHTML = `<tr><td colspan="6" class="loading-placeholder">加载中...</td></tr>`

    try {
      const params = grade ? { grade } : {}
      const response = await api.getClasses(params)
      currentClasses = response.data || response //根据实际返回结构调整

      if (currentClasses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-placeholder">暂无班级数据</td></tr>`
        return
      }

      // 并行获取每个班级的班主任和学生数
      const enrichedClasses = await Promise.all(currentClasses.map(async (cls) => {
        const detail = await api.getClassDetail(cls.id)
        return {
          ...cls,
          teacher: detail.teacher,
          studentCount: detail.students.length
        }
      }))


      currentClasses = enrichedClasses
      renderClassTable(enrichedClasses)
      await loadGradeOptions()
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="error-placeholder">加载失败: ${err.message}</td></tr>`
    }
  }

  function renderClassTable(classes) {
    const tbody = document.querySelector('#classTableBody')
    if (!tbody) return

    const rows = classes.map(cls => `
        <tr>
            <td>${cls.id}</td>
            <td>${cls.class_name}</td>
            <td>${cls.grade}</td>
            <td>${cls.teacher ? cls.teacher.real_name : '<span class="text-muted">未绑定</span>'}</td>
            <td>${cls.studentCount}</td>
            <td class="action-cell">
                <button class="btn-icon" data-action="view" data-id="${cls.id}" title="查看详情">👁️</button>
                <button class="btn-icon" data-action="edit" data-id="${cls.id}" title="编辑">✏️</button>
                <button class="btn-icon" data-action="bind" data-id="${cls.id}" title="绑定班主任">👨‍🏫</button>
                <button class="btn-icon" data-action="students" data-id="${cls.id}" title="管理学生">👥</button>
                <button class="btn-icon btn-danger" data-action="delete" data-id="${cls.id}" title="删除">🗑️</button>
            </td>
        </tr>
    `).join('')
    tbody.innerHTML = rows
    bindTableEvents()
  }

  // 加载教师列表（用于绑定班主任下拉）
  async function loadTeachers() {
    try {
      const users = await api.getUsers({ role: 'teacher' })
      currentTeacherList = users.data || users
    } catch (err) {
      console.error('加载教师列表失败:', err)
    }
  }

  // 加载年级筛选选项
  async function loadGradeOptions() {
    const select = document.querySelector('#gradeFilter')
    if (!select) return

    // 清空现有选项，保留第一个“全部年级”
    while (select.options.length > 1) {
      select.remove(1)
    }

    const grades = [...new Set(currentClasses.map(c => c.grade))].sort((a, b) => b - a)
    grades.forEach(g => {
      const option = document.createElement('option')
      option.value = g
      option.textContent = `${g}级`
      select.appendChild(option)
    })

  }

  // 绑定表格内按钮事件（事件代理）
  function bindTableEvents() {
    const tbody = document.querySelector('#classTableBody')
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button')
      if (!btn) return
      const action = btn.dataset.action
      const classId = btn.dataset.id

      switch (action) {
        case 'view': viewClassDetail(classId)
          break
        case 'edit': showEditClassModal(classId)
          break
        case 'bind': showBindTeacherModal(classId)
          break
        case 'students': showManageStudentModal(classId)
          break
        case 'delete': confirmDeleteClass(classId)
          break
      }
    })
  }

  // 新建班级
  document.addEventListener('click', (e) => {
    if (e.target.id === 'createClassBtn') {
      showCreateClassModal()
    }
    if (e.target.id === 'refreshBtn') {
      loadClasses(document.querySelector('#gradeFilter')?.value || '')
    }
  })

  // 弹窗：新建班级
  function showCreateClassModal() {
    const content = `
        <form id="classForm">
            <div class="form-group">
                <label>班级名称</label>
                <input type="text" name="className" required maxlength="50">
            </div>
            <div class="form-group">
                <label>年级（四位年份）</label>
                <input type="number" name="grade" required min="2000" max="2100" value="${new Date().getFullYear()}">
            </div>
        </form>
    `
    const modal = new Modal({
      title: '新建班级',
      content,
      onConfirm: async () => {
        const form = document.querySelector('#classForm')
        const formData = new FormData(form)
        const data = {
          className: formData.get('className'),
          grade: parseInt(formData.get('grade'))
        }
        try {
          await api.createClass(data)
          modal.hide()
          loadClasses()
          showToast('班级创建成功', 'success')
        } catch (err) {
          showToast(err.message || '班级创建失败', 'error')
        }
      }
    })
  }

  // 弹窗：编辑班级
  async function showEditClassModal(classId) {
    const id = parseInt(classId);
    const cls = currentClasses.find(c => c.id === id)
    if (!cls) {
      showToast('班级信息未找到', 'error')
    }
    console.log('编辑班级, ID:', id, '班级:', cls)
    const content = `
        <form id="editClassForm">
            <div class="form-group">
                <label>班级名称</label>
                <input type="text" name="className" value="${cls.class_name}" required>
            </div>
            <div class="form-group">
                <label>年级</label>
                <input type="number" name="grade" value="${cls.grade}" required>
            </div>
        </form>
    `
    const modal = new Modal({
      title: '编辑班级',
      content,
      onConfirm: async () => {
        const form = document.querySelector('#editClassForm')
        const formData = new FormData(form)
        const data = {
          className: formData.get('className'),
          grade: parseInt(formData.get('grade'))
        }
        try {
          await api.updateClass(classId, data)
          modal.hide()
          loadClasses()
          showToast('班级编辑成功', 'success')
        } catch (err) {
          showToast(err.message || '班级编辑失败', 'error')
        }
      }
    })
  }

  // 弹窗：绑定班主任
  function showBindTeacherModal(classId) {
    const id = parseInt(classId);
    const cls = currentClasses.find(c => c.id === id);
    if (!cls) {
      showToast('班级信息未找到', 'error');
      return;
    }
    const options = currentTeacherList.map(t => `<option value="${t.id}">${t.real_name} (${t.username})</option>`).join('')
    const content = `
        <p>当前班级：${cls.class_name} (${cls.grade}级)</p>
        <div class="form-group">
            <label>选择班主任</label>
            <select id="teacherSelect">${options}</select>
        </div>
    `
    const modal = new Modal({
      title: '绑定班主任',
      content,
      onConfirm: async () => {
        const teacherId = document.querySelector('#teacherSelect').value
        try {
          await api.bindTeacher(classId, teacherId)
          modal.hide()
          loadClasses()
          showToast('班主任绑定成功', 'success')
        } catch (err) {
          showToast(err.message || '班主任绑定失败', 'error')
        }
      }
    })
  }

  // 弹窗：管理学生
  async function showManageStudentModal(classId) {
    const id = parseInt(classId);
    const detail = await api.getClassDetail(id);
    const studentsInClass = detail.students;
    const allStudentsRes = await api.getUsers({ role: 'student' });
    const allStudents = allStudentsRes.data || allStudentsRes;  // 兼容返回格式
    const availableStudents = allStudents.filter(s => !studentsInClass.some(cs => cs.id === s.id))

    const studentListHtml = studentsInClass.map(s => `
        <li>${s.real_name} (${s.username}) 
            <button class="btn-small btn-remove" data-action="removeStudent" data-student="${s.id}">移除</button>
        </li>
    `).join('')
    const addOptions = availableStudents.map(s => `<option value="${s.id}">${s.real_name}</option>`).join('')

    const content = `
        <h4>当前学生</h4>
        <ul class="student-list">${studentListHtml || '<li>暂无学生</li>'}</ul>
        <h4>添加学生</h4>
        <select id="studentSelect">${addOptions}</select>
        <button id="addStudentBtn" class="btn-secondary">添加</button>
  `
    const modal = new Modal({
      title: `管理班级学生 - ${detail.class_name}`,
      content,
      onConfirm: async () => modal.hide() //无需全局确实，单独操作
    })

    //绑定内部事件
    document.querySelector('#addStudentBtn').addEventListener('click', async () => {
      const studentId = document.querySelector('#studentSelect').value
      try {
        await api.addStudentToClass(classId, studentId)
        modal.hide()
        showManageStudentModal(classId)
        showToast('学生添加成功', 'success')
      } catch (err) {
        showToast(err.message || '学生添加失败', 'error')
      }
    })

    document.querySelectorAll('[data-action="removeStudent"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const studentId = e.target.dataset.student
        if (!confirm('确定移除该学生吗？')) return
        try {
          await api.removeStudentFromClass(classId, studentId)
          modal.hide()
          showManageStudentModal(classId)
          showToast('学生移除成功', 'success')
        } catch (err) {
          showToast(err.message || '学生移除失败', 'error')
        }
      })
    })
  }

  // 删除班级确认
  function confirmDeleteClass(classId) {
    const id = parseInt(classId);
    const cls = currentClasses.find(c => c.id === id);
    if (!cls) {
      showToast('班级信息未找到', 'error');
      return;
    }
    const modal = new Modal({
      title: '确认删除',
      content: `<p>确定要删除班级 "${cls.class_name}" 吗？此操作不可逆，将级联删除相关绑定和成绩数据。</p>`,
      onConfirm: async () => {
        try {
          await api.deleteClass(classId)
          modal.hide()
          loadClasses()
          showToast('班级已删除', 'success')
        } catch (err) {
          showToast(err.message || '删除失败', 'error')
        }
      }
    })
  }

  // 查看详情
  async function viewClassDetail(classId) {
    try {
      const detail = await api.getClassDetail(classId);
      const teacherInfo = detail.teacher
        ? `${detail.teacher.real_name} (${detail.teacher.username})`
        : '未绑定班主任';
      const studentNames = detail.students.map(s => s.real_name).join('、 ') || '无';

      // 构建弹窗内容 HTML
      const content = `
            <div class="class-detail">
                <div class="detail-item">
                    <span class="detail-label">班级名称：</span>
                    <span class="detail-value">${detail.class_name}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">年级：</span>
                    <span class="detail-value">${detail.grade} 级</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">班主任：</span>
                    <span class="detail-value">${teacherInfo}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">班级学生：</span>
                    <span class="detail-value">${studentNames}</span>
                </div>
            </div>
        `;

      // 创建并显示 Modal（只有确定按钮）
      new Modal({
        title: `班级详情 - ${detail.class_name}`,
        content: content,
        showCancel: false,        // 不显示取消按钮
        confirmText: '确定',
        onConfirm: () => { }        // 空函数，仅用于关闭
      });
    } catch (err) {
      showToast('获取班级详情失败: ' + err.message, 'error');
    }
  }

  // 辅助函数：轻提示
  function showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  // 暴露给全局
  window.renderClassesView = renderClassesView
})();