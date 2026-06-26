
# System Architecture Audit Skill

## When to use

Use this skill when the user asks to:

- summarize current system capabilities
- generate architecture documentation
- audit frontend/backend/database implementation
- create module-level design documents
- identify implemented and planned features
- produce roadmap and module status

## Process

1. Inspect repository structure.
2. Identify frontend framework and routes.
3. Identify backend framework, routes, handlers, services, request/response types.
4. Identify database models, migrations, schemas and table relationships.
5. Identify existing docs, README, TODO, roadmap and comments.
6. Generate factual inventories under docs/generated.
7. Generate architecture documents under docs/architecture.
8. Generate module documents under docs/modules.
9. Mark each capability using one of:
   - 可用
   - 部分可用
   - 开发中
   - 待开发
   - 废弃
   - 未知
10. Cite code evidence for every important claim.

## Required output files

- docs/generated/code-inventory.md
- docs/generated/api-inventory.md
- docs/generated/frontend-inventory.md
- docs/generated/db-inventory.md
- docs/architecture/system-overview.md
- docs/architecture/module-index.md
- docs/architecture/frontend-design.md
- docs/architecture/backend-design.md
- docs/architecture/database-design.md
- docs/architecture/roadmap.md
- docs/modules/*.md

## Rules

- Do not invent missing implementation.
- Do not mark planned features as available.
- Prefer explicit evidence from code.
- If evidence is weak, mark status as unknown or partially available.
- Preserve existing user-written documentation unless explicitly told to overwrite.
