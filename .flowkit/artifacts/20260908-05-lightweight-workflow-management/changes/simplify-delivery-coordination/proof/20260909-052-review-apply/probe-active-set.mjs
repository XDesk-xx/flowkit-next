import fs from "node:fs/promises";
import path from "node:path";
import {pathToFileURL} from "node:url";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {mock} from "node:test";

const proof=".flowkit/artifacts/20260908-05-lightweight-workflow-management/changes/simplify-delivery-coordination/proof/20260909-052-review-apply";
const out=path.join(proof,"active-set-probe-01");
const save=(name,data)=>fs.writeFile(path.join(out,name),data,{flag:"wx"});
if(process.argv[2]!=="--child"){
  await fs.mkdir(out);
  const startedAt=new Date().toISOString(),stdout=[],stderr=[];
  let error=null,signal=null;
  const args=["--import","tsx",process.argv[1],"--child"];
  const exitCode=await new Promise(resolve=>{
    try{
      const child=spawn(process.execPath,args,{cwd:process.cwd(),windowsHide:true});
      child.stdout.on("data",b=>stdout.push(b));child.stderr.on("data",b=>stderr.push(b));
      child.on("error",e=>{error={code:e.code,message:e.message};});
      child.on("close",(code,s)=>{signal=s;resolve(code)});
    }catch(e){error={code:e.code,message:e.message};resolve(null);}
  });
  const ref=async(name,b)=>{await save(name,b);return{path:path.join(out,name).replaceAll("\\","/"),bytes:b.length,sha256:createHash("sha256").update(b).digest("hex")}};
  const metadata={kind:"reviewer-isolated-fault-probe",startedAt,completedAt:new Date().toISOString(),program:process.execPath,args,cwd:process.cwd(),node:process.version,platform:process.platform,exitCode,signal,error,stdout:await ref("stdout.txt",Buffer.concat(stdout)),stderr:await ref("stderr.txt",Buffer.concat(stderr)),formalD05FullTest:false};
  await save("command.json",JSON.stringify(metadata,null,2)+"\n");
  console.log(JSON.stringify(metadata));
  process.exitCode=exitCode??1;
}else{
  const imported=relative=>import(pathToFileURL(path.resolve(relative)).href);
  const {createFixture,acceptedOutcomes,evidenceSource,finalInput,deliveryId}=await imported("tests/unit/domain/delivery-final-fixture.ts");
  const {fixtureInstallation}=await imported("tests/unit/domain/manager-installation-fixture.ts");
  const {invokeDeliveryFinalOperation}=await imported("src/domain/delivery-final-execution.ts");
  const {readDeliveryFinalization}=await imported("src/domain/delivery-finalization.ts");
  const {observeOpenSpecActiveChanges}=await imported("src/domain/openspec-observation.ts");
  const outcomes=[];
  for(const mode of ["control","before-invoke","after-content-write","during-confirmation-staging"]){
    const f=await createFixture();
    // Use the repository's explicitly synthetic host and a fixture managed-tool process.
    // The tool process observes real directories; no actual D05 lifecycle is invoked.
    const changeRoot=path.join(f.root,"openspec/changes");
    await fs.mkdir(changeRoot,{recursive:true});
    await fs.writeFile(f.openspecEntrypoint,
      'const fs=require("node:fs"); const root='+JSON.stringify(f.root)+'; console.log(JSON.stringify({changes:fs.readdirSync('+JSON.stringify(changeRoot)+',{withFileTypes:true}).filter(x=>x.isDirectory()&&x.name!=="archive").map(x=>({name:x.name})),root:{path:root,source:"nearest"}}));\n');
    const addActive=async()=>{await fs.mkdir(path.join(changeRoot,"late-change"));await fs.writeFile(path.join(changeRoot,"late-change/proposal.md"),"## Why\nFixture active work\n");};
    const tested=await acceptedOutcomes(f);
    if(mode==="before-invoke")await addActive();
    const originalRename=fs.rename.bind(fs),originalOpen=fs.open.bind(fs);
    let renames=0,stages=0;
    mock.method(fs,"rename",async(...args)=>{
      await originalRename(...args);
      if(String(args[1])===f.manifestPath){renames++;if(renames===1&&mode==="after-content-write")await addActive();}
    });
    mock.method(fs,"open",async(...args)=>{
      if(String(args[0]).includes(path.basename(f.manifestPath))&&String(args[0]).endsWith(".tmp")){
        stages++;if(stages===2&&mode==="during-confirmation-staging")await addActive();
      }
      return originalOpen(...args);
    });
    let result;
    try{result=await invokeDeliveryFinalOperation(f.root,finalInput(f,tested),()=>({status:"ready"}),evidenceSource(tested,f.root),fixtureInstallation(f.root));}
    finally{mock.restoreAll();}
    const active=await observeOpenSpecActiveChanges({repositoryRoot:f.root,flowkitHome:f.flowkitHome});
    const observed=await readDeliveryFinalization(f.root,deliveryId);
    const manifest=await fs.readFile(f.manifestPath);
    await save(mode+".manifest.yaml",manifest);
    const entry={mode,fixture:f,syntheticHost:true,syntheticOpenSpecProcess:true,renames,stages,invocationStatus:result.status,reason:result.reason??null,mutationStatus:result.mutationStatus??null,activeChangeIds:active.changeIds,readerStatus:observed.status,record:observed.record,manifestSha256:createHash("sha256").update(manifest).digest("hex")};
    outcomes.push(entry);console.log(JSON.stringify(entry));
    if(mode==="control"){assert.equal(result.status,"terminal");assert.equal(active.changeIds.length,0);}
    else if(mode==="before-invoke"){assert.equal(result.status,"failed");assert.equal(renames,0);}
    else{assert.equal(result.status,"failed");assert.equal(result.mutationStatus,"written-unconfirmed");assert.equal(renames,1);assert.deepEqual(active.changeIds,["late-change"]);assert.equal(observed.status,"unconfirmed");assert.equal(observed.record,null);assert.match(manifest.toString("utf8"),/confirmationRef: null/);}
    // Retain only these explicitly created isolated fixtures; do not delete broad temp roots.
  }
  await save("observations.json",JSON.stringify({kind:"reviewer-active-set-drift-reproduction",expectation:"active work appearing before confirmation must not acquire Final success",candidateObservedContradiction:false,regressionClosed:true,syntheticFixtures:true,formalD05FullTest:false,outcomes},null,2)+"\n");
}
