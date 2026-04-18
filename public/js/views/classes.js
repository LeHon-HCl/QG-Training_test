(function () {
  let currentClasses = [];
  let currentTeacherList = [];

  // ========== 辅助函数 ==========
  function findClassById(classId) {
    const id = parseInt(classId);
    return currentClasses.find(c => c.id === id);
  }

  // ========== 主渲染 ==========
  async function renderClassesView() {
    const user = getUser();
    if (user.role !== 'admin') {
      return '<div class="error-page">您没有权限访问班级管理功能</div>';
    }

    let html = `
      <div class="view-header">
        <h2>班级管理</h2>
        <button class="btn-primary" id="createClassBtn">+ 新建班级</button>
      </div>
      <div class="filter-bar">
        <select id="gradeFilter" class="filter-select">
          <option value="">全部年级</option>
        </select>
        <button class="btn-secondary" id="refreshBtn">刷新</button>
      </div>
      <div id="classTableContainer" class="table-responsive">
        <table class="data-table" id="classTable">
          <thead>
            <tr><th>ID</th><th>班级名称</th><th>年级</th><th>班主任</th><th>学生人数</th><th>操作</th></tr>
          </thead>
          <tbody id="classTableBody">
            <tr><td colspan="6" class="loading-placeholder">加载中...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    setTimeout(async () => {
      await loadClasses('');
      await loadTeachers();
      await loadGradeOptions();
      bindEvents();
    }, 10);
    return html;
  }

  // ========== 数据加载 ==========
  async function loadClasses(grade = '') {
    const tbody = document.querySelector('#classTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" class="loading-placeholder">加载中...</td></tr>`;

    try {
      const params = grade ? { grade } : {};
      const response = await api.getClasses(params);
      currentClasses = response.data || response;

      if (currentClasses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-placeholder">暂无班级数据</td></tr>`;
        return;
      }

      renderClassTable(currentClasses);
      await loadGradeOptions();

      const enrichedClasses = await Promise.all(currentClasses.map(async (cls) => {
        try {
          const detail = await api.getClassDetail(cls.id);
          return { ...cls, teacher: detail.teacher, studentCount: detail.students.length };
        } catch {
          return { ...cls, teacher: null, studentCount: 0 };
        }
      }));

      currentClasses = enrichedClasses;
      renderClassTable(enrichedClasses);
      await loadGradeOptions();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="error-placeholder">加载失败: ${err.message}</td></tr>`;
    }
  }

  async function loadTeachers() {
    try {
      const users = await api.getUsers({ role: 'teacher' });
      currentTeacherList = users.data || users;
    } catch (err) {
      console.error('加载教师列表失败:', err);
    }
  }

  async function loadGradeOptions() {
    const select = document.querySelector('#gradeFilter');
    if (!select) return;

    while (select.options.length > 1) select.remove(1);

    const grades = [...new Set(currentClasses.map(c => c.grade))].sort((a, b) => b - a);
    grades.forEach(g => select.appendChild(new Option(`${g}级`, g)));
  }

  // ========== 表格渲染 ==========
  function renderClassTable(classes) {
    const tbody = document.querySelector('#classTableBody');
    if (!tbody) return;

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
          <button class="btn-icon" data-action="unbind" data-id="${cls.id}" title="解绑班主任">🔓</button>
          <button class="btn-icon" data-action="students" data-id="${cls.id}" title="管理学生">👥</button>
          <button class="btn-icon btn-danger" data-action="delete" data-id="${cls.id}" title="删除">🗑️</button>
        </td>
      </tr>
    `).join('');
    tbody.innerHTML = rows;
  }

  // ========== 事件绑定 ==========
  function bindEvents() {
    // 表格内操作（事件代理）
    const tbody = document.querySelector('#classTableBody');
    if (tbody) {
      tbody.removeEventListener('click', handleTableClick);
      tbody.addEventListener('click', handleTableClick);
    }

    // 全局顶部按钮委托（只绑定一次）
    if (!window._classesGlobalBound) {
      document.addEventListener('click', handleGlobalClick);
      window._classesGlobalBound = true;
    }

    // 年级筛选
    const gradeSelect = document.querySelector('#gradeFilter');
    if (gradeSelect) {
      gradeSelect.removeEventListener('change', handleGradeChange);
      gradeSelect.addEventListener('change', handleGradeChange);
    }
  }

  async function handleTableClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action, classId = btn.dataset.id;
    switch (action) {
      case 'view': viewClassDetail(classId); break;
      case 'edit': showEditClassModal(classId); break;
      case 'bind': showBindTeacherModal(classId); break;
      case 'unbind': confirmUnbindTeacher(classId); break;
      case 'students': showManageStudentModal(classId); break;
      case 'delete': confirmDeleteClass(classId); break;
    }
  }

  function handleGlobalClick(e) {
    if (e.target.id === 'createClassBtn') {
      showCreateClassModal();
    }
    if (e.target.id === 'refreshBtn') {
      const grade = document.querySelector('#gradeFilter')?.value || '';
      loadClasses(grade);
    }
  }

  function handleGradeChange(e) {
    loadClasses(e.target.value);
  }

  // ========== 弹窗：新建班级 ==========
  function showCreateClassModal() {
    const content = `
      <form id="classForm">
        <div class="form-group"><label>班级名称</label><input type="text" name="className" required maxlength="50"></div>
        <div class="form-group"><label>年级（四位年份）</label><input type="number" name="grade" required min="2000" max="2100" value="${new Date().getFullYear()}"></div>
      </form>
    `;
    const modal = new Modal({
      title: '新建班级', content,
      onConfirm: async () => {
        const form = document.getElementById('classForm');
        const formData = new FormData(form);
        const data = { className: formData.get('className'), grade: parseInt(formData.get('grade')) };
        try {
          await api.createClass(data);
          modal.hide();
          loadClasses();
          showToast('班级创建成功', 'success');
        } catch (err) {
          showToast(err.message || '班级创建失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 弹窗：编辑班级 ==========
  async function showEditClassModal(classId) {
    const cls = findClassById(classId);
    if (!cls) { showToast('班级信息未找到', 'error'); return; }

    const content = `
      <form id="editClassForm">
        <div class="form-group"><label>班级名称</label><input type="text" name="className" value="${cls.class_name}" required></div>
        <div class="form-group"><label>年级</label><input type="number" name="grade" value="${cls.grade}" required></div>
      </form>
    `;
    const modal = new Modal({
      title: '编辑班级', content,
      onConfirm: async () => {
        const form = document.getElementById('editClassForm');
        const formData = new FormData(form);
        const data = { className: formData.get('className'), grade: parseInt(formData.get('grade')) };
        try {
          await api.updateClass(classId, data);
          modal.hide();
          loadClasses();
          showToast('班级编辑成功', 'success');
        } catch (err) {
          showToast(err.message || '班级编辑失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 绑定班主任 ==========
  function showBindTeacherModal(classId) {
    const cls = findClassById(classId);
    if (!cls) { showToast('班级信息未找到', 'error'); return; }

    const options = currentTeacherList.map(t => `<option value="${t.id}">${t.real_name} (${t.username})</option>`).join('');
    const content = `
      <p>当前班级：${cls.class_name} (${cls.grade}级)</p>
      <div class="form-group"><label>选择班主任</label><select id="teacherSelect">${options}</select></div>
    `;
    const modal = new Modal({
      title: '绑定班主任', content,
      onConfirm: async () => {
        const teacherId = document.getElementById('teacherSelect').value;
        try {
          await api.bindTeacher(classId, teacherId);
          modal.hide();
          loadClasses();
          showToast('班主任绑定成功', 'success');
        } catch (err) {
          showToast(err.message || '班主任绑定失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 管理学生 ==========
  async function showManageStudentModal(classId) {
    const detail = await api.getClassDetail(classId);
    const studentsInClass = detail.students;
    const allStudentsRes = await api.getUsers({ role: 'student' });
    const allStudents = allStudentsRes.data || allStudentsRes;
    const availableStudents = allStudents.filter(s => !studentsInClass.some(cs => cs.id === s.id));

    const studentListHtml = studentsInClass.map(s => `
      <li>${s.real_name} (${s.username}) 
        <button class="btn-small btn-remove" data-action="removeStudent" data-student="${s.id}">移除</button>
      </li>
    `).join('');
    const addOptions = availableStudents.map(s => `<option value="${s.id}">${s.real_name}</option>`).join('');

    const content = `
      <h4>当前学生</h4>
      <ul class="student-list">${studentListHtml || '<li>暂无学生</li>'}</ul>
      <h4>添加学生</h4>
      <select id="studentSelect">${addOptions}</select>
      <button id="addStudentBtn" class="btn-secondary">添加</button>
    `;
    const modal = new Modal({ title: `管理班级学生 - ${detail.class_name}`, content });

    document.getElementById('addStudentBtn').addEventListener('click', async () => {
      const studentId = document.getElementById('studentSelect').value;
      try {
        await api.addStudentToClass(classId, studentId);
        modal.hide();
        showManageStudentModal(classId);
        showToast('学生添加成功', 'success');
      } catch (err) {
        showToast(err.message || '学生添加失败', 'error');
      }
    });

    document.querySelectorAll('[data-action="removeStudent"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const studentId = e.target.dataset.student;
        if (!confirm('确定移除该学生吗？')) return;
        try {
          await api.removeStudentFromClass(classId, studentId);
          modal.hide();
          showManageStudentModal(classId);
          showToast('学生移除成功', 'success');
        } catch (err) {
          showToast(err.message || '学生移除失败', 'error');
        }
      });
    });
  }

  // ========== 删除班级 ==========
  function confirmDeleteClass(classId) {
    const cls = findClassById(classId);
    if (!cls) { showToast('班级信息未找到', 'error'); return; }

    const modal = new Modal({
      title: '确认删除',
      content: `<p>确定要删除班级 "${cls.class_name}" 吗？此操作不可逆，将级联删除相关绑定和成绩数据。</p>`,
      onConfirm: async () => {
        try {
          await api.deleteClass(classId);
          modal.hide();
          loadClasses();
          showToast('班级已删除', 'success');
        } catch (err) {
          showToast(err.message || '删除失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 查看详情 ==========
  async function viewClassDetail(classId) {
    try {
      const detail = await api.getClassDetail(classId);
      const teacherInfo = detail.teacher ? `${detail.teacher.real_name} (${detail.teacher.username})` : '未绑定班主任';
      const studentNames = detail.students.map(s => s.real_name).join('、 ') || '无';

      new Modal({
        title: `班级详情 - ${detail.class_name}`,
        content: `
          <div class="class-detail">
            <div class="detail-item"><span class="detail-label">班级名称：</span><span class="detail-value">${detail.class_name}</span></div>
            <div class="detail-item"><span class="detail-label">年级：</span><span class="detail-value">${detail.grade} 级</span></div>
            <div class="detail-item"><span class="detail-label">班主任：</span><span class="detail-value">${teacherInfo}</span></div>
            <div class="detail-item"><span class="detail-label">班级学生：</span><span class="detail-value">${studentNames}</span></div>
          </div>
        `,
        showCancel: false
      });
    } catch (err) {
      showToast('获取班级详情失败: ' + err.message, 'error');
    }
  }

  // ========== 解绑班主任 ==========
  function confirmUnbindTeacher(classId) {
    const cls = findClassById(classId);
    if (!cls) { showToast('班级信息未找到', 'error'); return; }
    if (!cls.teacher) { showToast('该班级尚未绑定班主任', 'info'); return; }

    const modal = new Modal({
      title: '确认解绑',
      content: `<p>确定要解除班级 "${cls.class_name}" 的班主任 "${cls.teacher.real_name}" 吗？</p>`,
      onConfirm: async () => {
        try {
          await api.unbindTeacher(classId);
          modal.hide();
          loadClasses();
          showToast('班主任解绑成功', 'success');
        } catch (err) {
          showToast(err.message || '解绑失败', 'error');
          return false;
        }
      }
    });
  }

  window.renderClassesView = renderClassesView;
})();