// public/js/api.js
const API_BASE = '';  // 空字符串表示相对路径，与页面同源

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
      return { error: '未登录或登录已过期' };
    }

    const data = await response.json();
    return data;
  },

  // 登录
  login: (username, password) => {
    return api.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  // 获取班级列表
  getClasses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/classes${query ? '?' + query : ''}`);
  },

  // 获取班级详情
  getClassDetail: (id) => api.request(`/api/classes/${id}`),

  // 创建班级
  createClass: (data) => api.request('/api/classes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 更新班级
  updateClass: (id, data) => api.request(`/api/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // 删除班级
  deleteClass: (id) => api.request(`/api/classes/${id}`, {
    method: 'DELETE'
  }),

  // 绑定班主任
  bindTeacher: (classId, teacherId) => api.request('/api/classes/bind-teacher', {
    method: 'POST',
    body: JSON.stringify({ classId, teacherId })
  }),

  // 解绑班主任
  unbindTeacher: (classId) => api.request('/api/classes/unbind-teacher', {
    method: 'POST',
    body: JSON.stringify({ classId })
  }),

  // 添加学生到班级
  addStudentToClass: (classId, studentId) => api.request('/api/classes/add-student', {
    method: 'POST',
    body: JSON.stringify({ classId, studentId })
  }),

  // 从班级移除学生
  removeStudentFromClass: (classId, studentId) => api.request('/api/classes/remove-student', {
    method: 'POST',
    body: JSON.stringify({ classId, studentId })
  }),

  // 获取用户列表（支持角色筛选）
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/users${query ? '?' + query : ''}`);
  },

  // 获取成绩列表
  getScores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/scores${query ? '?' + query : ''}`);
  },

  // 添加成绩
  addScore: (data) => api.request('/api/scores', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 批量添加成绩
  addScoresBatch: (scores) => api.request('/api/scores/batch', {
    method: 'POST',
    body: JSON.stringify({ scores })
  }),

  // 更新成绩
  updateScore: (id, data) => api.request(`/api/scores/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // 删除成绩
  deleteScore: (id) => api.request(`/api/scores/${id}`, {
    method: 'DELETE'
  }),

  // 成绩统计
  getScoreStatistics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/statistics/scores${query ? '?' + query : ''}`);
  },

  // 导出成绩（返回 Blob 流，浏览器自动下载）
  exportScores: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = `/api/scores/export${query ? '?' + query : ''}`;
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    // 直接触发浏览器下载，不经过 json 解析
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

  // 通知相关
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

  // 日志
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.request(`/api/logs${query ? '?' + query : ''}`);
  },

  // 健康检查
  ping: () => api.request('/api/ping')
};

// 将 api 挂载到全局，其他 JS 文件可直接使用
window.api = api;