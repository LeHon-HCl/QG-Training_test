(function () {
  console.log('✅ notices.js 已加载');

  let currentNotices = [];
  let currentPagination = { page: 1, pageSize: 20, total: 0 };
  let currentFilters = { classId: '', isPublished: '' };

  // ========== 主渲染 ==========
  async function renderNoticesView() {
    const user = getUser();
    const isAdmin = user.role === 'admin';
    const isTeacher = user.role === 'teacher';
    const isStudent = user.role === 'student';

    let html = `
            <div class="view-header">
                <h2>通知中心</h2>
                <div class="header-actions">
                    ${isTeacher ? `<button class="btn-primary" id="createNoticeBtn">+ 发布通知</button>` : ''}
                    <button class="btn-secondary" id="refreshNoticesBtn">刷新</button>
                </div>
            </div>
            <div class="filter-bar">
                ${!isStudent ? `
                    <select id="filterClass" class="filter-select"><option value="">全部班级</option></select>
                    <select id="filterPublished" class="filter-select">
                        <option value="">全部状态</option>
                        <option value="true">已发布</option>
                        <option value="false">未发布</option>
                    </select>
                ` : ''}
                <button class="btn-secondary" id="searchNoticeBtn">查询</button>
                <button class="btn-secondary" id="resetNoticeFilterBtn">重置</button>
            </div>
            <div id="noticesListContainer" class="notices-list">
                <div class="loading-placeholder">加载中...</div>
            </div>
            <div id="paginationContainer" class="pagination"></div>
        `;

    setTimeout(async () => {
      if (!isStudent) await loadClassOptions();
      await loadNotices();
      bindEvents();
    }, 10);

    return html;
  }

  // ========== 数据加载 ==========
  async function loadClassOptions() {
    const select = document.getElementById('filterClass');
    if (!select) return;
    try {
      const res = await api.getClasses();
      let classes = res.data || res;
      if (!Array.isArray(classes)) classes = [];
      let html = '<option value="">全部班级</option>';
      classes.forEach(c => html += `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`);
      select.innerHTML = html;
    } catch (err) {
      select.innerHTML = '<option value="">加载失败，请刷新</option>';
    }
  }

  async function loadNotices() {
    const container = document.getElementById('noticesListContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-placeholder">加载中...</div>';

    const params = { page: currentPagination.page || 1, pageSize: currentPagination.pageSize || 20, ...currentFilters };
    Object.keys(params).forEach(k => { if (params[k] === '' || params[k] === null) delete params[k]; });

    try {
      const res = await api.getNotices(params);
      const data = res.data || res;
      currentNotices = data.data || data;
      currentPagination = data.pagination || { total: currentNotices.length };

      // ✅ 使用组件渲染卡片
      const user = getUser();
      renderNoticeCards('noticesListContainer', currentNotices, {
        showActions: user.role === 'teacher',
        onMarkRead: (id) => markAsRead(id),
        onEdit: (id) => showEditNoticeModal(id),
        onStats: (id) => showReadStatsModal(id),
        onDelete: (id) => confirmDeleteNotice(id)
      });

      // ✅ 使用组件渲染分页
      renderPagination('paginationContainer', currentPagination, (newPage) => {
        currentPagination.page = newPage;
        loadNotices();
      });
    } catch (err) {
      container.innerHTML = `<div class="error-placeholder">加载失败: ${err.message}</div>`;
    }
  }

  // ========== 事件绑定 ==========
  let debouncedSearch = null;
  function bindEvents() {
    const searchBtn = document.getElementById('searchNoticeBtn');
    if (searchBtn) {
      if (!debouncedSearch) {
        debouncedSearch = debounce(() => {
          currentFilters.classId = document.getElementById('filterClass')?.value || '';
          currentFilters.isPublished = document.getElementById('filterPublished')?.value || '';
          currentPagination.page = 1;
          loadNotices();
        }, 300);
      }
      searchBtn.addEventListener('click', debouncedSearch);
    }

    document.getElementById('resetNoticeFilterBtn')?.addEventListener('click', () => {
      document.getElementById('filterClass').value = '';
      document.getElementById('filterPublished').value = '';
      currentFilters = { classId: '', isPublished: '' };
      currentPagination.page = 1;
      loadNotices();
    });

    document.getElementById('refreshNoticesBtn')?.addEventListener('click', debounce(() => loadNotices(), 300));
    document.getElementById('createNoticeBtn')?.addEventListener('click', showCreateNoticeModal);
  }

  // ========== 业务操作 ==========
  async function markAsRead(noticeId) {
    try {
      await api.markNoticeRead(noticeId);
      showToast('已标记为已读', 'success');
      loadNotices();
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  }

  async function showCreateNoticeModal() {
    const user = getUser();
    let classOptionsHtml = '';
    try {
      const res = await api.getClasses();
      const classes = res.data || res;
      if (!Array.isArray(classes) || classes.length === 0) {
        showToast('您尚未管理任何班级，无法发布通知', 'error');
        return;
      }
      if (user.role === 'teacher' && classes.length === 1) {
        classOptionsHtml = `<input type="hidden" name="classId" value="${classes[0].id}">`;
      } else {
        classOptionsHtml = `
                    <div class="form-group">
                        <label>选择班级</label>
                        <select name="classId" required>
                            <option value="">请选择</option>
                            ${classes.map(c => `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`).join('')}
                        </select>
                    </div>
                `;
      }
    } catch (err) {
      showToast('获取班级列表失败', 'error');
      return;
    }

    const content = `
            <form id="noticeForm">
                ${classOptionsHtml}
                <div class="form-group"><label>标题</label><input type="text" name="title" maxlength="200" required></div>
                <div class="form-group"><label>内容</label><textarea name="content" rows="6" required></textarea></div>
            </form>
        `;
    new Modal({
      title: '发布通知',
      content,
      onConfirm: async () => {
        const form = document.getElementById('noticeForm');
        const formData = new FormData(form);
        const data = { title: formData.get('title'), content: formData.get('content') };
        const classId = formData.get('classId');
        if (!classId) return showToast('请选择班级', 'error');
        data.classId = parseInt(classId);
        try {
          await api.createNotice(data);
          loadNotices();
          showToast('通知发布成功', 'success');
        } catch (err) {
          showToast(err.message || '发布失败', 'error');
          return false;
        }
      }
    });
  }

  async function showEditNoticeModal(noticeId) {
    const notice = currentNotices.find(n => n.id == noticeId);
    if (!notice) return;
    const content = `
            <form id="editNoticeForm">
                <div class="form-group"><label>标题</label><input type="text" name="title" value="${notice.title}" maxlength="200" required></div>
                <div class="form-group"><label>内容</label><textarea name="content" rows="6" required>${notice.content}</textarea></div>
            </form>
        `;
    new Modal({
      title: '编辑通知',
      content,
      onConfirm: async () => {
        const form = document.getElementById('editNoticeForm');
        const formData = new FormData(form);
        const data = { title: formData.get('title'), content: formData.get('content') };
        try {
          await api.updateNotice(noticeId, data);
          loadNotices();
          showToast('通知更新成功', 'success');
        } catch (err) {
          showToast(err.message || '更新失败', 'error');
          return false;
        }
      }
    });
  }

  async function showReadStatsModal(noticeId) {
    const modal = new Modal({ title: '已读统计', content: '<div class="loading-placeholder">加载中...</div>' });
    try {
      const res = await api.getNoticeReadStatus(noticeId);
      const stats = res.data || res;
      const readHtml = stats.readList.map(u => `<li>${u.real_name} (${u.username}) - ${new Date(u.read_time).toLocaleString()}</li>`).join('');
      const unreadHtml = stats.unreadList.map(u => `<li>${u.real_name} (${u.username})</li>`).join('');
      const content = `
                <div class="stats-summary"><p>总人数：${stats.total} | 已读：${stats.readCount} | 未读：${stats.unreadCount}</p></div>
                <div class="stats-detail">
                    <h4>已读名单 (${stats.readCount})</h4><ul class="student-list">${readHtml || '<li>暂无</li>'}</ul>
                    <h4>未读名单 (${stats.unreadCount})</h4><ul class="student-list">${unreadHtml || '<li>暂无</li>'}</ul>
                </div>
            `;
      document.querySelector('.modal-body').innerHTML = content;
    } catch (err) {
      document.querySelector('.modal-body').innerHTML = `<div class="error-placeholder">加载失败: ${err.message}</div>`;
    }
  }

  function confirmDeleteNotice(noticeId) {
    new Modal({
      title: '确认删除',
      content: '<p>确定要删除这条通知吗？此操作不可逆。</p>',
      onConfirm: async () => {
        try {
          await api.deleteNotice(noticeId);
          loadNotices();
          showToast('通知已删除', 'success');
        } catch (err) {
          showToast(err.message || '删除失败', 'error');
          return false;
        }
      }
    });
  }

  window.renderNoticesView = renderNoticesView;
})();