import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root=import.meta.dirname;
const hash=b=>createHash('sha256').update(b).digest('hex');
const paths=["src/cli/action-command.ts","src/cli/action-protocol.ts","src/internal/action-run-reservation.ts","src/internal/action-proof.ts","src/internal/action-target-files.ts","tests/unit/domain/action-command.test.ts","tests/unit/domain/action-protocol.test.ts","tests/unit/domain/action-run-reservation.test.ts","tests/unit/domain/action-proof.test.ts","tests/unit/domain/action-native-process.test.ts"];
const reviewRoot='.flowkit/runs/20260908-05-lightweight-workflow-management/connect-openspec-action-workflow';
const review=JSON.parse(fs.readFileSync(reviewRoot+'/20260908-024-review-propose/result.json'));
const result=JSON.parse(fs.readFileSync(review.reviewedResult.path));
for(const ref of [review.reviewedResult,...result.artifacts])if(hash(fs.readFileSync(ref.path))!==ref.sha256)throw Error(ref.path);
if(review.verdict!=='approved'||review.nextBoundary!=='apply')throw Error('not approved');
for(const p of paths){const d=path.join(root,'removed-source',p);fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,fs.readFileSync(p),{flag:'wx'});}
const protectedPaths=[...result.artifacts.map(r=>r.path).filter(p=>!p.endsWith('/tasks.md')),'openspec/changes/connect-openspec-action-workflow/explore.md'];
for(const dir of fs.readdirSync(reviewRoot))for(const name of fs.readdirSync(reviewRoot+'/'+dir))if(!dir.includes('025-apply'))protectedPaths.push(reviewRoot+'/'+dir+'/'+name);
const manifest='openspec/delivery-groups/20260908-05-lightweight-workflow-management.yaml';
fs.writeFileSync(path.join(root,'prior-manifest.yaml'),fs.readFileSync(manifest),{flag:'wx'});
const record={startedAt:new Date().toISOString(),approvedReview:reviewRoot+'/20260908-024-review-propose/result.json',protected:protectedPaths.map(p=>({path:p,sha256:hash(fs.readFileSync(p))})),removedSources:paths.map(p=>({path:p,sha256:hash(fs.readFileSync(p))}))};
fs.writeFileSync(path.join(root,'baseline.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reviewVerified:true,protected:record.protected.length,backedUp:paths.length,startedAt:record.startedAt}));
