# DNS记录管理模块 - CloudFlare配置说明

## 环境变量配置

在启动应用前，需要设置CloudFlare API Token环境变量：

```bash
# Linux/Mac
export CF_API_TOKEN="your-cloudflare-api-token-here"

# Windows
set CF_API_TOKEN=your-cloudflare-api-token-here
```

## 获取CloudFlare API Token

1. 登录 [CloudFlare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → "我的个人资料"
3. 选择 "API令牌" 标签
4. 点击 "创建令牌"
5. 使用 "自定义令牌" 模板
6. 设置权限：
   - Zone - Zone:Read
   - Zone - DNS:Edit
7. 可选择限制特定区域
8. 点击 "继续" 并创建令牌
9. 复制生成的令牌并设置为环境变量

## 功能说明

### 1. 基本CRUD操作
- ✅ 查看DNS记录列表
- ✅ 查看单个DNS记录详情
- ✅ 添加新的DNS记录
- ✅ 编辑现有DNS记录
- ✅ 删除DNS记录

### 2. CloudFlare同步功能
- ✅ 添加/编辑记录时自动同步到CloudFlare（如果记录激活）
- ✅ 删除记录时自动从CloudFlare删除
- ✅ 从CloudFlare批量同步记录到本地数据库
- ✅ 支持代理状态（Proxied/DNS Only）设置

### 3. 字段说明
- **record_id**: CloudFlare记录ID
- **zone_id**: CloudFlare Zone ID
- **name**: 记录名称（如：www.example.com）
- **content**: 记录值（如：192.168.1.1）
- **comment**: 备注信息
- **type**: 记录类型（A, AAAA, CNAME, MX, TXT, SRV, PTR, NS）
- **ttl**: 生存时间（秒，1表示自动）
- **proxy**: 是否启用CloudFlare代理
- **active**: 是否激活（同步到CloudFlare）

### 4. 权限要求
- 所有DNS记录操作仅限超级管理员（ID=1）访问

## 使用方法

1. 设置CloudFlare API Token环境变量
2. 重新构建前端资源：`npm run build`
3. 重启服务器
4. 以超级管理员身份登录
5. 在导航菜单中点击"DNS记录"
6. 使用右上角下载按钮从CloudFlare同步现有记录

## 注意事项

- 确保API Token有正确的权限
- 记录的激活状态决定是否同步到CloudFlare
- 修改记录时会自动同步到CloudFlare（如果激活）
- 删除记录会同时从CloudFlare删除（如果存在）