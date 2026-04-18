// public/js/api.js
const API_BASE = '';  // 空字符串表示相对路径，与页面同源

const CACHE_CONFIG = {
  // 缓存有效期（毫秒），默认 5 分钟
  TTL: 5 * 60 * 1000,
  // 需要缓存的方法名及其缓存键前缀
  KEYS: {
    getClasses: 'classes',
    getUsers: 'users',
    getClassDetail: 'class_detail'
  }
};

// 获取当前用户标识（用于区分不同角色的缓存）
function getUserCacheKey() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return '';
  try {
    const user = JSON.parse(userStr);
    return `${user.userId}_${user.role}`;
  } catch {
    return '';
  }
}

// 生成完整的缓存键
function makeCacheKey(prefix, params = {}) {
  const userKey = getUserCacheKey();
  const paramsStr = JSON.stringify(params);
  return `cache_${prefix}_${userKey}_${paramsStr}`;
}

// 带缓存的请求
async function cachedRequest(prefix, url, options = {}, params = {}) {
  const cacheKey = makeCacheKey(prefix, params);

  // 尝试从缓存读取
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const { data, expires } = JSON.parse(cached);
      if (Date.now() < expires) {
        console.log(`[缓存命中] ${prefix}`);
        return data;
      } else {
        localStorage.removeItem(cacheKey);
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  // 发起真实请求
  const response = await api.request(url, options);

  // 存入缓存
  const cacheData = {
    data: response,
    expires: Date.now() + CACHE_CONFIG.TTL
  };
  localStorage.setItem(cacheKey, JSON.stringify(cacheData));

  return response;
}

// 清除特定前缀的所有缓存（用于数据变更后刷新）
function clearCacheByPrefix(prefix) {
  const userKey = getUserCacheKey();
  const pattern = `cache_${prefix}_${userKey}_`;
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(pattern)) {
      localStorage.removeItem(key);
    }
  });
}

// 暴露清除方法供外部调用
window.clearApiCache = clearCacheByPrefix;

const api = {
  // 通用请求方法
  async request(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE + url, {
      ...options,
      headers
    });

    // 处理 401 自动跳转登录
    if (response.status === 401) {
      localStorage.clear();
      if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
      }
      throw new Error('未登录或登录已过期');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `请求失败 (${response.status})`);
    }

    return data;
  },

  // 登录
  login: (username, password) => {
    return api.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // ========== 班级相关 ==========
  // 获取班级列表（带缓存）
  getClasses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return cachedRequest('classes', `/api/classes${query ? '?' + query : ''}`, {}, params);
  },

  // 获取班级详情（带缓存）
  getClassDetail: (id) => {
    return cachedRequest('class_detail', `/api/classes/${id}`, {}, { id });
  },

  // 创建班级（写操作，清除缓存）
  createClass: async (data) => {
    const result = await api.request('/api/classes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    clearCacheByPrefix('classes');
    return result;
  },

  // 更新班级（写操作，清除缓存）
  updateClass: async (id, data) => {
    const result = await api.request(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // 删除班级（写操作，清除缓存）
  deleteClass: async (id) => {
    const result = await api.request(`/api/classes/${id}`, {
      method: 'DELETE'
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // 绑定班主任（写操作，清除缓存）
  bindTeacher: async (classId, teacherId) => {
    const result = await api.request('/api/classes/bind-teacher', {
      method: 'POST',
      body: JSON.stringify({ classId, teacherId })
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // 解绑班主任（写操作，清除缓存）
  unbindTeacher: async (classId) => {
    const result = await api.request('/api/classes/unbind-teacher', {
      method: 'POST',
      body: JSON.stringify({ classId })
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // 添加学生到班级（写操作，清除缓存）
  addStudentToClass: async (classId, studentId) => {
    const result = await api.request('/api/classes/add-student', {
      method: 'POST',
      body: JSON.stringify({ classId, studentId })
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // 从班级移除学生（写操作，清除缓存）
  removeStudentFromClass: async (classId, studentId) => {
    const result = await api.request('/api/classes/remove-student', {
      method: 'POST',
      body: JSON.stringify({ classId, studentId })
    });
    clearCacheByPrefix('classes');
    clearCacheByPrefix('class_detail');
    return result;
  },

  // ========== 用户相关 ==========
  // 获取用户列表（带缓存）
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return cachedRequest('users', `/api/users${query ? '?' + query : ''}`, {}, params);
  },

  // ========== 成绩相关 ==========
  getScores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/scores${query ? '?' + query : ''}`);
  },

  addScore: (data) => api.request('/api/scores', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  addScoresBatch: (scores) => api.request('/api/scores/batch', {
    method: 'POST',
    body: JSON.stringify({ scores })
  }),

  updateScore: (id, data) => api.request(`/api/scores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  deleteScore: (id) => api.request(`/api/scores/${id}`, {
    method: 'DELETE'
  }),

  getScoreStatistics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/statistics/scores${query ? '?' + query : ''}`);
  },

  exportScores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `/api/scores/export${query ? '?' + query : ''}`;
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    fetch(url, { headers }).then(response => {
      if (!response.ok) throw new Error('导出失败');
      return response.blob();
    }).then(blob => {
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'scores.csv';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    }).catch(err => {
      alert('导出失败：' + err.message);
    });
  },

  // ========== 通知相关 ==========
  getNotices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/notices${query ? '?' + query : ''}`);
  },

  createNotice: (data) => api.request('/api/notices', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  updateNotice: (id, data) => api.request(`/api/notices/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  deleteNotice: (id) => api.request(`/api/notices/${id}`, {
    method: 'DELETE'
  }),

  markNoticeRead: (id) => api.request(`/api/notices/${id}/read`, {
    method: 'POST'
  }),

  getNoticeReadStatus: (id) => api.request(`/api/notices/${id}/read-status`),

  // ========== 日志相关 ==========
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/logs${query ? '?' + query : ''}`);
  },

  // 健康检查
  ping: () => api.request('/api/ping')
};

// 将 api 挂载到全局
window.api = api;