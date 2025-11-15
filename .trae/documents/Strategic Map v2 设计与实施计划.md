## 产品目标与关键原则
- 用未来目标反推当前行动：所有规划从年度目标开始，向月/周/日逐级分解，确保“最后期限锁定”。
- 结果导向而非任务导向：内容只记录“何时产生何种结果”，不限制做法。
- 多租户与分身：所有数据以 `organization_id` 与可选的 `individual_id` 区分，支持公司/个人两套战略地图。
- 流动年份与动态日历：滚动 5 年视图，依据当前年份自动移动窗口与时间结构（月/周/日边界）。
- 性能优先（Lark 环境）：虚拟化渲染、最小化网络、乐观更新、IME 友好输入。

## 领域模型（简化版）
- 核心实体：`ObjectiveItem`（战略项）
  - 维度：`scope`（company|individual）、`category`（阶段成就、财务盈利、客户市场、内部系统、人才资本、学习成长）
  - 时间框架：`period_type`（yearly|monthly|weekly|daily）、`period_value`（date，YYYY-MM-DD）
  - 结果：`cell_value`（结果描述）、`status`（neutral|done|fail）、`locked`（是否“最后期限”锁定）
  - 位置：`row_index`、`column_index`、`item_index`（同格多条）
  - 级联：`is_auto_generated`、`parent_item_id`、`cascade_source`（来源）
  - 租户：`organization_id`、`individual_id(nullable)`、`product_id('strategic_map')`

## 时间与锁定规则
- 年 → 月：年度目标自动在当年 12 月生成锁定项（“必须在 12 月完成”）。
- 月 → 周：月度目标自动在该月最后一周生成锁定项（“必须在最后一周完成”）。
- 周 → 日：周目标自动在该周最后一天生成锁定项（“必须在最后一天完成”）。
- 锁定项为 `is_auto_generated=true` 且 `locked=true`，不可编辑 `cell_value`；允许编辑 `status`。

## 数据库设计（Supabase/Postgres）
- 保留并扩展 `public.strategic_map_items`（兼容 v1）
  - 新增/使用字段：`locked boolean`、`parent_item_id uuid`、`cascade_source text`（值为 `YEAR_TO_DECEMBER`、`MONTH_TO_LAST_WEEK`、`WEEK_TO_LAST_DAY`）
  - 复合唯一约束：`(organization_id, product_id, scope, row_index, column_index, period_type, period_value, item_index, COALESCE(individual_id,'00000000-0000-0000-0000-000000000000'))`
  - 索引：`(organization_id, product_id, scope, period_type, period_value)`、`parent_item_id`
- 新增 `calendar_timeframes`（预计算当年日历映射）
  - 字段：`year`, `month`, `iso_week`, `date`, `is_last_week_of_month`, `is_last_day_of_week`, `month_start`, `month_end`, `week_start`, `week_end`
  - 作用：无须前端重复计算，简化周/月边界与“最后期限”定位。

## 触发器与级联策略（Postgres）
- `AFTER INSERT/UPDATE ON strategic_map_items`：
  - 年度项：根据 `period_value` 的年，插入/更新该年 12 月锁定项（`parent_item_id` 指向年度项）。
  - 月度项：插入/更新该月最后一周锁定项（查 `calendar_timeframes`）。
  - 周度项：插入/更新该周最后一天锁定项。
- 更新/删除策略：
  - 更新年度 `cell_value` 不覆盖已手动编辑的锁定项，仅在空值或 `is_auto_generated=true` 时同步；删除父项同时软删除子项（或标记 `cascade_source` 失效）。
- RLS 策略：
  - 公司视图：`individual_id IS NULL`；个人视图：`individual_id = auth_user_individual_id()`。
  - 所有查询强制 `organization_id` 与 `product_id='strategic_map'`。

## API 设计
- `GET /api/strategic_map`（批量按年）：
  - 输入：`organization_slug`, `scope`, `timeframe`, `year_range|focus_year`
  - 输出：`items[]` + `calendar{ months[], weeks[], days[] }`（嵌入或单独 `/api/calendar?year=...`）
- `GET /api/strategic_map?timeframe_value=YYYY-MM-DD`（单点增量）：
  - 用于刚发生的级联目标（例如年度保存后拉取当年 12 月）。
- `POST /api/strategic_map`（保存/上锁/状态切换）：
  - 返回：`saved_item` + `related_items[]`（包含触发器自动生成的锁定项），便于前端一次性合并。
- `DELETE /api/strategic_map?id=...`：
  - 返回：`{ success }` + 可选 `related_deleted_ids[]`（若级联删除）。

## 前端架构（React + Lark）
- 视图结构：年/月/周/日四级 Tabs + 移动端卡片。
- 渲染：
  - 虚拟化（`react-window` 或 `ag-grid`），仅渲染可视区单元格；移动端列表亦虚拟化。
  - `StrategicMapCell` 使用不可控输入 + 组合输入事件（IME 友好），回车/失焦提交；锁定项只允许状态切换。
- 状态模型：
  - 以 `timeframe_row_column` 为主键的 cell store + 以 `id` 的 item store，便于乐观更新与定点合并。
  - 批量加载（年级别）与单点增量（`timeframe_value`）结合；保存后优先合并 `related_items`，若无则回退到单点拉取（例如 12 月）。
- 网络策略：
  - 请求合并与去重；按激活 Tab 懒加载；ETag/Cache-Control；降级到单点增量刷新。
- Lark 适配：
  - JSAPI 仅在 `ready` 后启动数据加载；`lk_token` 过期自动清理 + 强制一次重试；日志按环境等级输出。

## 性能优化
- DOM：虚拟化栅格、稳定 props、去除无用 re-render；批量 setState 合并。
- 计算：时间映射后端化（`calendar_timeframes`），前端只做轻度映射。
- 网络：增量拉取级联影响面（如：年度 → 当年 12 月；月度 → 最后一周；周度 → 最后一天）；避免全时段刷新。
- IME：不可控输入 + `compositionstart/end` 抑制提交；提交时读 `ref.value`。

## 权限与多租户
- 登录：保持 Lark JSAPI/OAuth 逻辑；按 `organization_slug` 解析租户配置。
- 作用域：`scope=company`（`individual_id IS NULL`）与 `scope=individual`（指定 `individual_id`）。
- 审计：所有写操作记录 `edge_log`（时间、用户、变更字段、父子项）。

## 迁移与兼容
- Phase 0：创建 `calendar_timeframes` 与索引；补充缺失字段（`locked`, `parent_item_id`, `cascade_source`）。
- Phase 1：触发器/函数与 API 扩展（返回 `related_items`）。
- Phase 2：前端增量拉取与乐观合并、虚拟化栅格、IME 输入改造。
- Phase 3：Lark 体验打磨（超时兜底、状态提示、错误恢复）。
- Phase 4：RLS/审计与性能回归测试。

## 里程碑
- M1（1 周）：Schema 扩展 + 日历生成 + 年→月锁定触发器；单点增量 API。
- M2（1–2 周）：前端增量合并与虚拟化；IME 优化；年度保存即时呈现 12 月锁定项。
- M3（1 周）：月→周、周→日级联；统一返回 `related_items`；性能与稳定性回归。
- M4（1 周）：RLS 与审计；团队视图与权限细化；文档和运维脚本。

## 关键差异
- 级联由后端触发器统一生成，并通过 API 返回 `related_items` 实时呈现，前端不再全局刷新。
- 时间结构后端化（`calendar_timeframes`），滚动 5 年与边界计算更稳定，降低前端负担。
- Lark 环境专项优化（JSAPI ready、超时兜底、一次性重试、按需日志）。