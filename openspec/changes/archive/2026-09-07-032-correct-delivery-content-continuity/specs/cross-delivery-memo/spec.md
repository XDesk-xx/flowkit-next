## ADDED Requirements

### Requirement: Memo 内容隔离不豁免独立约束

exact `.flowkit/memos.json` 内容 SHALL 不参与产品 candidate，但其存在性、路径边界和 regular-file 类型 SHALL 保持可检查，消费 Memo 的操作 SHALL 继续使用已有 reader 的 closed schema 校验。缺失代表空 collection 的业务语义 SHALL NOT 将缺失与存在文档的执行材料身份合并。Memo-only 改动 SHALL NOT 自动产生产品重验证、Git mutation 或生命周期权限。

#### Scenario: 合法 Memo-only 不改变产品身份

- **WHEN** 只有 exact regular Memo 文档内容改变，产品材料不变
- **THEN** 产品 candidate SHALL 不变；消费该文档的 check SHALL 绑定更新后的材料，Git dirty 状态 SHALL 独立如实报告

#### Scenario: 无效文档不因产品隔离合法化

- **WHEN** Memo 存在但 schema 无效，或路径/type 不合法
- **THEN** 消费 Memo 的操作 SHALL 拒绝；系统 SHALL 不将其覆盖成空文档或借产品隔离绕过已有校验

#### Scenario: 缺失与空集合区分材料

- **WHEN** Memo 从缺失变为包含合法空集合的文档
- **THEN** Memo reader 的集合语义 SHALL 仍为空，但实际消费文件的 check SHALL 区分其材料身份，不创建额外 Action/Run
