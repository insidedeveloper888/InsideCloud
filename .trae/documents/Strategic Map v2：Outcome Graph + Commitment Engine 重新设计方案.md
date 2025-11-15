## 产品愿景
以“结果节点”为唯一事实源，所有视图都是结果数据的投影。年度→月度→周→日的锁定规则不写死于界面，而由后端引擎根据可配置策略自动生成与维护，让团队始终围绕“何时要产生什么结果”运转。

## 核心理念（与现版的本质差异）
1) Outcome Graph（结果图）
- 不再以“单元格”为中心；数据以“结果节点（Outcome）”为中心管理，可建立父子关系（年度拆分到月、月拆分到周、周拆分到日）。
- 结果节点包含目标、度量、锚定时间（year/month/week/day），以及所属类别（阶段成就、财务盈利、客户市场、内部系统、人才资本、学习成长）。

2) Commitment Engine（承诺引擎）
- 锁定项（必须在最后期限完成）由引擎自动生成，作为独立的“Commitment”实体（不可编辑文本，只能更新状态）。
- 规则可配置：
  - 年度→当年12月的“必须达成”承诺
  - 月度→该月最后一周“必须达成”承诺
  - 周度→该周最后一天“必须达成”承诺
- 支持扩展规则（如季度、冲刺周期），避免将规则硬编码到组件。

3) Rolling Calendar（滚动日历）
- 统一由后端提供滚动5年的日历映射与边界（months/weeks/days），前端只呈现投影；年份窗口随当前年份动态滑动，无需重构网格。

4) Live Projections（实时投影）
- 视图是投影：
  - Matrix Projection：按类别×时间框架的网格（与当前产品类似，但为投影层，非事实源）。
  - Timeline Projection：年度→月→周→日的层级时间线（便于上下文对齐）。
  - Portfolio Projection：公司/个人分身切换、过滤类别、只看锁定项或仅看未完成结果。
- 保存Outcome后，引擎返回related_commitments，前端立即合并显示，无需全局刷新。

## 数据库设计（Supabase/Postgres）
- outcomes（结果节点）
  - id, organization_id, individual_id(nullable), product_id('strategic_map')
  - category, period_type(yearly|monthly|weekly|daily), period_value(date: YYYY-MM-DD)
  - title(cell_value替代), metric_target, unit, status(neutral|done|fail)
  - created_by, created_at, updated_at
- outcome_links（父子关系）
  - id, parent_id, child_id, link_type('decompose'), organization_id, individual_id
- commitments（承诺/锁定项）
  - id, parent_outcome_id, organization_id, individual_id, product_id
  - period_type, period_value（例如当年12月/该月最后一周/该周最后一天）
  - locked=true, is_auto_generated=true, status（仅允许状态变更）
- calendar_timeframes（滚动日历映射）
  - year, month, iso_week, date, is_last_week_of_month, is_last_day_of_week, week_start, week_end
- projections（可选物化视图）
  - outcomes_view, commitments_view：便于高效查询与分页
- 约束与索引
  - 复合唯一：tenant+period+category+item_index（或通过links约束位置）
  - 索引：tenant+period_type+period_value、parent_outcome_id
- RLS
  - company：individual_id IS NULL；individual：individual_id = 当前用户的individual_id；全部强制organization_id & product_id。

## 触发器/函数（规则引擎）
- fn_generate_commitments(outcome)
  - 年度：插入/更新当年12月Commitment（locked=true）
  - 月度：插入/更新该月最后一周Commitment
  - 周度：插入/更新该周最后一天Commitment
- AFTER INSERT/UPDATE ON outcomes 调用引擎；DELETE时可软删除或取消承诺（保留审计）
- 扩展：支持自定义策略表（例如季度锁定）与切换规则版本

## API 设计
- POST /api/outcomes  → 返回 { saved_outcome, related_commitments[] }
- PATCH /api/outcomes/:id → 同步返回相关承诺（若周期/关系变动）
- DELETE /api/outcomes/:id → 返回 { deleted_outcome_id, affected_commitments[] }
- GET /api/projections/matrix?scope=company&year=2026 → 返回年度矩阵投影（含categories×columns的结构）
- GET /api/projections/timeline?scope=individual&year=2026 → 返回树形时间线（父子关系与承诺穿插）
- GET /api/calendar?year=2026 → 返回 months/weeks/days 边界与滚动结构

## 前端架构（兼容 Lark）
- 视图层
  - MatrixView：与当前类似，但数据来自投影API；格子只承载渲染与交互，不存事实
  - TimelineView：树形+时间轴，适合规划与复盘
  - PortfolioFilter：公司/个人切换、类别过滤、只看锁定项、只看未完成
- 编辑
  - 结果节点编辑器：不可控输入、IME友好；保存Outcome后即时合并related_commitments
  - 承诺项：只允许状态切换与备注，不改文本
- 性能
  - 虚拟化（react-window或ag-grid）+增量合并；去重请求；Tab懒加载；缓存calendar
- Lark集成
  - JSAPI ready后再加载数据；lk_token过期自动清理并一次性重试；错误兜底与超时退出

## 成功度量
- 年度保存后12月承诺即时可见（<300ms合并）
- 月度保存后最后一周承诺即时可见
- 周保存后最后一天承诺即时可见
- 滚动5年视图加载时间与内存占用显著下降

## 迁移策略
- Migrate v1数据为outcomes与commitments（依据timeframe与is_auto_generated分拆）
- 将前端从“事实即单元格”迁移到“投影渲染”；保留现有UI交互习惯
- 逐步替换旧API为新API（可设兼容层）

## 里程碑
- M1（1周）：建表与RLS、calendar_timeframes、引擎函数（年度→12月）与API骨架
- M2（1–2周）：月→最后一周、周→最后一天规则；投影API；前端MatrixView接入投影与related_commitments合并
- M3（1周）：TimelineView、过滤器、性能优化与IME完善；审计与日志
- M4（1周）：迁移与稳定性回归、文档与运维脚本

## 关键价值
- 从“单元格存事实”转为“结果节点+承诺引擎+投影视图”，彻底解耦数据与界面布局，级联与锁定规则后端化、可配置；性能与可扩展性显著提升，满足公司/个人双视角与长期滚动规划。