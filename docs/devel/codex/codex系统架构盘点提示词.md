``` 
请为当前项目建立“系统能力盘点与架构文档”体系。

目标：
基于当前代码仓库，生成系统架构文档、功能模块清单、子模块清单、页面设计、前端交互流程、业务逻辑、后端接口设计、数据库设计，并标记每个功能的开发状态。

要求：

1. 不要修改业务代码。
2. 创建或更新 docs/design/architecture、docs/design/modules、docs/design/generated 目录。
3. 先扫描代码，生成事实清单：
   - docs/design/generated/code-inventory.md
   - docs/design/generated/api-inventory.md
   - docs/design/generated/frontend-inventory.md
   - docs/design/generated/db-inventory.md
4. 再生成总架构文档：
   - docs/design/architecture/system-overview.md
   - docs/design/architecture/module-index.md
   - docs/design/architecture/frontend-design.md
   - docs/design/architecture/backend-design.md
   - docs/design/architecture/database-design.md
   - docs/design/architecture/roadmap.md
5. 每个功能模块生成一个 docs/design/modules/{module-id}.md。
6. 功能状态只能使用：
   - 可用
   - 部分可用
   - 开发中
   - 待开发
   - 废弃
   - 未知
7. 每个功能模块必须包含：
   - 模块概述
   - 模块状态
   - 功能清单
   - 子模块清单
   - 页面详细设计
   - 前端交互流程
   - 业务逻辑和规则
   - 后端功能逻辑
   - 后端接口设计
   - 数据库表设计
   - 已实现证据
   - 未完成事项
   - 后续开发建议
8. 所有状态判断必须提供证据：
   - 文件路径
   - 函数名
   - 路由
   - 接口
   - 表名
   - 前端页面
9. 如果无法确认，不要猜测，标记为“未知”或“待确认”。
10. 如果发现 docs/design/module-manifest.yaml 不存在，请先创建一个初始版本，用于维护未来规划功能。
11. 未来规划功能可以写入文档，但必须标记为“待开发”或“开发中”，不能写成“可用”。
12. 完成后，请输出：
   - 生成了哪些文档
   - 识别了哪些模块
   - 哪些模块可用
   - 哪些模块部分可用
   - 哪些模块待开发
   - 哪些地方需要人工确认
```