# 功能开发检查清单

## 开发前

- [ ] 是否确认功能所属模块，并查看 `docs/module-manifest.yaml`？
- [ ] 是否查看对应的 `docs/modules/{module-id}.md`？
- [ ] 是否确认当前功能状态只使用允许集合：可用、部分可用、开发中、待开发、废弃、未知？
- [ ] 是否确认影响前端页面、路由、组件、交互或 API 调用？
- [ ] 是否确认影响后端路由、Controller、Service、Store 或 API 类型？
- [ ] 是否确认影响数据库表、字段、索引、AutoMigrate 模型或迁移策略？
- [ ] 是否确认影响权限、认证、配置、日志、审计或任务调度？
- [ ] 是否确认是否需要更新 roadmap、change-log、inventory 或模块设计文档？

## 开发中

- [ ] 是否优先复用现有项目模式，避免引入不必要依赖？
- [ ] 是否避免绕过 Makefile、生成脚本、校验脚本或 Git hook？
- [ ] 是否为新增/修改接口同步更新请求、响应和错误处理说明？
- [ ] 是否为新增/修改页面同步记录路由、组件、权限、接口调用和关键交互？
- [ ] 是否为新增/修改表结构同步记录字段、索引、约束和代码证据？
- [ ] 是否为无法确认的功能状态标记 `未知` 或 `待确认`？
- [ ] 是否避免把未来计划写成已完成能力？

## 开发后

- [ ] 是否检查 `git diff --name-only`？
- [ ] 是否更新 `docs/generated/code-inventory.md`？
- [ ] 是否更新 `docs/generated/api-inventory.md`？
- [ ] 是否更新 `docs/generated/frontend-inventory.md`？
- [ ] 是否更新 `docs/generated/db-inventory.md`？
- [ ] 是否更新 `docs/module-manifest.yaml`？
- [ ] 是否更新 `docs/architecture/module-index.md`？
- [ ] 是否更新对应的 `docs/modules/{module-id}.md`？
- [ ] 是否更新 `docs/architecture/frontend-design.md`、`backend-design.md` 或 `database-design.md`？
- [ ] 是否更新 `docs/architecture/roadmap.md` 和 `docs/architecture/change-log.md`？
- [ ] 是否检查文档中的“可用/部分可用/开发中”都有代码证据？
- [ ] 是否在最终回复中说明代码变更、文档变更、功能状态变化、人工确认项和验证结果？
