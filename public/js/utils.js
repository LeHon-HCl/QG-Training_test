// 防抖函数
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流函数（可选，用于滚动等高频事件）
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// 按钮 loading 状态管理
function withLoading(btn, asyncFn) {
  return async function (...args) {
    if (btn.disabled) return;  // 防止重复点击
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '处理中...';
    try {
      const result = await asyncFn.apply(this, args);
      btn.disabled = false;
      btn.textContent = originalText;
      return result;
    } catch (err) {
      btn.disabled = false;
      btn.textContent = originalText;
      throw err;
    }
  };
}

// 暴露到全局（或作为模块导出）
window.debounce = debounce;
window.throttle = throttle;
window.withLoading = withLoading;