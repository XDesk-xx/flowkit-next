## 1. Operation 与直接合同收敛

- [x] 1.1 实现 create-new paths/commitMessage/commitShape 与 reuse-existing closed union，更新授权来源匹配、package/clone/equality；用合法、旧缺字段、错 scope、null/指定 shape 用例验证。
- [x] 1.2 同步 Integration record/ref projection 与 record-for-package validator；以固定 golden vectors 验证属性重排稳定、路径/消息/形状改变 ref、parents 顺序保留及旧形状不重签。
- [x] 1.3 修改 Integration 新建/复用检查，取消默认 clean/parent/count，保留真实对象、指定 shape、权限及 confirmationRef；用 null shape、显式单提交不匹配、无新对象、dirty 复用和 unconfirmed Final 回归验证。

## 2. Git 范围与实际效果

- [x] 2.1 复用 Git helper 实现 NUL/literal exact 路径和 index 相对 HEAD 的待提交差异读取；用空格/中文、unborn、rename/delete 及无法安全解释目标验证，不把全部 tracked 文件当范围。
- [x] 2.2 实现 add 前、commit 前的完整差异范围/权限/相关目标检查，拒绝范围外 staged 与冲突而不清空 index；验证前置拒绝零写入、暂存后 drift 明示效果及无关 dirty 原 bytes 保留。
- [x] 2.3 补齐新建后的实际对象/逐提交范围/指定形状核对，复用/push 不触碰无关 index；通过 callback 越界、无关 staged 复用和实际范围读回验证不凭最终净 diff 掩盖越界。
- [x] 2.4 扩充既有失败读回与 gitEffects，保留已确认 checkpoint、phase/effect/remaining；用 commit 后抛错、读回失败、publication/acceptance pending 验证无盲重试、无自动回滚、Final 不被撤销。

## 3. 可实际使用的最小宿主

- [x] 3.1 交付 manager 自有 git-host.mjs，导出 runCheckpoint/runPush/runIntegration 并复用既有 production helper；验证导入零副作用、target cwd 正确、无新 CLI 命令或自动下一步。
- [x] 3.2 接通真实 Owner 来源 reader 与请求逐项匹配，Change checkpoint 复用 evaluator、Integration 复用 singleton/source；验证无权限/错操作/错 target 在写前停止，普通节点不读 Final/Full Test。
- [x] 3.3 接通限定 commit/复用与独立非强制 push，按本次 remote/ref 实读确认；验证实际本地 bare push、remote mismatch/不可读返回 incomplete，local ref 或 callback 0 不冒充远端接受。
- [x] 3.4 实现外部 acceptance/人工交接到现有 Integration 的映射；验证无 provider、PR 尚未完成、响应丢失时交接已有效果和 remaining，不伪报 terminal、不额外 commit。

## 4. HOW、发行与边界

- [x] 4.1 更新 Integration HOW 与可运行宿主调用示例，Start/Final/产品 archive HOW 仅加必要独立 Git 引用，AGENTS 同步必要说明；逐项核对 055 提醒和两个 deltas，确认不改变 Action、Full Test、Archify 或 bootstrap authority。
- [x] 4.2 验证 packed manager 包含 reference 与其引用模块，在无 target Flowkit scripts/Skills 的分根项目可导入；同名 target 资产不接管，模块搬移不改变 targetRoot。
- [x] 4.3 核对仅相关源码/测试/宿主文件变更，接近或超过 650 行的适用文件按范围/读回职责拆分；运行 quality:gate、typecheck/build 和适用 dependency-health/entropy，禁止压行或放宽 gate。

## 5. 当前实现验收与交接

- [x] 5.1 在当前 build 完成一次有真实 Owner 来源交接的分根宿主示例：普通首个/Change checkpoint、单独 push 到本地 bare remote、复用和 pending 交接；保存实际命令、对象、原始流并明确合成 fixture 与真实宿主工作边界。
- [x] 5.2 运行 native Windows Git 与 Linux x64 适用 domain/acceptance 回归，覆盖权限、完整 index 范围、无关 dirty、指定 shape、真实远端读回、部分成功、只读 CLI 和 Final confirmation；不把 Explore PASS 或本地 bare 证明称为公网 PR/实际 D05 Full Test。
- [x] 5.3 用 OpenSpec strict 验证计划及实际 delta/main 场景覆盖，复核无无关主规范/历史迁移；检查本轮材料路径/来源和 Owner 保留边界可读，准备独立 review-apply 交接后 STOP，不自行 archive/commit/push。
