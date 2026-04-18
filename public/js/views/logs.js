// public/js/views/logs.js

(function () {
  let currentLogs = [];
  let currentPagination = { page: 1, pageSize: 20, total: 0 };
  let currentFilters = {
    operationType: '',
    operatorId: '',
    startDate: '',
    endDate: ''
  };

  // 操作类型选项（与后端记录保持一致）
  const operationTypes = [
    { value: '', label: '全部类型' },
    { value: 'LOGIN', label: '登录' },
    { value: 'CREATE_CLASS', label: '创建班级' },
    { value: 'UPDATE_CLASS', label: '修改班级' },
    { value: 'DELETE_CLASS', label: '删除班级' },
    { value: 'BIND_TEACHER', label: '绑定班主任' },
    { value: 'UNBIND_TEACHER', label: '解绑班主任' },
    { value: 'ADD_STUDENT', label: '添加学生' },
    { value: 'REMOVE_STUDENT', label: '移除学生' },
    { value: 'CREATE_SCORE', label: '添加成绩' },
    { value: 'UPDATE_SCORE', label: '修改成绩' },
    { value: 'DELETE_SCORE', label: '删除成绩' },
    { value: 'CREATE_NOTICE', label: '发布通知' },
    { value: 'UPDATE_NOTICE', label: '编辑通知' },
    { value: 'DELETE_NOTICE', label: '删除通知' }
  ];

  // 主渲染函数
  async function renderLogsView() {
    const user = getUser();
    const isAdmin = user.role === 'admin';
    const isTeacher = user.role === 'teacher';

    // 权限检查（学生已在路由层拦截，但再加一层防御）
    if (!isAdmin && !isTeacher) {
      return `<div class="error-page">您没有权限访问操作日志</div>`;
    }

    let html = `
            <div class="view-header">
                <h2>操作日志</h2>
                <button class="btn-secondary" id="refreshLogsBtn">刷新</button>
            </div>

            <!-- 筛选栏 -->
            <div class="filter-bar">
                <select id="filterOperationType" class="filter-select">
                    ${operationTypes.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
                </select>
                <input type="text" id="filterOperatorId" class="filter-input" placeholder="操作人ID" style="width:100px;">
                <input type="date" id="filterStartDate" class="filter-input" placeholder="开始日期">
                <input type="date" id="filterEndDate" class="filter-input" placeholder="结束日期">
                <button class="btn-secondary" id="searchLogsBtn">查询</button>
                <button class="btn-secondary" id="resetLogsFilterBtn">重置</button>
            </div>

            <!-- 日志表格 -->
            <div id="logsTableContainer" class="table-responsive">
                <table class="data-table" id="logsTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>操作人</th>
                            <th>操作类型</th>
                            <th>操作内容</th>
                            <th>目标类型</th>
                            <th>目标ID</th>
                            <th>操作时间</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- 分页 -->
            <div id="paginationContainer" class="pagination"></div>
        `;

    setTimeout(async () => {
      await loadLogs();
      bindEvents();
    }, 10);

    return html;
  }

  // 加载日志数据
  async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>`;

    const params = {
      page: currentPagination.page,
      pageSize: currentPagination.pageSize,
      ...currentFilters
    };
    // 清理空值
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k];
    });

    try {
      const res = await api.getLogs(params);
      const data = res.data || res;
      currentLogs = data.data || data;
      currentPagination = data.pagination || { total: currentLogs.length };

      if (currentLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-placeholder">暂无操作日志</td></tr>`;
        renderPagination();
        return;
      }

      renderLogsTable(currentLogs);
      renderPagination();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="error-placeholder">加载失败: ${err.message}</td></tr>`;
    }
  }

  // 渲染表格
  function renderLogsTable(logs) {
    const tbody = document.getElementById('logsTableBody');
    const rows = logs.map(log => {
      const typeLabel = operationTypes.find(t => t.value === log.operation_type)?.label || log.operation_type;
      return `
                <tr>
                    <td>${log.id}</td>
                    <td>${log.operator_name} (ID:${log.operator_id})</td>
                    <td>${typeLabel}</td>
                    <td>${log.content || '-'}</td>
                    <td>${log.target_type || '-'}</td>
                    <td>${log.target_id || '-'}</td>
                    <td>${new Date(log.created_at).toLocaleString()}</td>
                </tr>
            `;
    }).join('');

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
          loadLogs();
        }
      });
    });
  }

  // 事件绑定
  function bindEvents() {
    document.getElementById('refreshLogsBtn')?.addEventListener('click', () => loadLogs());
    document.getElementById('searchLogsBtn')?.addEventListener('click', () => {
      currentFilters.operationType = document.getElementById('filterOperationType')?.value || '';
      currentFilters.operatorId = document.getElementById('filterOperatorId')?.value.trim();
      currentFilters.startDate = document.getElementById('filterStartDate')?.value;
      currentFilters.endDate = document.getElementById('filterEndDate')?.value;
      currentPagination.page = 1;
      loadLogs();
    });
    document.getElementById('resetLogsFilterBtn')?.addEventListener('click', () => {
      document.getElementById('filterOperationType').value = '';
      document.getElementById('filterOperatorId').value = '';
      document.getElementById('filterStartDate').value = '';
      document.getElementById('filterEndDate').value = '';
      currentFilters = { operationType: '', operatorId: '', startDate: '', endDate: '' };
      currentPagination.page = 1;
      loadLogs();
    });
  }

  // 挂载全局
  window.renderLogsView = renderLogsView;
})();