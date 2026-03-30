# 萌爪家园 (Kindred Paws) API 接口文档

> **版本**: v1.0.0  
> **Base URL**: `http://localhost:3001/api`  
> **数据库**: Supabase (PostgreSQL)  
> **认证方式**: Supabase Auth (JWT Bearer Token)

---

## 目录

1. [认证模块 (Auth)](#1-认证模块)
2. [宠物模块 (Pets)](#2-宠物模块)
3. [申请模块 (Applications)](#3-申请模块)
4. [消息模块 (Messages)](#4-消息模块)
5. [用户资料模块 (Profile)](#5-用户资料模块)
6. [收藏模块 (Favorites)](#6-收藏模块)
7. [聊天模块 (Chat)](#7-聊天模块)
8. [数据模型 (Data Models)](#8-数据模型)
9. [错误码说明](#9-错误码说明)
10. [Supabase 数据库设计](#10-supabase-数据库设计)

---

## 通用请求头

```http
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

---

## 1. 认证模块

### 1.1 用户注册

**POST** `/auth/register`

注册新用户账号。

**Request Body**

```json
{
  "email": "string",       // 电子邮箱，必填
  "password": "string",    // 密码（至少8位），必填
  "name": "string"         // 用户昵称，必填
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户昵称"
    },
    "session": {
      "access_token": "eyJhbGci...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

**Response 400**

```json
{
  "success": false,
  "error": "邮箱已被注册"
}
```

---

### 1.2 用户登录

**POST** `/auth/login`

用户通过邮箱密码登录。

**Request Body**

```json
{
  "email": "string",      // 电子邮箱，必填
  "password": "string"    // 密码，必填
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "用户昵称",
      "avatar_url": "https://...",
      "location": "上海, 静安区"
    },
    "session": {
      "access_token": "eyJhbGci...",
      "refresh_token": "...",
      "expires_in": 3600
    }
  }
}
```

**Response 401**

```json
{
  "success": false,
  "error": "邮箱或密码不正确"
}
```

---

### 1.3 退出登录

**POST** `/auth/logout`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "message": "已成功退出登录"
}
```

---

### 1.4 刷新 Token

**POST** `/auth/refresh`

**Request Body**

```json
{
  "refresh_token": "string"
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGci...",
    "expires_in": 3600
  }
}
```

---

## 2. 宠物模块

### 2.1 获取宠物列表

**GET** `/pets`

获取可领养/寄养的宠物列表，支持筛选和分页。

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | `string` | 否 | 类型筛选：`adoption` 或 `foster` |
| `category` | `string` | 否 | 分类：`狗狗`、`猫咪`、`兔子`、`其他` |
| `city` | `string` | 否 | 城市筛选，如 `上海` |
| `status` | `string` | 否 | 状态：`new`、`urgent`、`none` |
| `search` | `string` | 否 | 关键词搜索（品种、名字） |
| `page` | `number` | 否 | 页码，默认 `1` |
| `limit` | `number` | 否 | 每页条数，默认 `20` |

**Response 200**

```json
{
  "success": true,
  "data": {
    "pets": [
      {
        "id": "uuid",
        "name": "Milo",
        "breed": "黄金猎犬",
        "age": "2岁",
        "weight": "25kg",
        "gender": "公",
        "location": "阳光流浪动物救助站, CA",
        "distance": "2.5 公里",
        "image_url": "https://...",
        "description": "...",
        "personality": ["友好", "对孩子友善"],
        "status": "new",
        "type": "adoption",
        "category": "狗狗",
        "fosterer_name": null,
        "health_status": {
          "vaccination": true,
          "neutered": true,
          "microchipped": true
        },
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

---

### 2.2 获取宠物详情

**GET** `/pets/:id`

获取指定宠物的详细信息。

**Path Parameters**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 宠物的 UUID |

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Milo",
    "breed": "黄金猎犬",
    "age": "2岁",
    "weight": "25kg",
    "gender": "公",
    "location": "阳光流浪动物救助站, CA",
    "distance": "2.5 公里",
    "image_url": "https://...",
    "description": "...",
    "personality": ["友好", "对孩子友善", "热爱户外", "社交达人"],
    "status": "new",
    "type": "adoption",
    "category": "狗狗",
    "fosterer_name": null,
    "fosterer_id": null,
    "health_status": {
      "vaccination": true,
      "neutered": true,
      "microchipped": true
    },
    "shelter": {
      "name": "阳光流浪动物救助站",
      "address": "上海市浦东新区张江路1242号",
      "phone": "021-1234-5678"
    },
    "is_favorited": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response 404**

```json
{
  "success": false,
  "error": "宠物信息不存在"
}
```

---

### 2.3 发布寄养需求

**POST** `/pets`

> 需要认证头

发布个人寄养宠物。

**Request Body**

```json
{
  "name": "string",          // 宠物名字，必填
  "breed": "string",         // 品种，必填
  "age": "string",           // 年龄，必填
  "description": "string",   // 寄养说明，必填
  "category": "string",      // 分类，必填
  "location": "string",      // 地址，必填
  "image_url": "string"      // 宠物图片 URL，必填
}
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "糯米",
    "type": "foster",
    "status": "new",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2.4 上传宠物图片

**POST** `/pets/upload-image`

> 需要认证头

上传图片到 Supabase Storage，返回图片 URL。

**Request Body** (multipart/form-data)

| 字段 | 类型 | 说明 |
|------|------|------|
| `file` | `File` | 图片文件（jpg/png，最大 5MB） |

**Response 200**

```json
{
  "success": true,
  "data": {
    "url": "https://supabase.io/storage/v1/object/public/pet-images/..."
  }
}
```

---

## 3. 申请模块

### 3.1 提交领养/寄养申请

**POST** `/applications`

> 需要认证头

提交领养或寄养申请。

**Request Body**

```json
{
  "pet_id": "uuid",                  // 宠物 ID，必填
  "type": "adoption",                // 申请类型：adoption 或 foster，必填
  "applicant_name": "string",        // 申请人姓名，必填
  "applicant_phone": "string",       // 联系电话，必填
  "applicant_address": "string",     // 常住住址，必填
  "applicant_wechat": "string",      // 微信号，选填
  "applicant_bio": "string",         // 个人简介，必填
  "housing_type": "owned",           // 住房类型：owned 或 rented，必填
  "housing_description": "string",   // 居住环境描述，必填
  "has_outdoor_space": true,         // 是否有户外空间，必填
  "experience_level": "experienced"  // 养宠经验：new / some / experienced，必填
}
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pet_id": "uuid",
    "pet_name": "Milo",
    "pet_breed": "黄金猎犬",
    "pet_image": "https://...",
    "status": "reviewing",
    "type": "adoption",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response 409**

```json
{
  "success": false,
  "error": "您已经申请过这只宠物，请勿重复提交"
}
```

---

### 3.2 获取我的申请列表

**GET** `/applications/my`

> 需要认证头

获取当前用户提交的所有申请记录。

**Query Parameters**

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 筛选：`adoption` 或 `foster` |
| `status` | `string` | 筛选：`reviewing`、`approved`、`rejected` |

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pet_name": "Benson",
      "pet_breed": "金毛猎犬",
      "pet_age": "4个月",
      "pet_image": "https://...",
      "status": "approved",
      "type": "adoption",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3.3 获取收到的申请（寄养主人视角）

**GET** `/applications/received`

> 需要认证头

获取别人申请寄养我宠物的申请列表（仅寄养主人可见）。

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pet_name": "糯米",
      "pet_breed": "萨摩耶",
      "pet_image": "https://...",
      "status": "reviewing",
      "type": "foster",
      "applicant_name": "张三",
      "applicant_bio": "家里有一只拉布拉多，有丰富的养宠经验。",
      "applicant_avatar": "https://...",
      "pet_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 3.4 更新申请状态

**PATCH** `/applications/:id/status`

> 需要认证头（仅申请关联宠物的主人）

审批或拒绝申请。

**Path Parameters**

| 参数 | 说明 |
|------|------|
| `id` | 申请 UUID |

**Request Body**

```json
{
  "status": "approved"   // approved 或 rejected
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "approved",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

**Response 403**

```json
{
  "success": false,
  "error": "无权操作此申请"
}
```

---

## 4. 消息模块

### 4.1 获取消息列表

**GET** `/messages`

> 需要认证头

获取当前用户的所有消息。

**Query Parameters**

| 参数 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 筛选：`all`、`notification`、`adoption`、`interaction` |

**Response 200**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sender": "阳光流浪动物救助站",
      "time": "2024-01-01T10:45:00Z",
      "subject": "回复: Milo 的访问时间表",
      "preview": "我们非常欢迎你这周六 10 点过来...",
      "icon": "pets",
      "is_read": false,
      "type": "adoption"
    }
  ],
  "unread_count": 2
}
```

---

### 4.2 标记消息已读

**PATCH** `/messages/:id/read`

> 需要认证头

**Response 200**

```json
{
  "success": true
}
```

---

### 4.3 批量标记全部已读

**PATCH** `/messages/read-all`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "data": {
    "updated_count": 3
  }
}
```

---

### 4.4 删除消息

**DELETE** `/messages/:id`

> 需要认证头

**Response 200**

```json
{
  "success": true
}
```

---

## 5. 用户资料模块

### 5.1 获取当前用户资料

**GET** `/profile`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "艾琳娜·凡斯",
    "bio": "动物爱好者，自2021年起担任流浪动物救援志愿者。",
    "avatar_url": "https://...",
    "location": "上海, 静安区",
    "email": "alina.v@petmail.com",
    "phone": "138 1234 5678",
    "experience": "5年养犬经验",
    "interested_in": "大型犬, 幼猫",
    "stats": {
      "favorites_count": 5,
      "reviewing_count": 2,
      "helped_count": 3
    }
  }
}
```

---

### 5.2 更新用户资料

**PUT** `/profile`

> 需要认证头

**Request Body**

```json
{
  "name": "string",           // 昵称，选填
  "bio": "string",            // 个人简介，选填
  "avatar_url": "string",     // 头像 URL，选填
  "location": "string",       // 所在地，选填
  "phone": "string",          // 联系电话，选填
  "experience": "string",     // 养宠经验，选填
  "interested_in": "string"   // 感兴趣的宠物类型，选填
}
```

**Response 200**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "艾琳娜·凡斯",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 5.3 上传用户头像

**POST** `/profile/upload-avatar`

> 需要认证头

**Request Body** (multipart/form-data)

| 字段 | 类型 | 说明 |
|------|------|------|
| `file` | `File` | 头像图片（jpg/png，最大 2MB） |

**Response 200**

```json
{
  "success": true,
  "data": {
    "avatar_url": "https://supabase.io/storage/v1/object/public/avatars/..."
  }
}
```

---

## 6. 收藏模块

### 6.1 获取收藏列表

**GET** `/favorites`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "data": {
    "pet_ids": ["uuid1", "uuid2"],
    "pets": [
      {
        "id": "uuid",
        "name": "Milo",
        "breed": "黄金猎犬",
        "age": "2岁",
        "image_url": "https://...",
        "type": "adoption",
        "category": "狗狗"
      }
    ]
  }
}
```

---

### 6.2 添加收藏

**POST** `/favorites/:petId`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "message": "已添加到收藏"
}
```

---

### 6.3 取消收藏

**DELETE** `/favorites/:petId`

> 需要认证头

**Response 200**

```json
{
  "success": true,
  "message": "已取消收藏"
}
```

---

## 7. 聊天模块

### 7.1 获取聊天记录

**GET** `/chat/:messageId`

> 需要认证头

获取与某个 message 关联的聊天记录。

**Response 200**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "uuid",
      "sender_name": "阳光流浪动物救助站",
      "subject": "回复: Milo 的访问时间表"
    },
    "messages": [
      {
        "id": "uuid",
        "content": "我们非常欢迎你这周六 10 点过来...",
        "sender_type": "shelter",
        "created_at": "2024-01-01T10:45:00Z"
      }
    ]
  }
}
```

---

### 7.2 发送消息

**POST** `/chat/:messageId`

> 需要认证头

**Request Body**

```json
{
  "content": "string"   // 消息内容，必填
}
```

**Response 201**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "好的，我会准时到。",
    "sender_type": "user",
    "created_at": "2024-01-01T11:00:00Z"
  }
}
```

---

## 8. 数据模型

### Pet（宠物）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` | 主键 |
| `name` | `varchar` | 宠物名字 |
| `breed` | `varchar` | 品种 |
| `age` | `varchar` | 年龄描述 |
| `weight` | `varchar` | 体重（可选） |
| `gender` | `varchar` | 性别（可选） |
| `location` | `varchar` | 地理位置 |
| `image_url` | `text` | 图片 URL |
| `description` | `text` | 详细描述 |
| `personality` | `text[]` | 性格标签数组 |
| `status` | `enum` | `new` / `urgent` / `none` |
| `type` | `enum` | `adoption` / `foster` |
| `category` | `varchar` | 动物分类 |
| `fosterer_id` | `uuid` | 寄养主人 ID（外键） |
| `fosterer_name` | `varchar` | 寄养主人名字 |
| `vaccination` | `boolean` | 是否已接种疫苗 |
| `neutered` | `boolean` | 是否已绝育 |
| `microchipped` | `boolean` | 是否已植入芯片 |
| `created_at` | `timestamp` | 创建时间 |
| `updated_at` | `timestamp` | 更新时间 |

### Application（申请）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` | 主键 |
| `pet_id` | `uuid` | 宠物 ID（外键） |
| `applicant_id` | `uuid` | 申请人 ID（外键） |
| `type` | `enum` | `adoption` / `foster` |
| `status` | `enum` | `reviewing` / `approved` / `rejected` |
| `applicant_name` | `varchar` | 申请人姓名 |
| `applicant_phone` | `varchar` | 联系电话 |
| `applicant_address` | `text` | 常住地址 |
| `applicant_wechat` | `varchar` | 微信号 |
| `applicant_bio` | `text` | 个人简介 |
| `housing_type` | `enum` | `owned` / `rented` |
| `housing_description` | `text` | 居住环境描述 |
| `has_outdoor_space` | `boolean` | 是否有户外空间 |
| `experience_level` | `enum` | `new` / `some` / `experienced` |
| `created_at` | `timestamp` | 创建时间 |

### Message（消息）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` | 主键 |
| `user_id` | `uuid` | 接收者 ID（外键） |
| `sender` | `varchar` | 发送者名称 |
| `subject` | `varchar` | 消息主题 |
| `preview` | `text` | 消息预览 |
| `content` | `text` | 完整内容 |
| `icon` | `varchar` | 图标名称 |
| `is_read` | `boolean` | 是否已读 |
| `type` | `enum` | `notification` / `adoption` / `interaction` |
| `created_at` | `timestamp` | 创建时间 |

### UserProfile（用户资料）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` | 主键（与 auth.users.id 一致） |
| `name` | `varchar` | 昵称 |
| `bio` | `text` | 个人简介 |
| `avatar_url` | `text` | 头像 URL |
| `location` | `varchar` | 所在地 |
| `phone` | `varchar` | 联系电话 |
| `experience` | `varchar` | 养宠经验 |
| `interested_in` | `varchar` | 感兴趣类型 |
| `created_at` | `timestamp` | 注册时间 |
| `updated_at` | `timestamp` | 更新时间 |

### Favorite（收藏）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `uuid` | 主键 |
| `user_id` | `uuid` | 用户 ID（外键） |
| `pet_id` | `uuid` | 宠物 ID（外键） |
| `created_at` | `timestamp` | 收藏时间 |

---

## 9. 错误码说明

| HTTP 状态码 | 含义 |
|-------------|------|
| `200` | 请求成功 |
| `201` | 创建成功 |
| `400` | 请求参数错误 |
| `401` | 未认证，Token 缺失或无效 |
| `403` | 无权限访问此资源 |
| `404` | 资源不存在 |
| `409` | 数据冲突（如重复申请） |
| `422` | 数据验证失败 |
| `429` | 请求过于频繁 |
| `500` | 服务器内部错误 |

**统一错误响应格式：**

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

---

## 10. Supabase 数据库设计

### 初始化 SQL

```sql
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户资料表（与 Supabase Auth 关联）
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(200),
  phone VARCHAR(20),
  experience VARCHAR(100),
  interested_in VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 宠物表
CREATE TABLE pets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  age VARCHAR(50) NOT NULL,
  weight VARCHAR(50),
  gender VARCHAR(10),
  location VARCHAR(200) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  personality TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'none' CHECK (status IN ('new', 'urgent', 'none')),
  type VARCHAR(20) NOT NULL CHECK (type IN ('adoption', 'foster')),
  category VARCHAR(50),
  fosterer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  fosterer_name VARCHAR(100),
  vaccination BOOLEAN DEFAULT FALSE,
  neutered BOOLEAN DEFAULT FALSE,
  microchipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 申请表
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('adoption', 'foster')),
  status VARCHAR(20) DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'approved', 'rejected')),
  applicant_name VARCHAR(100) NOT NULL,
  applicant_phone VARCHAR(20) NOT NULL,
  applicant_address TEXT NOT NULL,
  applicant_wechat VARCHAR(50),
  applicant_bio TEXT,
  housing_type VARCHAR(20) CHECK (housing_type IN ('owned', 'rented')),
  housing_description TEXT,
  has_outdoor_space BOOLEAN DEFAULT FALSE,
  experience_level VARCHAR(20) CHECK (experience_level IN ('new', 'some', 'experienced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  sender VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  preview TEXT,
  content TEXT,
  icon VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  type VARCHAR(30) DEFAULT 'notification' CHECK (type IN ('notification', 'adoption', 'interaction')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 收藏表
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pet_id)
);

-- 聊天记录表
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sender_type VARCHAR(20) CHECK (sender_type IN ('user', 'shelter', 'system')),
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_pets_type ON pets(type);
CREATE INDEX idx_pets_category ON pets(category);
CREATE INDEX idx_pets_status ON pets(status);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_pet ON applications(pet_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);

-- 开启 Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Users can insert applications" ON applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Pet owner can update application status" ON applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pets WHERE pets.id = applications.pet_id AND pets.fosterer_id = auth.uid())
);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON messages FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- 宠物表公开可读
CREATE POLICY "Pets are publicly readable" ON pets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert pets" ON pets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

---

> **注意**: 所有需要认证的接口，在 Token 过期后将返回 `401`，前端应自动刷新 Token 或引导用户重新登录。
