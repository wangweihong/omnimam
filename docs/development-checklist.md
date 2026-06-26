# 功能开发检查清单

## 开发前

- [ ] 是否确认功能所属模块？
- [ ] 是否查看 `docs/module-manifest.yaml`？
- [ ] 是否查看对应的 `docs/modules/{module-id}.md`？
- [ ] 是否确认当前功能状态？
- [ ] 是否确认前端入口？
- [ ] 是否确认后端接口？
- [ ] 是否确认数据库表？
- [ ] 是否确认是否影响 roadmap？

## 开发中

- [ ] 是否新增或修改前端页面？
- [ ] 是否新增或修改前端路由？
- [ ] 是否新增或修改组件、表单、表格、弹窗？
- [ ] 是否新增或修改 API 调用？
- [ ] 是否新增或修改后端路由？
- [ ] 是否新增或修改 Handler / Controller？
- [ ] 是否新增或修改 Service 逻辑？
- [ ] 是否新增或修改数据库表、字段、索引、迁移？
- [ ] 是否新增或修改配置、权限、认证、日志、审计？

## 开发后

- [ ] 是否检查 `git diff --name-only`？
- [ ] 是否更新 `docs/generated/api-inventory.md`？
- [ ] 是否更新 `docs/generated/frontend-inventory.md`？
- [ ] 是否更新 `docs/generated/db-inventory.md`？
- [ ] 是否更新 `docs/architecture/module-index.md`？
- [ ] 是否更新对应的 `docs/modules/{module-id}.md`？
- [ ] 是否更新 `docs/architecture/frontend-design.md`？
- [ ] 是否更新 `docs/architecture/backend-design.md`？
- [ ] 是否更新 `docs/architecture/database-design.md`？
- [ ] 是否更新 `docs/architecture/roadmap.md`？
- [ ] 是否更新 `docs/architecture/change-log.md`？
- [ ] 是否检查文档与代码一致？
- [ ] 是否在最终回复中说明代码变更和文档变更？