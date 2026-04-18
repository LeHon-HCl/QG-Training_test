(function () {
  let currentScores = [];
  let currentPagination = { page: 1, pageSize: 10, total: 0 };
  let currentFilters = { classId: '', subject: '', studentId: '', startDate: '', endDate: '' };
  let classOptions = [];    // 班主任/教务可选的班级列表
  let subjectOptions = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];

  // 主渲染函数
  async function renderScoresView() {
    const user = getUser();
    const isAdmin = user.role === 'admin';
    const isTeacher = user.role === 'teacher';
    const isStudent = user.role === 'student';

    // 基础布局
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
    `;

    // 统计卡片（仅教师/教务可见）
    if (!isStudent) {
      html += `
            <div class="stats-cards" id="statsContainer">
                <div class="stat-card">
                    <span class="stat-label">平均分</span>
                    <span class="stat-value" id="avgScore">--</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">最高分</span>
                    <span class="stat-value" id="maxScore">--</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">最低分</span>
                    <span class="stat-value" id="minScore">--</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">及格率</span>
                    <span class="stat-value" id="passRate">--</span>
                </div>
            </div>
        `;
    }

    // 筛选栏
    html += `
        <div class="filter-bar">
            ${!isStudent ? `
                <select id="filterClass" class="filter-select">
                    <option value="">全部班级</option>
                </select>
            ` : ''}
            <select id="filterSubject" class="filter-select">
                <option value="">全部科目</option>
                ${subjectOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            ${!isStudent ? `
                <input type="text" id="filterStudentId" placeholder="学号" class="filter-input" style="width:100px;">
            ` : ''}
            <input type="date" id="filterStartDate" class="filter-input" placeholder="开始日期">
            <input type="date" id="filterEndDate" class="filter-input" placeholder="结束日期">
            <button class="btn-secondary" id="searchBtn">查询</button>
            <button class="btn-secondary" id="resetFilterBtn">重置</button>
        </div>
    `;

    // 表格容器
    html += `
        <div id="scoresTableContainer" class="table-responsive">
            <table class="data-table" id="scoresTable">
                <thead>
                    <tr>
                        ${!isStudent ? '<th>班级</th>' : ''}
                        <th>姓名</th>
                        <th>学号</th>
                        <th>科目</th>
                        <th>分数</th>
                        <th>考试日期</th>
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

    // 异步初始化
    setTimeout(async () => {
      if (!isStudent) {
        await loadClassOptions();
      }
      await loadScores();
      bindEvents();
    }, 10);

    return html;
  }

  // 加载班级选项（教师仅加载所管班级，教务全量）
  async function loadClassOptions() {
    const select = document.getElementById('filterClass')
    if (!select) return
    try {
      const res = await api.getClasses()
      // 兼容多种返回格式：可能是数组，也可能是 { data: [] } 或直接对象
      let classes = Array.isArray(res) ? res : (res.data || []);
      if (!Array.isArray(classes)) classes = []

      select.innerHTML = '<option value="">全部班级</option>'
      classes.forEach(c => {
        const option = document.createElement('option')
        option.value = c.id
        option.textContent = `${c.class_name} (${c.grade}级)`
        select.appendChild(option)
      })
    } catch (err) {
      console.error('加载班级选项失败:', err)
      select.innerHTML = '<option value="">加载失败</option>'
    }
  }

  // 加载成绩数据
  async function loadScores() {
    const tbody = document.getElementById('scoresTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>`;

    // 收集筛选条件
    const params = {
      page: currentPagination.page,
      pageSize: currentPagination.pageSize,
      ...currentFilters
    };
    // 清理空值
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
    });

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
      renderPagination();
      // 加载统计数据（仅教师/教务）
      const user = getUser();
      if (user.role !== 'student') {
        loadStatistics();
      } else {
        updateStats([]);
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="error-placeholder">加载失败: ${err.message}</td></tr>`;
    }
  }

  // 渲染表格
  function renderScoresTable(scores) {
    const tbody = document.getElementById('scoresTableBody');
    const user = getUser();
    const canEdit = user.role !== 'student';

    const rows = scores.map(item => `
        <tr>
            ${canEdit ? `<td>${item.class_name || ''}</td>` : ''}
            <td>${item.student_name || ''}</td>
            <td>${item.student_id}</td>
            <td>${item.subject}</td>
            <td>${item.score}</td>
            <td>${item.exam_date?.split('T')[0] || ''}</td>
            ${canEdit ? `
                <td class="action-cell">
                    <button class="btn-icon" data-action="edit" data-id="${item.id}" title="编辑">✏️</button>
                    <button class="btn-icon btn-danger" data-action="delete" data-id="${item.id}" title="删除">🗑️</button>
                </td>
            ` : ''}
        </tr>
    `).join('');

    tbody.innerHTML = rows;
  }

  // 分页渲染
  function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    const { page, pageSize, total } = currentPagination;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }
    let html = `<div class="pagination-controls">`;
    html += `<button ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>`;
    html += `</div><span class="pagination-info">共 ${total} 条记录</span>`;
    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const newPage = parseInt(btn.dataset.page);
        if (!isNaN(newPage) && newPage !== page) {
          currentPagination.page = newPage;
          loadScores();
        }
      });
    });
  }

  // 加载统计数据
  async function loadStatistics() {
    const params = { ...currentFilters };
    delete params.page; delete params.pageSize;
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k];
    });
    try {
      const res = await api.getScoreStatistics(params);
      const stats = res.data || res;
      updateStats(stats);
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  }

  function updateStats(stats) {
    const avgEl = document.getElementById('avgScore')
    const maxEl = document.getElementById('maxScore')
    const minEl = document.getElementById('minScore')
    const passEl = document.getElementById('passRate')

    // 如果任一元素不存在，直接返回（例如学生视图）
    if (!avgEl || !maxEl || !minEl || !passEl) return

    if (!stats || stats.length === 0) {
      document.getElementById('avgScore').textContent = '--';
      document.getElementById('maxScore').textContent = '--';
      document.getElementById('minScore').textContent = '--';
      document.getElementById('passRate').textContent = '--';
      return;
    }
    // 若有多条（按班级/科目分组），可聚合或显示第一条；这里简单取第一条
    const first = stats[0];
    document.getElementById('avgScore').textContent = first.avg_score ? parseFloat(first.avg_score).toFixed(1) : '--';
    document.getElementById('maxScore').textContent = first.max_score || '--';
    document.getElementById('minScore').textContent = first.min_score || '--';
    document.getElementById('passRate').textContent = first.pass_rate ? `${first.pass_rate}%` : '--';
  }

  // 事件绑定（代理）
  function bindEvents() {
    const tbody = document.getElementById('scoresTableBody');
    if (tbody) {
      tbody.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if (action === 'edit') showEditScoreModal(id);
        else if (action === 'delete') confirmDeleteScore(id);
      });
    }

    document.getElementById('addScoreBtn')?.addEventListener('click', () => showAddScoreModal());
    document.getElementById('batchAddBtn')?.addEventListener('click', showBatchAddModal);
    document.getElementById('exportScoresBtn')?.addEventListener('click', () => {
      const params = { ...currentFilters };
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === null) delete params[k];
      });
      api.exportScores(params);
    });
    document.getElementById('refreshScoresBtn')?.addEventListener('click', () => loadScores());
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      currentFilters.classId = document.getElementById('filterClass')?.value || '';
      currentFilters.subject = document.getElementById('filterSubject')?.value;
      currentFilters.studentId = document.getElementById('filterStudentId')?.value;
      currentFilters.startDate = document.getElementById('filterStartDate')?.value;
      currentFilters.endDate = document.getElementById('filterEndDate')?.value;
      currentPagination.page = 1;
      loadScores();
    });
    document.getElementById('resetFilterBtn')?.addEventListener('click', () => {
      ['filterClass', 'filterSubject', 'filterStudentId', 'filterStartDate', 'filterEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      currentFilters = { classId: '', subject: '', studentId: '', startDate: '', endDate: '' };
      currentPagination.page = 1;
      loadScores();
    });
  }

  // 弹窗：添加成绩
  async function showAddScoreModal() {
    const user = getUser();
    // 获取班级列表（用于下拉）
    let classSelectHtml = '';
    if (user.role === 'admin') {
      const res = await api.getClasses();
      const classes = res.data || res;
      classSelectHtml = `
            <select id="scoreClassId" required>
                <option value="">选择班级</option>
                ${classes.map(c => `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`).join('')}
            </select>
        `;
    }

    const content = `
        <form id="scoreForm">
            ${user.role === 'admin' ? `
                <div class="form-group">
                    <label>班级</label>
                    ${classSelectHtml}
                </div>
            ` : ''}
            <div class="form-group">
                <label>学生学号</label>
                <input type="number" name="studentId" required>
            </div>
            <div class="form-group">
                <label>科目</label>
                <select name="subject" required>
                    ${subjectOptions.map(s => `<option value="${s}">${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>分数</label>
                <input type="number" step="0.1" name="score" min="0" max="150" required>
            </div>
            <div class="form-group">
                <label>考试日期</label>
                <input type="date" name="examDate" required>
            </div>
        </form>
    `;

    const modal = new Modal({
      title: '添加成绩',
      content,
      onConfirm: async () => {
        const form = document.getElementById('scoreForm');
        const formData = new FormData(form);
        const data = {
          studentId: parseInt(formData.get('studentId')),
          subject: formData.get('subject'),
          score: parseFloat(formData.get('score')),
          examDate: formData.get('examDate')
        };
        if (user.role === 'admin') {
          data.classId = parseInt(formData.get('scoreClassId'));
        }
        try {
          await api.addScore(data);
          modal.hide();
          loadScores();
          showToast('成绩添加成功', 'success');
        } catch (err) {
          showToast(err.message || '添加失败', 'error');
        }
      }
    });
  }

  // 批量添加弹窗（简化版：固定格式输入）
  function showBatchAddModal() {
    const content = `
        <p>每行一条记录，格式：<strong>学号,科目,分数,考试日期(YYYY-MM-DD)</strong></p>
        <textarea id="batchScoresInput" rows="8" placeholder="例如:&#10;1001,数学,95,2025-01-15&#10;1002,语文,88,2025-01-16" style="width:100%;"></textarea>
    `;
    const modal = new Modal({
      title: '批量添加成绩',
      content,
      onConfirm: async () => {
        const text = document.getElementById('batchScoresInput').value.trim();
        if (!text) return;
        const lines = text.split('\n');
        const scores = [];
        for (let line of lines) {
          line = line.trim();
          if (!line) continue;
          const parts = line.split(',').map(s => s.trim());
          if (parts.length !== 4) {
            showToast(`格式错误：${line}`, 'error');
            return;
          }
          scores.push({
            studentId: parseInt(parts[0]),
            subject: parts[1],
            score: parseFloat(parts[2]),
            examDate: parts[3]
          });
        }
        try {
          await api.addScoresBatch(scores);
          modal.hide();
          loadScores();
          showToast(`成功添加 ${scores.length} 条成绩`, 'success');
        } catch (err) {
          showToast(err.message || '批量添加失败', 'error');
        }
      }
    });
  }

  // 编辑成绩
  async function showEditScoreModal(scoreId) {
    const score = currentScores.find(s => s.id == scoreId);
    if (!score) return;
    const content = `
        <form id="editScoreForm">
            <div class="form-group">
                <label>学生：${score.student_name} (${score.student_id})</label>
            </div>
            <div class="form-group">
                <label>科目</label>
                <select name="subject" required>
                    ${subjectOptions.map(s => `<option value="${s}" ${s === score.subject ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>分数</label>
                <input type="number" step="0.1" name="score" value="${score.score}" min="0" max="150" required>
            </div>
            <div class="form-group">
                <label>考试日期</label>
                <input type="date" name="examDate" value="${score.exam_date?.split('T')[0] || ''}" required>
            </div>
        </form>
    `;
    const modal = new Modal({
      title: '编辑成绩',
      content,
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
          modal.hide();
          loadScores();
          showToast('成绩更新成功', 'success');
        } catch (err) {
          showToast(err.message || '更新失败', 'error');
        }
      }
    });
  }

  // 删除确认
  function confirmDeleteScore(scoreId) {
    const modal = new Modal({
      title: '确认删除',
      content: '<p>确定要删除这条成绩记录吗？此操作不可逆。</p>',
      onConfirm: async () => {
        try {
          await api.deleteScore(scoreId);
          modal.hide();
          loadScores();
          showToast('成绩已删除', 'success');
        } catch (err) {
          showToast(err.message || '删除失败', 'error');
        }
      }
    });
  }

  // Toast 提示（与 classes 共用，可提取到公共）
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // 挂载全局
  window.renderScoresView = renderScoresView;
})();


