## MODIFIED Requirements

### Requirement: One durable Run uses the stable three-file record surface

系统 SHALL 为一个 durable Run 使用 `action.md`、`context.json` 与 `result.json` 三文件 surface。`action.md` SHALL 作为稳定的人/AI 可读 Action descriptor；新固定命令的开始描述 MAY 在其中包含可严格识别的有界机器格式，仅供同一已开始 occurrence 的 finish 在受控来源、链及当前安装复核后接续。完整 Run 的 machine continuation facts SHALL 仍由 `context.json` 与 `result.json` 的 validated data contract 承载；新格式 marker、handle 或单独的 `action.md` SHALL NOT 构成完整 Run、current tip 或权限。不得新增第四个 durable Run 文件或追溯重写旧记录。

#### Scenario: Persist a complete Run record

- **WHEN** 一个 Action execution 已形成可持久化的 validated context 与 result
- **THEN** 对应 Run directory SHALL 包含 `action.md`、`context.json` 与 `result.json`，且读取方 SHALL 能从该目录恢复同一 Run occurrence 的 machine facts

#### Scenario: Missing machine record is not treated as a complete Run

- **WHEN** Run directory 缺失 `context.json` 或 `result.json`
- **THEN** status/next 与一般 history reader SHALL fail closed，而不得仅凭 `action.md` 推断 machine execution result；有界 finish 只可按新格式与可信事实核对后接续该 exact occurrence

#### Scenario: Historical descriptor remains intact

- **WHEN** 旧 Run 的 `action.md` 不带新命令格式
- **THEN** 完整三文件 SHALL 按原合同读取，未知旧 partial SHALL 不因新格式识别而被接管或重写
