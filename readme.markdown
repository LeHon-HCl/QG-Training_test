# 教学管理系统

基于原生 HTML/CSS/JavaScript + Node.js + MySQL 的全栈教学管理平台，支持教务主任、班主任、学生三种角色，涵盖班级管理、成绩管理、通知平台、操作日志等核心功能。

## 🎯 项目亮点

- ✅ **纯原生技术栈**：未使用任何第三方框架或库（仅数据库驱动 `mysql2`）。
- ✅ **细粒度权限控制**：基于 JWT 的接口鉴权 + 前端路由守卫，严格区分三种角色数据范围。
- ✅ **完整业务闭环**：班级、成绩、通知、日志模块前后端全流程打通。
- ✅ **响应式布局**：适配 PC、平板、手机三档屏幕。
- ✅ **加分项实现**：SPA 路由、组件封装、本地缓存、请求防抖、操作日志等。

## 🛠 技术栈

| 层级   | 技术                           |
| ------ | ------------------------------ |
| 前端   | HTML5, CSS3, JavaScript (ES6+) |
| 后端   | Node.js (原生 `http` 模块)     |
| 数据库 | MySQL 8.0                      |
| 鉴权   | 自实现 JWT (JSON Web Token)    |
| 工具   | Postman (接口测试)             |

## 📁 项目结构

teaching-manage-system/
├── server.js # 后端服务入口
├── package.json
├── public/ # 前端静态资源
│ ├── index.html # SPA 主框架
│ ├── login.html # 登录页
│ ├── css/
│ │ ├── base.css
│ │ ├── layout.css
│ │ ├── login.css
│ │ ├── components.css
│ │ ├── notices.css
│ │ └── responsive.css
│ └── js/
│ ├── api.js # 请求封装 & 缓存
│ ├── components.js # Modal/Toast/Table/Pagination 组件
│ ├── router.js # 前端路由
│ ├── app.js # 应用入口
│ └── views/ # 各功能视图
│ ├── classes.js
│ ├── scores.js
│ ├── notices.js
│ └── logs.js
└── src/ # 后端源码
├── db.js # 数据库连接池
├── router.js # 路由分发
├── middlewares/ # 中间件（日志、解析、鉴权）
├── routes/ # 路由处理函数
├── services/ # 数据库操作封装
└── utils/ # 工具函数（JWT、密码、校验、导出）

## 🚀 快速开始

### 1. 环境要求

- Node.js 16+
- MySQL 8.0+
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 导入数据库

项目根目录下提供了 `database_backup.sql` 备份文件，包含完整的表结构和初始测试数据。

在 MySQL 中创建数据库：

```sql
CREATE DATABASE teachingmanagesystem;
```

导入备份文件（在命令行中执行）：

```bash
mysql -u root -p teachingmanagesystem < database_backup.sql
```

_根据你的 MySQL 用户名和密码调整 `-u` 参数。_

### 4. 配置环境变量

在项目根目录创建 `.env` 文件，填入以下内容（根据你的数据库配置修改）：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=teachingmanagesystem
JWT_SECRET=your-super-secret-key-at-least-32-chars!!!
```

### 5. 启动后端服务

```bash
node server.js
```

控制台显示 `Server running on http://localhost:3000` 即表示启动成功。

### 6. 访问系统

打开浏览器，访问 `http://localhost:3000/login.html`，使用下方测试账号登录。

## 🔑 测试账号

| 角色     | 用户名     | 密码       | 权限说明                                               |
| -------- | ---------- | ---------- | ------------------------------------------------------ |
| 教务主任 | `admin`    | `admin123` | 全功能：班级管理、成绩管理、查看全量通知、查看全量日志 |
| 班主任   | `teacher1` | `123456`   | 管理本班成绩、发布/编辑本班通知、查看本班日志          |
| 学生     | `student1` | `123456`   | 查看本人成绩、查看本班通知、标记已读                   |

_以上账号已预置在数据库备份文件中，密码已通过 `hashPassword` 加密。_

## 📋 功能模块

| 模块         | 教务主任                              | 班主任                               | 学生                   |
| ------------ | ------------------------------------- | ------------------------------------ | ---------------------- |
| **班级管理** | 增删改查、绑定/解绑班主任、管理学生   | ❌                                   | ❌                     |
| **成绩管理** | 全量增删改查、批量导入、统计、导出CSV | 仅本班增删改查、统计、导出           | 仅查看本人成绩         |
| **通知中心** | 查看全量通知                          | 发布/编辑/删除本班通知、查看已读统计 | 查看本班通知、标记已读 |
| **操作日志** | 查看全量日志                          | 查看本班相关日志                     | ❌                     |

## 🧪 接口测试

所有 API 均以 `/api` 开头，遵循 RESTful 风格。可使用 Postman 导入以下基础路径进行测试：

- `POST /api/login`
- `GET /api/classes`
- `POST /api/scores`
- `GET /api/notices`
- `GET /api/logs`

详细测试用例请参考项目开发过程中的测试表。

## 📌 注意事项

1. **静态文件服务**：后端已集成静态文件服务，无需单独启动前端服务器。
2. **跨域问题**：开发时后端已设置 `Access-Control-Allow-Origin: *`，生产环境建议调整为具体域名。
3. **首次运行**：导入 `database_backup.sql` 后即可直接使用测试账号登录，数据中已包含示例班级、学生和教师。

## 📄 开发日志

- 实现 JWT 原生鉴权及中间件链
- 完成班级管理全流程（含缓存优化）
- 完成成绩管理（单条/批量、统计、导出）
- 完成通知平台（发布、已读状态、统计）
- 完成操作日志记录与分页查询
- 前端 SPA 架构及组件封装
- 响应式适配及交互优化

## 👨‍💻 作者

本项目为《教学管理系统》课程设计/考核作品，全程原生开发，符合考题所有要求。

---

**感谢使用！**

```

```
