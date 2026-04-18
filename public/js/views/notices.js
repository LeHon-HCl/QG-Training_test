(function () {
  console.log('✅ notices.js 已加载')

  let currentNotices = [];
  let currentPagination = { page: 1, pageSize: 20, total: 0 };
  let currentFilters = { classId: '', isPublished: '' };

  // 主渲染函数
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
    `;

    // 筛选栏
    html += `
        <div class="filter-bar">
            ${!isStudent ? `
                <select id="filterClass" class="filter-select">
                    <option value="">全部班级</option>
                </select>
            ` : ''}
            ${!isStudent ? `
                <select id="filterPublished" class="filter-select">
                    <option value="">全部状态</option>
                    <option value="true">已发布</option>
                    <option value="false">未发布</option>
                </select>
            ` : ''}
            <button class="btn-secondary" id="searchNoticeBtn">查询</button>
            <button class="btn-secondary" id="resetNoticeFilterBtn">重置</button>
        </div>
    `;

    // 通知列表容器
    html += `
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

  // 加载班级选项（教师仅本班，教务全量）
  async function loadClassOptions() {
    const select = document.getElementById('filterClass')
    if (!select) return
    try {
      const res = await api.getClasses()
      // 兼容不同的返回结构：可能是数组，也可能包在 data 里，还可能是错误对象
      let classes = res.data || res
      // 确保 classes 是数组
      if (!Array.isArray(classes)) {
        classes = []
      }
      let html = '<option value="">全部班级</option>'
      classes.forEach(c => {
        html += `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`;
      });
      select.innerHTML = html
    } catch (err) {
      console.error('加载班级选项失败:', err);
      // 出错时给一个默认选项
      select.innerHTML = '<option value="">加载失败，请刷新</option>'
    }
  }

  // 加载通知数据
  async function loadNotices() {
    const container = document.getElementById('noticesListContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-placeholder">加载中...</div>';

    const params = {
      page: currentPagination.page || 1,
      pageSize: currentPagination.pageSize || 20,
      ...currentFilters
    };
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k];
    });

    try {
      const res = await api.getNotices(params);
      const data = res.data || res;
      currentNotices = data.data || data;
      currentPagination = data.pagination || { total: currentNotices.length };

      if (currentNotices.length === 0) {
        container.innerHTML = '<div class="empty-placeholder">暂无通知</div>';
        renderPagination();
        return;
      }

      renderNoticesList(currentNotices);
      renderPagination();
    } catch (err) {
      container.innerHTML = `<div class="error-placeholder">加载失败: ${err.message}</div>`;
    }
  }

  // 渲染通知卡片列表
  function renderNoticesList(notices) {
    const container = document.getElementById('noticesListContainer');
    const user = getUser();
    const isStudent = user.role === 'student';
    const isTeacher = user.role === 'teacher';

    const cards = notices.map(notice => {
      const isRead = notice.is_read || false;
      const readTime = notice.read_time ? new Date(notice.read_time).toLocaleString() : '';

      return `
            <div class="notice-card ${isStudent && !isRead ? 'unread' : ''}" data-id="${notice.id}">
                <div class="notice-header">
                    <h3 class="notice-title">
                        ${isStudent && !isRead ? '<span class="unread-badge">●</span>' : ''}
                        ${notice.title}
                    </h3>
                    <div class="notice-meta">
                        <span class="notice-class">${notice.class_name} (${notice.grade}级)</span>
                        <span class="notice-publisher">发布人：${notice.publisher_name}</span>
                        <span class="notice-time">${new Date(notice.created_at).toLocaleString()}</span>
                    </div>
                </div>
                <div class="notice-content">${notice.content}</div>
                <div class="notice-footer">
                    ${isStudent ? `
                        ${!isRead ? `<button class="btn-small btn-mark-read" data-id="${notice.id}">标记已读</button>` :
            `<span class="read-info">已读于 ${readTime}</span>`}
                    ` : ''}
                    ${isTeacher ? `
                        <div class="notice-actions">
                            <button class="btn-icon" data-action="edit" data-id="${notice.id}">✏️</button>
                            <button class="btn-icon" data-action="stats" data-id="${notice.id}">📊</button>
                            <button class="btn-icon btn-danger" data-action="delete" data-id="${notice.id}">🗑️</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = cards;
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
          loadNotices();
        }
      });
    });
  }

  // 事件绑定（代理）
  function bindEvents() {
    const container = document.getElementById('noticesListContainer');
    if (container) {
      container.addEventListener('click', async (e) => {
        // 标记已读
        const markBtn = e.target.closest('.btn-mark-read');
        if (markBtn) {
          const id = markBtn.dataset.id;
          await markAsRead(id);
          return;
        }
        // 操作按钮
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.dataset.action;
          const id = actionBtn.dataset.id;
          if (action === 'edit') showEditNoticeModal(id);
          else if (action === 'stats') showReadStatsModal(id);
          else if (action === 'delete') confirmDeleteNotice(id);
        }
      });
    }

    document.getElementById('createNoticeBtn')?.addEventListener('click', showCreateNoticeModal);
    document.getElementById('refreshNoticesBtn')?.addEventListener('click', () => loadNotices());
    document.getElementById('searchNoticeBtn')?.addEventListener('click', () => {
      currentFilters.classId = document.getElementById('filterClass')?.value || '';
      currentFilters.isPublished = document.getElementById('filterPublished')?.value || '';
      currentPagination.page = 1;
      loadNotices();
    });
    document.getElementById('resetNoticeFilterBtn')?.addEventListener('click', () => {
      const classEl = document.getElementById('filterClass');
      const pubEl = document.getElementById('filterPublished');
      if (classEl) classEl.value = '';
      if (pubEl) pubEl.value = '';
      currentFilters = { classId: '', isPublished: '' };
      currentPagination.page = 1;
      loadNotices();
    });
  }

  // 标记已读
  async function markAsRead(noticeId) {
    try {
      await api.markNoticeRead(noticeId);
      showToast('已标记为已读', 'success');
      loadNotices(); // 刷新列表更新状态
    } catch (err) {
      showToast(err.message || '操作失败', 'error');
    }
  }

  // 发布通知弹窗（自动获取班级）
  async function showCreateNoticeModal() {
    const user = getUser();

    // 教师身份：获取所管班级列表
    let classOptionsHtml = '';
    let defaultClassId = null;

    if (user.role === 'teacher') {
      try {
        const res = await api.getClasses();
        const classes = res.data || res;
        if (!Array.isArray(classes) || classes.length === 0) {
          showToast('您尚未管理任何班级，无法发布通知', 'error');
          return;
        }
        if (classes.length === 1) {
          // 只有一个班级，直接使用，无需下拉框
          defaultClassId = classes[0].id;
          classOptionsHtml = `<input type="hidden" name="classId" value="${defaultClassId}">`;
        } else {
          // 多个班级，提供下拉选择
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
    } else if (user.role === 'admin') {
      // 教务主任：需要手动选择班级
      try {
        const res = await api.getClasses();
        const classes = res.data || res;
        classOptionsHtml = `
                <div class="form-group">
                    <label>选择班级</label>
                    <select name="classId" required>
                        <option value="">请选择</option>
                        ${classes.map(c => `<option value="${c.id}">${c.class_name} (${c.grade}级)</option>`).join('')}
                    </select>
                </div>
            `;
      } catch (err) {
        showToast('获取班级列表失败', 'error');
        return;
      }
    }

    const content = `
        <form id="noticeForm">
            ${classOptionsHtml}
            <div class="form-group">
                <label>标题</label>
                <input type="text" name="title" maxlength="200" required>
            </div>
            <div class="form-group">
                <label>内容</label>
                <textarea name="content" rows="6" required></textarea>
            </div>
        </form>
    `;

    const modal = new Modal({
      title: '发布通知',
      content,
      onConfirm: async () => {
        const form = document.getElementById('noticeForm');
        const formData = new FormData(form);
        const data = {
          title: formData.get('title'),
          content: formData.get('content')
        };

        const classIdInput = formData.get('classId');
        if (!classIdInput) {
          showToast('请选择班级', 'error');
          return;
        }
        data.classId = parseInt(classIdInput);

        try {
          await api.createNotice(data);
          modal.hide();
          loadNotices();
          showToast('通知发布成功', 'success');
        } catch (err) {
          showToast(err.message || '发布失败', 'error');
        }
      }
    });
  }

  // 编辑通知弹窗
  async function showEditNoticeModal(noticeId) {
    const notice = currentNotices.find(n => n.id == noticeId);
    if (!notice) return;

    const content = `
        <form id="editNoticeForm">
            <div class="form-group">
                <label>标题</label>
                <input type="text" name="title" value="${notice.title}" maxlength="200" required>
            </div>
            <div class="form-group">
                <label>内容</label>
                <textarea name="content" rows="6" required>${notice.content}</textarea>
            </div>
        </form>
    `;

    const modal = new Modal({
      title: '编辑通知',
      content,
      onConfirm: async () => {
        const form = document.getElementById('editNoticeForm');
        const formData = new FormData(form);
        const data = {
          title: formData.get('title'),
          content: formData.get('content')
        };
        try {
          await api.updateNotice(noticeId, data);
          modal.hide();
          loadNotices();
          showToast('通知更新成功', 'success');
        } catch (err) {
          showToast(err.message || '更新失败', 'error');
        }
      }
    });
  }

  // 查看已读统计弹窗
  async function showReadStatsModal(noticeId) {
    const modal = new Modal({
      title: '已读统计',
      content: '<div class="loading-placeholder">加载中...</div>',
      onConfirm: () => modal.hide()
    });

    try {
      const res = await api.getNoticeReadStatus(noticeId);
      const stats = res.data || res;
      const readListHtml = stats.readList.map(u => `<li>${u.real_name} (${u.username}) - ${new Date(u.read_time).toLocaleString()}</li>`).join('');
      const unreadListHtml = stats.unreadList.map(u => `<li>${u.real_name} (${u.username})</li>`).join('');

      const content = `
            <div class="stats-summary">
                <p>总人数：${stats.total} | 已读：${stats.readCount} | 未读：${stats.unreadCount}</p>
            </div>
            <div class="stats-detail">
                <h4>已读名单 (${stats.readCount})</h4>
                <ul class="student-list">${readListHtml || '<li>暂无</li>'}</ul>
                <h4>未读名单 (${stats.unreadCount})</h4>
                <ul class="student-list">${unreadListHtml || '<li>暂无</li>'}</ul>
            </div>
        `;
      modal.content = content;
      // 重新渲染弹窗内容
      document.querySelector('.modal-body').innerHTML = content;
    } catch (err) {
      document.querySelector('.modal-body').innerHTML = `<div class="error-placeholder">加载失败: ${err.message}</div>`;
    }
  }

  // 删除确认
  function confirmDeleteNotice(noticeId) {
    const modal = new Modal({
      title: '确认删除',
      content: '<p>确定要删除这条通知吗？此操作不可逆。</p>',
      onConfirm: async () => {
        try {
          await api.deleteNotice(noticeId);
          modal.hide();
          loadNotices();
          showToast('通知已删除', 'success');
        } catch (err) {
          showToast(err.message || '删除失败', 'error');
        }
      }
    });
  }

  // Toast 提示（与其他视图共用）
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  window.renderNoticesView = renderNoticesView;
})();