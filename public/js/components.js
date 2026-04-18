// ==================== 组件库 ====================
// 本文件提供可复用的 UI 组件，包括 Modal、Toast、表格渲染器、分页组件等。
// 所有组件均挂载到 window 对象，供各视图直接调用。

// ==================== Modal 弹窗组件 ====================
/**
 * Modal 弹窗
 * @param {Object} options 配置项
 * @param {string} options.title 弹窗标题
 * @param {string} options.content 弹窗内容 HTML
 * @param {boolean} [options.showCancel=true] 是否显示取消按钮
 * @param {string} [options.confirmText='确定'] 确定按钮文字
 * @param {string} [options.cancelText='取消'] 取消按钮文字
 * @param {Function} [options.onConfirm] 确定回调，返回 false 可阻止关闭
 * @param {Function} [options.onCancel] 取消回调
 * 
 * @example
 * new Modal({
 *     title: '提示',
 *     content: '<p>确定删除吗？</p>',
 *     onConfirm: async () => {
 *         await api.deleteXxx();
 *         // 返回 false 可阻止弹窗关闭
 *     }
 * });
 */
class Modal {
  constructor(options) {
    this.title = options.title || '提示';
    this.content = options.content || '';
    this.showCancel = options.showCancel !== false;
    this.confirmText = options.confirmText || '确定';
    this.cancelText = options.cancelText || '取消';
    this.onConfirm = options.onConfirm || (() => { });
    this.onCancel = options.onCancel || null;
    this.render();
  }

  render() {
    const container = document.getElementById('modalContainer');
    if (!container) return;

    container.innerHTML = `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${this.title}</h3>
                    </div>
                    <div class="modal-body">
                        ${this.content}
                    </div>
                    <div class="modal-footer">
                        ${this.showCancel ? `<button class="btn-cancel">${this.cancelText}</button>` : ''}
                        <button class="btn-confirm">${this.confirmText}</button>
                    </div>
                </div>
            </div>
        `;
    container.classList.remove('hidden');

    const overlay = container.querySelector('.modal-overlay');
    const confirmBtn = container.querySelector('.btn-confirm');
    const cancelBtn = container.querySelector('.btn-cancel');

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.hide();
        if (this.onCancel) this.onCancel();
      }
    });

    // 确定按钮（支持异步和阻止关闭）
    confirmBtn.addEventListener('click', async () => {
      if (confirmBtn.disabled) return;
      const originalText = confirmBtn.textContent;
      confirmBtn.disabled = true;
      confirmBtn.textContent = '处理中...';
      try {
        const result = await this.onConfirm();
        if (result !== false) {
          this.hide();
        }
      } catch (err) {
        // 错误已在外部处理
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
      }
    });

    // 取消按钮
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hide();
        if (this.onCancel) this.onCancel();
      });
    }
  }

  hide() {
    const container = document.getElementById('modalContainer');
    if (container) {
      container.classList.add('hidden');
      container.innerHTML = '';
    }
  }
}

// ==================== Toast 轻提示 ====================
/**
 * 显示轻提示
 * @param {string} message 提示文字
 * @param {string} type 类型：'success' | 'error' | 'info'
 * 
 * @example
 * showToast('操作成功', 'success');
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==================== 表格渲染辅助 ====================
/**
 * 渲染数据表格
 * @param {string} tbodyId 表格 tbody 元素的 ID
 * @param {Array} data 数据数组
 * @param {Array} columns 列配置 [{ key: 'id', label: 'ID' }, { key: 'name', label: '姓名' }]
 * @param {Object} options 可选配置
 * @param {boolean} options.emptyText 无数据时的提示文字
 * @param {Function} options.rowRenderer 自定义行渲染函数，参数为 (item, index)
 * 
 * @example
 * renderTable('scoreTableBody', scores, [
 *     { key: 'student_name', label: '姓名' },
 *     { key: 'subject', label: '科目' },
 *     { key: 'score', label: '分数' }
 * ]);
 */
function renderTable(tbodyId, data, columns, options = {}) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (!data || data.length === 0) {
    const colspan = columns.length;
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="empty-placeholder">${options.emptyText || '暂无数据'}</td></tr>`;
    return;
  }

  let html = '';
  if (options.rowRenderer) {
    html = data.map((item, index) => options.rowRenderer(item, index)).join('');
  } else {
    html = data.map(item => {
      const cells = columns.map(col => `<td>${item[col.key] ?? ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
  }
  tbody.innerHTML = html;
}

// ==================== 分页组件 ====================
/**
 * 渲染分页控件
 * @param {string} containerId 容器元素 ID
 * @param {Object} pagination 分页信息 { page, pageSize, total }
 * @param {Function} onPageChange 页码变化回调，参数为新页码
 * 
 * @example
 * renderPagination('paginationContainer', currentPagination, (newPage) => {
 *     currentPagination.page = newPage;
 *     loadData();
 * });
 */
function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { page, pageSize, total } = pagination;
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
        onPageChange(newPage);
      }
    });
  });
}

// ==================== 通知卡片渲染器 ====================
/**
 * 渲染通知卡片列表
 * @param {string} containerId 容器元素 ID
 * @param {Array} notices 通知数组
 * @param {Object} options 配置项
 * @param {boolean} options.showActions 是否显示操作按钮（班主任可见）
 * @param {Function} options.onMarkRead 标记已读回调，参数为 noticeId
 * @param {Function} options.onEdit 编辑回调
 * @param {Function} options.onStats 统计回调
 * @param {Function} options.onDelete 删除回调
 * 
 * @example
 * renderNoticeCards('noticesListContainer', notices, {
 *     showActions: isTeacher,
 *     onMarkRead: (id) => markAsRead(id),
 *     onEdit: (id) => showEditModal(id),
 *     onStats: (id) => showStatsModal(id),
 *     onDelete: (id) => confirmDelete(id)
 * });
 */
function renderNoticeCards(containerId, notices, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!notices || notices.length === 0) {
    container.innerHTML = '<div class="empty-placeholder">暂无通知</div>';
    return;
  }

  const cards = notices.map(notice => {
    const isRead = notice.is_read || false;
    const readTime = notice.read_time ? new Date(notice.read_time).toLocaleString() : '';

    return `
            <div class="notice-card ${!isRead ? 'unread' : ''}" data-id="${notice.id}">
                <div class="notice-header">
                    <h3 class="notice-title">
                        ${!isRead ? '<span class="unread-badge">●</span>' : ''}
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
                    ${!options.showActions ? `
                        ${!isRead ? `<button class="btn-small btn-mark-read" data-id="${notice.id}">标记已读</button>` :
          `<span class="read-info">已读于 ${readTime}</span>`}
                    ` : ''}
                    ${options.showActions ? `
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

  // 事件代理
  container.addEventListener('click', (e) => {
    const markBtn = e.target.closest('.btn-mark-read');
    if (markBtn) {
      const id = markBtn.dataset.id;
      if (options.onMarkRead) options.onMarkRead(id);
      return;
    }

    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      const action = actionBtn.dataset.action;
      const id = actionBtn.dataset.id;
      if (action === 'edit' && options.onEdit) options.onEdit(id);
      else if (action === 'stats' && options.onStats) options.onStats(id);
      else if (action === 'delete' && options.onDelete) options.onDelete(id);
    }
  });
}

// ==================== 暴露全局 ====================
window.Modal = Modal;
window.showToast = showToast;
window.renderTable = renderTable;
window.renderPagination = renderPagination;
window.renderNoticeCards = renderNoticeCards;