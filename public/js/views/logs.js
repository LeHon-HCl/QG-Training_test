(function () {
  let currentLogs = [];
  let currentPagination = { page: 1, pageSize: 20, total: 0 };
  let currentFilters = { operationType: '', operatorId: '', startDate: '', endDate: '' };

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

  // ========== 主渲染 ==========
  async function renderLogsView() {
    const user = getUser();
    if (!['admin', 'teacher'].includes(user.role)) {
      return '<div class="error-page">您没有权限访问操作日志</div>';
    }

    const html = `
      <div class="view-header">
        <h2>操作日志</h2>
        <button class="btn-secondary" id="refreshLogsBtn">刷新</button>
      </div>
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
      <div id="logsTableContainer" class="table-responsive">
        <table class="data-table" id="logsTable">
          <thead>
            <tr><th>ID</th><th>操作人</th><th>操作类型</th><th>操作内容</th><th>目标类型</th><th>目标ID</th><th>操作时间</th></tr>
          </thead>
          <tbody id="logsTableBody">
            <tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>
          </tbody>
        </table>
      </div>
      <div id="paginationContainer" class="pagination"></div>
    `;

    setTimeout(async () => {
      await loadLogs();
      bindEvents(); // 每次渲染后都调用，内部使用委托，只绑定一次全局事件
    }, 10);
    return html;
  }

  // ========== 数据加载 ==========
  async function loadLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="loading-placeholder">加载中...</td></tr>`;

    const params = { page: currentPagination.page || 1, pageSize: currentPagination.pageSize || 20, ...currentFilters };
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });

    try {
      const res = await api.getLogs(params);
      let logs = [], pagination = { page: 1, pageSize: 20, total: 0, totalPages: 0 };
      if (res && typeof res === 'object') {
        logs = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        pagination = res.pagination || { ...pagination, total: logs.length };
      }
      currentLogs = logs;
      currentPagination = pagination;

      if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty-placeholder">暂无操作日志</td></tr>`;
        renderPagination('paginationContainer', currentPagination, (newPage) => { currentPagination.page = newPage; loadLogs(); });
        return;
      }

      renderTable('logsTableBody', logs, [
        { key: 'id', label: 'ID' },
        { key: 'operator_name', label: '操作人' },
        { key: 'operation_type', label: '操作类型' },
        { key: 'content', label: '操作内容' },
        { key: 'target_type', label: '目标类型' },
        { key: 'target_id', label: '目标ID' },
        { key: 'created_at', label: '操作时间' }
      ], {
        rowRenderer: (log) => {
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
        }
      });

      renderPagination('paginationContainer', currentPagination, (newPage) => {
        currentPagination.page = newPage;
        loadLogs();
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="error-placeholder">加载失败: ${err.message}</td></tr>`;
    }
  }

  // ========== 全局事件处理（委托） ==========
  function handleGlobalClick(e) {
    const target = e.target;

    // 刷新按钮
    if (target.id === 'refreshLogsBtn') {
      loadLogs();
      return;
    }

    // 查询按钮（防抖已在绑定处处理，这里直接调用 debounce 包装的函数）
    // 注意：debounce 函数需全局可用，我们在绑定事件时创建防抖函数并保存引用
    if (target.id === 'searchLogsBtn') {
      if (window._debouncedSearchLogs) {
        window._debouncedSearchLogs();
      }
      return;
    }

    // 重置按钮
    if (target.id === 'resetLogsFilterBtn') {
      document.getElementById('filterOperationType').value = '';
      document.getElementById('filterOperatorId').value = '';
      document.getElementById('filterStartDate').value = '';
      document.getElementById('filterEndDate').value = '';
      currentFilters = { operationType: '', operatorId: '', startDate: '', endDate: '' };
      currentPagination.page = 1;
      loadLogs();
      return;
    }
  }

  // ========== 事件绑定（委托方式） ==========
  function bindEvents() {
    // 全局按钮委托（只绑定一次）
    if (!window._logsGlobalBound) {
      document.addEventListener('click', handleGlobalClick);
      window._logsGlobalBound = true;
    }

    // 创建防抖查询函数（只创建一次）
    if (!window._debouncedSearchLogs) {
      window._debouncedSearchLogs = debounce(() => {
        currentFilters.operationType = document.getElementById('filterOperationType')?.value || '';
        currentFilters.operatorId = document.getElementById('filterOperatorId')?.value.trim();
        currentFilters.startDate = document.getElementById('filterStartDate')?.value;
        currentFilters.endDate = document.getElementById('filterEndDate')?.value;
        currentPagination.page = 1;
        loadLogs();
      }, 300);
    }
  }

  window.renderLogsView = renderLogsView;
})();