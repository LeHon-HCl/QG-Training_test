(function () {
  let currentScores = [];
  let currentPagination = { page: 1, pageSize: 10, total: 0 };
  let currentFilters = { classId: '', subject: '', studentId: '', startDate: '', endDate: '' };
  const subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];

  // ========== 主渲染 ==========
  async function renderScoresView() {
    const user = getUser();
    const isAdmin = user.role === 'admin';
    const isTeacher = user.role === 'teacher';
    const isStudent = user.role === 'student';

    let html = `
            <div class="view-header">
                <h2>成绩管理</h2>
                <div class="header-actions">
                    ${!isStudent ? `
                        <button class="btn-primary" id="addScoreBtn">+ 添加成绩</button>
                        <button class="btn-secondary" id="batchAddBtn">批量添加</button>
                        <button class="btn-secondary" id="exportScoresBtn">导出CSV</button>
                    ` : ''}
                    <button class="btn-secondary" id="refreshScoresBtn">刷新</button>
                </div>
            </div>
            ${!isStudent ? `
                <div class="stats-cards" id="statsContainer">
                    <div class="stat-card"><span class="stat-label">平均分</span><span class="stat-value" id="avgScore">--</span></div>
                    <div class="stat-card"><span class="stat-label">最高分</span><span class="stat-value" id="maxScore">--</span></div>
                    <div class="stat-card"><span class="stat-label">最低分</span><span class="stat-value" id="minScore">--</span></div>
                    <div class="stat-card"><span class="stat-label">及格率</span><span class="stat-value" id="passRate">--</span></div>
                </div>
            ` : ''}
            <div class="filter-bar">
                ${!isStudent ? `<select id="filterClass" class="filter-select"><option value="">全部班级</option></select>` : ''}
                <select id="filterSubject" class="filter-select">
                    <option value="">全部科目</option>
                    ${subjectOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
                ${!isStudent ? `<input type="text" id="filterStudentId" placeholder="学号" class="filter-input" style="width:100px;">` : ''}
                <input type="date" id="filterStartDate" class="filter-input" placeholder="开始日期">
                <input type="date" id="filterEndDate" class="filter-input" placeholder="结束日期">
                <button class="btn-secondary" id="searchBtn">查询</button>
                <button class="btn-secondary" id="resetFilterBtn">重置</button>
            </div>
            <div id="scoresTableContainer" class="table-responsive">
                <table class="data-table" id="scoresTable">
                    <thead>
                        <tr>
                            ${!isStudent ? '<th>班级</th>' : ''}
                            <th>姓名</th><th>学号</th><th>科目</th><th>分数</th><th>考试日期</th>
                            ${!isStudent ? '<th>操作</th>' : ''}
                        </tr>
                    </thead>
                    <tbody id="scoresTableBody">
                        <tr><td colspan="${!isStudent ? '7' : '5'}" class="loading-placeholder">加载中...</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="paginationContainer" class="pagination"></div>
        `;

    setTimeout(async () => {
      if (!isStudent) await loadClassOptions();
      await loadScores();
      bindEvents(); // 每次渲染后都绑定事件
    }, 10);
    return html;
  }

  // ========== 班级选项加载 ==========
  async function loadClassOptions() {
    const select = document.getElementById('filterClass');
    if (!select) return;
    try {
      const res = await api.getClasses();
      let classes = res.data || res;
      if (!Array.isArray(classes)) classes = [];
      select.innerHTML = '<option value="">全部班级</option>';
      classes.forEach(c => {
        select.appendChild(new Option(`${c.class_name} (${c.grade}级)`, c.id));
      });
    } catch (err) {
      select.innerHTML = '<option value="">加载失败</option>';
    }
  }

  // ========== 成绩数据加载 ==========
  async function loadScores() {
    const tbody = document.getElementById('scoresTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>`;

    const params = { page: currentPagination.page, pageSize: currentPagination.pageSize, ...currentFilters };
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });

    try {
      const res = await api.getScores(params);
      const data = res.data || res;
      currentScores = data.data || data;
      currentPagination = data.pagination || { total: currentScores.length };

      if (currentScores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-placeholder">暂无成绩数据</td></tr>`;
        updateStats([]);
        return;
      }

      renderScoresTable(currentScores);
      renderPagination('paginationContainer', currentPagination, (newPage) => {
        currentPagination.page = newPage;
        loadScores();
      });

      const user = getUser();
      if (user.role !== 'student') loadStatistics();
      else updateStats([]);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="error-placeholder">加载失败: ${err.message}</td></tr>`;
    }
  }

  // ========== 表格渲染 ==========
  function renderScoresTable(scores) {
    const user = getUser();
    const canEdit = user.role !== 'student';

    const columns = [];
    if (canEdit) columns.push({ key: 'class_name', label: '班级' });
    columns.push({ key: 'student_name', label: '姓名' });
    columns.push({ key: 'student_id', label: '学号' });
    columns.push({ key: 'subject', label: '科目' });
    columns.push({ key: 'score', label: '分数' });
    columns.push({ key: 'exam_date', label: '考试日期' });

    renderTable('scoresTableBody', scores, columns, {
      rowRenderer: (item) => {
        let actionCell = '';
        if (canEdit) {
          actionCell = `
                        <td class="action-cell">
                            <button class="btn-icon" data-action="edit" data-id="${item.id}">✏️</button>
                            <button class="btn-icon btn-danger" data-action="delete" data-id="${item.id}">🗑️</button>
                        </td>
                    `;
        }
        const cells = [];
        if (canEdit) cells.push(`<td>${item.class_name || ''}</td>`);
        cells.push(`<td>${item.student_name || ''}</td>`);
        cells.push(`<td>${item.student_id}</td>`);
        cells.push(`<td>${item.subject}</td>`);
        cells.push(`<td>${item.score}</td>`);
        cells.push(`<td>${item.exam_date?.split('T')[0] || ''}</td>`);
        if (canEdit) cells.push(actionCell);
        return `<tr>${cells.join('')}</tr>`;
      }
    });
  }

  // ========== 统计 ==========
  async function loadStatistics() {
    const params = { ...currentFilters };
    delete params.page; delete params.pageSize;
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });
    try {
      const res = await api.getScoreStatistics(params);
      const stats = res.data || res;
      updateStats(stats);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }

  function updateStats(stats) {
    const avgEl = document.getElementById('avgScore'), maxEl = document.getElementById('maxScore'),
      minEl = document.getElementById('minScore'), passEl = document.getElementById('passRate');
    if (!avgEl || !maxEl || !minEl || !passEl) return;
    if (!stats || stats.length === 0) {
      avgEl.textContent = maxEl.textContent = minEl.textContent = passEl.textContent = '--';
      return;
    }
    const first = stats[0];
    avgEl.textContent = first.avg_score ? parseFloat(first.avg_score).toFixed(1) : '--';
    maxEl.textContent = first.max_score || '--';
    minEl.textContent = first.min_score || '--';
    passEl.textContent = first.pass_rate ? `${first.pass_rate}%` : '--';
  }

  // ========== 表格点击处理 ==========
  async function handleTableClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action, id = btn.dataset.id;
    if (action === 'edit') showEditScoreModal(id);
    else if (action === 'delete') confirmDeleteScore(id);
  }

  // ========== 全局事件处理（委托） ==========
  function handleGlobalClick(e) {
    const target = e.target;
    if (target.id === 'addScoreBtn') { showAddScoreModal(); return; }
    if (target.id === 'batchAddBtn') { showBatchAddModal(); return; }
    if (target.id === 'exportScoresBtn') {
      const params = { ...currentFilters };
      Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });
      api.exportScores(params);
      return;
    }
    if (target.id === 'refreshScoresBtn') { loadScores(); return; }
    if (target.id === 'searchBtn') {
      currentFilters.classId = document.getElementById('filterClass')?.value || '';
      currentFilters.subject = document.getElementById('filterSubject')?.value;
      currentFilters.studentId = document.getElementById('filterStudentId')?.value;
      currentFilters.startDate = document.getElementById('filterStartDate')?.value;
      currentFilters.endDate = document.getElementById('filterEndDate')?.value;
      currentPagination.page = 1;
      loadScores();
      return;
    }
    if (target.id === 'resetFilterBtn') {
      ['filterClass', 'filterSubject', 'filterStudentId', 'filterStartDate', 'filterEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      currentFilters = { classId: '', subject: '', studentId: '', startDate: '', endDate: '' };
      currentPagination.page = 1;
      loadScores();
      return;
    }
  }

  // ========== 事件绑定（委托方式，解决重复绑定失效问题） ==========
  function bindEvents() {
    // 全局按钮委托（只绑定一次）
    if (!window._scoresGlobalBound) {
      document.addEventListener('click', handleGlobalClick);
      window._scoresGlobalBound = true;
    }

    // 表格内操作（编辑/删除），使用事件代理，每次重新绑定前移除旧的
    const tbody = document.getElementById('scoresTableBody');
    if (tbody) {
      tbody.removeEventListener('click', handleTableClick);
      tbody.addEventListener('click', handleTableClick);
    }
  }

  // ========== 弹窗：添加成绩 ==========
  async function showAddScoreModal() {
    const user = getUser();
    let classSelectHtml = '';
    if (user.role === 'admin') {
      try {
        const res = await api.getClasses();
        const classes = res.data || res;
        classSelectHtml = `
                    <div class="form-group">
                        <label>选择班级 <span style="color:red">*</span></label>
                        <select id="scoreClassId" name="classId" required>
                            <option value="">-- 请选择班级 --</option>
                            ${classes.map(c => `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`).join('')}
                        </select>
                    </div>
                `;
      } catch (err) { showToast('获取班级列表失败', 'error'); return; }
    }

    const content = `
            <form id="scoreForm">
                ${classSelectHtml}
                <div class="form-group"><label>学生学号 <span style="color:red">*</span></label><input type="number" name="studentId" required min="1"></div>
                <div class="form-group"><label>科目 <span style="color:red">*</span></label><select name="subject" required>${subjectOptions.map(s => `<option value="${s}">${s}</option>`).join('')}</select></div>
                <div class="form-group"><label>分数 <span style="color:red">*</span></label><input type="number" step="0.1" name="score" min="0" max="150" required></div>
                <div class="form-group"><label>考试日期 <span style="color:red">*</span></label><input type="date" name="examDate" required value="${new Date().toISOString().split('T')[0]}"></div>
            </form>
        `;
    new Modal({
      title: '添加成绩', content,
      onConfirm: async () => {
        const form = document.getElementById('scoreForm');
        const formData = new FormData(form);
        const classIdVal = formData.get('classId'), studentIdVal = formData.get('studentId');
        if (user.role === 'admin' && (!classIdVal || classIdVal === '')) { showToast('请选择班级', 'error'); return false; }
        if (!studentIdVal || parseInt(studentIdVal) <= 0) { showToast('请输入有效的学生学号', 'error'); return false; }
        const data = {
          studentId: parseInt(studentIdVal),
          subject: formData.get('subject'),
          score: parseFloat(formData.get('score')),
          examDate: formData.get('examDate')
        };
        if (user.role === 'admin') data.classId = parseInt(classIdVal);
        try {
          await api.addScore(data);
          loadScores();
          showToast('成绩添加成功', 'success');
        } catch (err) {
          showToast(err.message || '添加失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 批量添加 ==========
  function showBatchAddModal() {
    const content = `
            <p>每行一条记录，格式：<strong>学号,科目,分数,考试日期(YYYY-MM-DD)</strong></p>
            <textarea id="batchScoresInput" rows="8" placeholder="例如:&#10;1001,数学,95,2025-01-15&#10;1002,语文,88,2025-01-16" style="width:100%;"></textarea>
        `;
    new Modal({
      title: '批量添加成绩', content,
      onConfirm: async () => {
        const text = document.getElementById('batchScoresInput').value.trim();
        if (!text) return;
        const lines = text.split('\n');
        const scores = [];
        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          const parts = line.split(',').map(s => s.trim());
          if (parts.length !== 4) { showToast(`格式错误：${line}`, 'error'); return false; }
          scores.push({ studentId: parseInt(parts[0]), subject: parts[1], score: parseFloat(parts[2]), examDate: parts[3] });
        }
        try {
          await api.addScoresBatch(scores);
          loadScores();
          showToast(`成功添加 ${scores.length} 条成绩`, 'success');
        } catch (err) {
          showToast(err.message || '批量添加失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 编辑成绩 ==========
  async function showEditScoreModal(scoreId) {
    const score = currentScores.find(s => s.id == scoreId);
    if (!score) return;
    const content = `
            <form id="editScoreForm">
                <div class="form-group"><label>学生：${score.student_name} (${score.student_id})</label></div>
                <div class="form-group"><label>科目</label><select name="subject" required>${subjectOptions.map(s => `<option value="${s}" ${s === score.subject ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
                <div class="form-group"><label>分数</label><input type="number" step="0.1" name="score" value="${score.score}" min="0" max="150" required></div>
                <div class="form-group"><label>考试日期</label><input type="date" name="examDate" value="${score.exam_date?.split('T')[0] || ''}" required></div>
            </form>
        `;
    new Modal({
      title: '编辑成绩', content,
      onConfirm: async () => {
        const form = document.getElementById('editScoreForm');
        const formData = new FormData(form);
        const data = {
          subject: formData.get('subject'),
          score: parseFloat(formData.get('score')),
          examDate: formData.get('examDate')
        };
        try {
          await api.updateScore(scoreId, data);
          loadScores();
          showToast('成绩更新成功', 'success');
        } catch (err) {
          showToast(err.message || '更新失败', 'error');
          return false;
        }
      }
    });
  }

  // ========== 删除确认 ==========
  function confirmDeleteScore(scoreId) {
    new Modal({
      title: '确认删除', content: '<p>确定要删除这条成绩记录吗？此操作不可逆。</p>',
      onConfirm: async () => {
        try {
          await api.deleteScore(scoreId);
          loadScores();
          showToast('成绩已删除', 'success');
        } catch (err) {
          showToast(err.message || '删除失败', 'error');
          return false;
        }
      }
    });
  }

  window.renderScoresView = renderScoresView;
})();