## MODIFIED Requirements

### Requirement: Candidate identity is derived from the actual Git-visible worktree

可信 host SHALL 从自身持有的 canonical repository root 推导当前候选，不接受 caller 指定可复用 candidate 或重定向 root。材料 SHALL 包含 tracked paths 与 non-ignored untracked worktree material，record 固定为按顺序排列的 `{path, kind, mode, materialRef}`；支持 regular `100644 / 100755` 与 symlink `120000`，材料身份取实际文件或 link target bytes。确认删除的路径 SHALL 不生成 record，不再保留 `tracked-missing`；删除前有材料、删除后无材料仍 SHALL 可区分。

候选 SHALL 保持既有 `.flowkit/runs/**` 排除，并只额外隔离 exact `.flowkit/memos.json` 内容；Memo 路径及对象类型 SHALL 验证，不允许同名目录、symlink 或非法路径借隔离绕过检查。其 schema 校验 SHALL 仍归 Memo reader，不复制进候选能力。系统 SHALL NOT 排除整个 `.flowkit/`、project.json、根目录文档或 non-ignored bundle。

#### Scenario: Source content mutation changes candidate identity

- **WHEN** 非隔离材料的实际源码 bytes 发生变化
- **THEN** 系统 SHALL 得到不同候选

#### Scenario: Executable-mode mutation changes candidate identity

- **WHEN** tracked 文件 bytes 不变但 Git-visible mode 在 `100644` 与 `100755` 间改变
- **THEN** 系统 SHALL 得到不同候选

#### Scenario: Run persistence does not change candidate identity

- **WHEN** 只有既有 Run 内容或 exact regular Memo 文件内容变化，其他有效材料不变
- **THEN** candidate SHALL 不变，但必要执行证据、Memo 消费校验和 Git 状态约束 SHALL 仍独立生效

#### Scenario: 删除状态不受暂存影响

- **WHEN** 同一文件已确认缺席，依次处于删除未暂存、删除已暂存、删除已 commit，其他有效材料不变
- **THEN** 三个状态 SHALL 得到同一候选，且 SHALL 不等于删除前候选

#### Scenario: Caller cannot override current candidate identity

- **WHEN** 输入试图覆盖 candidateRef 以复用 caller 声明的身份
- **THEN** host SHALL 拒绝该覆盖，只使用实际材料派生值

#### Scenario: Caller cannot redirect candidate derivation

- **WHEN** 输入试图重定向候选推导或检查执行所用 repository root
- **THEN** host SHALL 拒绝该覆盖，只使用自身持有的可信 root

#### Scenario: 隔离路径异常仍拒绝

- **WHEN** Memo 路径是同名目录、symlink、越界路径或无法可靠确认的对象类型
- **THEN** 候选推导 SHALL 拒绝，不将异常对象作为合法 Memo 或普通缺席

### Requirement: Check identity includes all declared material execution identity

系统 SHALL 从 checkId、program、ordered args、config refs、tool refs 和 material environment refs 推导 check identity，拒绝重复或不完整声明。实际消费 Memo 或 Git 历史的 check SHALL 绑定相应当前材料；Memo 缺失与存在的合法空文档 SHALL 不默认视为相同 bytes。无序 refs SHALL 使用 UTF-8 bytes 字典序，保留大小写及原始 Unicode 表达，不依赖 locale、不做 normalization。Action check 集合派生与 admission SHALL 使用一致的排序/去重规则；Full Test 的显式 check 顺序与 argv 顺序 SHALL 保留。

checkRef SHALL 使用 `check:sha256:<64 lowercase hex>`，摘要输入为 UTF-8 `flowkit-applicable-check-v2`、一个 `0x00`、既有固定字段顺序的无 BOM/newline JSON projection；系统 SHALL NOT 提供运行时旧算法选择器。

#### Scenario: Environment identity change invalidates the check identity

- **WHEN** 命令、配置和工具不变，但 material environment ref 改变
- **THEN** 新 checkRef SHALL 不同，旧 check PASS 不可复用

#### Scenario: Ordered arguments are part of check identity

- **WHEN** 相同参数值以不同顺序声明
- **THEN** 系统 SHALL 得到不同 checkRef，不按无序集合处理 argv

#### Scenario: locale 不改变无序 refs

- **WHEN** 完全相同 refs 在两个不同默认 locale 中派生并 admission
- **THEN** checkRef 和有效性 SHALL 一致，非 BMP 字符 SHALL 也遵循 UTF-8 bytes 顺序

#### Scenario: Memo 消费 check 不偷用旧结果

- **WHEN** Memo-only 变化保持产品 candidate，但 check 实际读取该 Memo
- **THEN** 其材料身份 SHALL 更新；不消费 Memo 的 check SHALL 不仅因 Memo 内容变化被强制失效

### Requirement: Reuse requires explicit prior successful fact with exact identity equality

系统 SHALL 仅复用显式提供、来源有效的 prior successful mechanical check fact，且 candidateRef 与当前 v2 推导值、checkRef 与当前 v2 推导值均精确相等。命令、配置、工具、材料环境或有效产品材料变化 SHALL 要求当前执行。旧 domain 的 PASS SHALL 不可改写、转换或包装为 v2 PASS；历史 Run/Result bytes SHALL 原样保留。

#### Scenario: Exact same candidate and check may reuse prior success

- **WHEN** prior successful fact 属于当前 v2 candidate/check 且满足既有来源条件
- **THEN** 系统 SHALL 允许记录显式 reused-success，不伪报为新进程执行

#### Scenario: Candidate drift forces rerun

- **WHEN** prior check 相同但 candidate 与当前 v2 身份不同
- **THEN** prior PASS SHALL 不可满足当前检查

#### Scenario: Check identity drift forces rerun

- **WHEN** prior candidate 相同但 check 与当前 v2 身份不同
- **THEN** prior PASS SHALL 不可满足当前检查

#### Scenario: Prior failure is never reusable as success

- **WHEN** prior fact 为 failed execution 或 process failure
- **THEN** 系统 SHALL 拒绝将其复用为 success

#### Scenario: 排列相同的简单样本也隔离旧算法

- **WHEN** ASCII-only、无 Memo、无删除的同一材料在 v1/v2 排列相同，但提供旧 domain PASS
- **THEN** 新 candidate/check domain SHALL 使旧 PASS 不可复用；系统 SHALL 不补写兼容成功

## ADDED Requirements

### Requirement: Worktree 与 exact Git object 共用有效材料投影

系统 SHALL 使用同一 record 定义、排序、序列化与摘要分别表示 worktree 和 exact Git commit 中的材料。Git ref SHALL 先解析为固定 exact commit；object 读取 SHALL 保留 binary blob 原 bytes、尾部空白和 symlink target，不 trim、不解引用、不按 checkout 文本规则转换。支持域 SHALL 限定于可无损解码的 UTF-8 Git paths 与 `100644 / 100755 / 120000`；本合同涉及的 Git OID SHALL 一致要求 SHA-1 repository 与 40 位 lowercase hex，不接受伪装为完整 SHA-256 Git 支持的宽松长度。

candidate records SHALL 按原始 path 的 UTF-8 bytes 字典序排列，摘要为 UTF-8 `flowkit-applicable-check-candidate-v2`、一个 `0x00`、有序 record 数组的无 BOM/newline JSON bytes 的 SHA-256，外形仍为 `candidate:sha256:<64 lowercase hex>`。kind 仅 regular/symlink；materialRef 仍为实际 bytes 的 `sha256:<64 lowercase hex>`。系统 SHALL NOT 新建第二产品身份、算法 Registry 或规范化大小写/Unicode。

#### Scenario: 相同材料跨 reader 一致

- **WHEN** worktree 与 exact object 的 paths/modes/kinds/bytes 相同，包含 binary、尾部空白和 symlink
- **THEN** 两个 reader SHALL 得到相同 candidateRef；同内容空 commit SHALL 不改变该身份

#### Scenario: 真实未提交材料不能漏掉

- **WHEN** worktree 含 non-ignored untracked 产品文件或与 object 不同的 bytes/mode/kind
- **THEN** object 与 worktree 候选 SHALL 不同；checkout filter 或换行差异不得以逻辑等价放行

#### Scenario: 非支持输入被一致拒绝

- **WHEN** 仓库使用 SHA-256 Git、不支持的 mode/submodule、非 UTF-8 路径或 unmerged index
- **THEN** 相关 reader/validator SHALL fail closed，不输出部分候选

### Requirement: 确认缺席不得混同读取失败

材料推导 SHALL 区分可证明缺席与读取失败。EACCES、EPERM、对象类型变化、无法确认的枚举/读取期间漂移 SHALL 失败，不得过滤为删除。host SHALL 在读取前后核对本次材料及其 Git 可见性；无法形成一致观察时 SHALL 拒绝，不自动重试到某个碰巧成功的候选。

#### Scenario: 真实 unreadable 材料拒绝

- **WHEN** regular tracked 或 non-ignored untracked 材料实际读取返回 EACCES/EPERM
- **THEN** reader SHALL 拒绝整个派生，而非省略该文件

#### Scenario: 读取期间变化拒绝

- **WHEN** 枚举后发生可检测的文件替换、kind/mode 变化、index/ignore 可见性漂移或存在性无法确认
- **THEN** reader SHALL 拒绝结果；稳定且已确认的删除才 SHALL 按无 record 处理
