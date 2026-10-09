# Apply 验证与交接

Change：allow-prepared-author-same-stage-continuation。
执行方式：Owner 明确指定直接 OpenSpec，当前 Apply 使用仓库候选验证，不建立本 Change 的 Flowkit Run 或独立 Reviewer verdict。

## 实现结果

仅修改三个生产文件：

- src/domain/action-lifecycle.ts：prepared supersession 不再拒绝同 identity revise；保留 prepared Author、revise target、same Delivery/Change、closed boundary核对，普通 prepare不变。
- src/domain/policy-and-next-boundary.ts：无 correction 时保持 same identity reuse；有 correction 时统一核对 supersession，先沿用完整 prepared pair、四槽 null、阶段与 Owner规则。
- src/cli/current-run-chain.ts：同名 prepared revise child 必须通过 child 绑定 authority 的 correction Policy；不从 normal reuse READY fallback。

现有 start、prepared-owner-correction-start、finish、inspect消费这三处修复，无需新增入口实现、状态、字段或依赖。docs/onboarding.md补充续跑与普通 READY区别；所有 skills/actions bytes保持原样。测试扩展四个已有模块并新增 prepared-author-continuation.test.ts；旧合法不同 identity及普通 prepared历史读取兼容保留。

## 验证

| 验证 | 结果 | 真实记录 |
| --- | --- | --- |
| 相关 domain/CLI回归（12 个文件） | 67/67 PASS | evidence/related-regressions.json |
| 最终源码的 lifecycle/Policy/chain/helper | 36/36 PASS | evidence/final-domain.json |
| 最终隔离安装包：三个阶段多轮续跑及固定入口反例 | 6/6 PASS | evidence/installed-continuation-final.json |
| 最终隔离安装 acceptance | 7 PASS、1 SKIP、0 FAIL | evidence/installed-acceptance-final.json |
| typecheck、build、quality:gate | exitCode=0 | evidence/code-checks.json |
| OpenSpec strict validate | exitCode=0 | evidence/spec-check.json |
| 包/安装资产与原件兼容 | 139 文件、11 Guidance核对通过；原 Run/Proof不变 | evidence/package-compatibility.json |

6 个安装包测试包含三个阶段各自的普通 prepared → revise prepared → 同名 prepared → 同名 terminal PASS，每次独立 CLI start/inspect/finish/query，最后对应 Review start仅绑定最新 Author。每轮保存并比较旧三文件/真实 fixture Proof bytes；同时测试缺/错授权、普通 target、forward skip、prepared Reviewer/Archive、partial、占用 successor、descriptor parent/Owner drift、duplicate finish冲突和幂等读回。合成 fixture角色/结论不构成实际独立 Review。

条件跳过项是原 native Windows exact OpenSpec专项；当前环境没有启用其专用执行条件。本次安装测试不声称该专项或 Linux detached whole-manager Formal Full Test已运行。未修改生产 imports，任务中的条件性 dependency-health/entropy重跑不适用。

实现过程中 typecheck指出新测试误写 readonly字段，已改为不可变构造；quality:gate指出 Policy超出650行两行，已按相同语义缩短分支。最终 typecheck/build/gate及核心/装包复验通过；这些问题没有改变规划合同。

原始 stdout/stderr 已按 Buffer bytes保存到 .flowkit/artifacts/allow-prepared-author-same-stage-continuation/verification/，对应 JSON记录留在本 Change evidence并引用实际路径、bytes、SHA-256。16 个日志均确认 Git raw/clean blob一致，未追加 attributes或修改原始流。这里是直接 OpenSpec工作的实际 Verification材料，不是 Action Run、Result或第二份生命周期记录。

## 安装与真实输入兼容

候选包 SHA-256：830bd98eaaa49051bbd7636234b72fa5422bbfc974c7ab5773cf840f945e9158。
包大小：203,086 bytes。
隔离安装根：D:/Projects/flowkit-next/.tmp/prepared-continuation-package/install-final/node_modules/flowkit-next。

139 个实际 package payload逐一比对；除打包 metadata外源/安装文件原字节一致。package.json的 tar/安装字节一致，与原固定 manager metadata一致；打包观测到仅省略 source的 packageManager及 scripts.prepack，没有其他语义变化。包和临时安装可从当前源码重新生成，不作为 lifecycle authority。

对 LearningPlatform Run 20261008-015-revise-apply，仅执行候选只读 status/next/inspect与原件校验：

- complete / prepared / author，原三文件 hash等于 Apply/Explore基线。
- 337 个已声明 Proof文件的大小/hash全部匹配，集合摘要仍为 df6ab224a1d680697f8ddcf5052c46a74c0b6bbdb033a1c1c6be7cf2c23efc37。
- 新候选保留原 descriptor Guidance身份，能检查该当前完整 Run；normal next仍展示 revise-apply，不自行创建后继。

固定 manager安装来源仍为 flowkit-next-1.0.0-0e0d8106d2cd.tgz。本次未更新它，未创建原项目 Run 016，未执行 B 的业务开发或 Git mutation。

## 交接边界

13 项任务已完成。当前结论是 Author实现及 Verification交接，可进行独立 review-apply；不是 Reviewer批准、Archive、Formal Full Test或checkpoint。

本次新增材料与源码/测试/文档仍为未提交工作树事实。相关基线是 HEAD 0e0d8106d2cdf632e9aacbc61311cbe6e6d762db；已有 Explore/Proposal/spec/design及其原 evidence保留。后续独立 Review消费当前 diff、四份delta specs及上述必要验证记录，不用旧基线探针充当新实现 PASS。Git、固定 manager更新和原项目实际续跑按其独立明确边界处理。
