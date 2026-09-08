import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {fileURLToPath} from "node:url";
import readline from "node:readline";
const proof=path.dirname(fileURLToPath(import.meta.url));
const save=(name,value)=>fs.writeFileSync(path.join(proof,name),JSON.stringify(value,null,2)+"\n",{flag:"wx"});
const inputPath="openspec/changes/connect-openspec-action-workflow/.openspec.yaml";
const bytes=fs.readFileSync(inputPath);
const request={kind:"reviewer-transport-feasibility-only",inputPath,task:"Read exact scaffold, return schema/created/sha256 through this process stdin",canonicalAction:false};
save("host-request.json",request);
console.log(JSON.stringify(request));
const lines=readline.createInterface({input:process.stdin});
let received=false;
for await(const line of lines){
 const response=JSON.parse(line);
 assert.equal(response.inputPath,inputPath);
 assert.equal(response.schema,"spec-driven");
 assert.equal(response.created,"2026-09-08");
 assert.equal(response.sha256,createHash("sha256").update(bytes).digest("hex"));
 save("host-response.json",response);
 save("host-summary.json",{completedAt:new Date().toISOString(),status:"PASS",actualHost:"current Reviewer Agent/terminal session",method:"one live Node process -> Agent reads actual scaffold -> stdin reply -> validation -> exit",requestCount:1,responseCount:1,nextInvocations:0,inputSha256:response.sha256,canonicalAction:false,meaning:"Transport feasibility only; no product Action, independent Review loop or two-Change acceptance."});
 received=true;break;
}
lines.close();
assert(received,"EOF without response is not success");
console.log("Transport verified; STOP.");
process.exit(0);

