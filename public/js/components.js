class Modal {
  constructor(options) {
    this.title = options.title || '提示';
    this.content = options.content || '';
    this.showCancel = options.showCancel !== false;  // 默认显示取消按钮
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

    // 确定按钮
    confirmBtn.addEventListener('click', async () => {
      // 如果 onConfirm 返回 false 或抛出异常，则不关闭弹窗
      try {
        const result = await this.onConfirm();
        if (result !== false) {
          this.hide();
        }
      } catch (err) {
        // 错误已在 onConfirm 内部处理，不关闭弹窗
      }
    });

    // 取消按钮（如果存在）
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