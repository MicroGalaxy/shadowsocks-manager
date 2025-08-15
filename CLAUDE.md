# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述
Shadowsocks Manager (ssmgr) - 一个用于Shadowsocks代理服务器的多用户和流量控制管理工具。

## 开发命令

```bash
# 安装依赖
npm install

# 运行应用
npm start
# 或
node server.js

# 构建前端资源（使用Gulp）
npm run build

# 运行ESLint检查
npm run check

# 修复ESLint问题
npm run fix
```

## 架构说明

### 核心组件

1. **服务器类型**：
   - 类型 `s` (Server)：运行在每个Shadowsocks服务器上，管理本地SS实例
   - 类型 `m` (Manager)：中央管理节点，控制多个服务器

2. **插件系统**：
   - `webgui`：Web管理界面（AngularJS前端 + Express后端）
   - `account`：账户管理和流量控制
   - `flowSaver`：流量数据收集和存储
   - `telegram`：Telegram机器人集成
   - `email`：邮件通知系统
   - `webgui_order`：订单和支付管理

3. **数据库**：
   - 支持SQLite（默认）和MySQL
   - 使用Knex.js进行数据库操作
   - `/models`中的模型定义核心数据结构

4. **WebGUI结构**：
   - 前端：`/plugins/webgui/public`中的AngularJS应用
   - 后端API：`/plugins/webgui/server`中的Express路由
   - 视图：`/plugins/webgui/public/views`中的HTML模板
   - 控制器：`/plugins/webgui/public/controllers`中的Angular控制器

## 关键目录

- `/init`：应用初始化和配置
- `/services`：核心服务（config、manager、server、shadowsocks）
- `/plugins`：所有插件模块
- `/config`：配置文件

## WebGUI前端模式

修改WebGUI时：
- 控制器位于 `/plugins/webgui/public/controllers/`
- 视图位于 `/plugins/webgui/public/views/`
- 服务器API端点位于 `/plugins/webgui/server/`
- 使用Angular Material作为UI组件库
- 遵循现有的表单、对话框和数据表格模式

## 配置

主配置文件：`config/default.yml`
- 数据库连接设置
- 插件配置
- 服务器管理设置

## 依赖要求

- Node.js 12+
- Redis（用于缓存和会话管理）
- 启用了管理API的Shadowsocks服务器