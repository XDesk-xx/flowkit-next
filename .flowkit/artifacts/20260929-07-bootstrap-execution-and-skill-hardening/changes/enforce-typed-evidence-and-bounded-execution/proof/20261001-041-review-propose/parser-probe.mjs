import assert from 'node:assert/strict';
import {parseFoundationCliArguments,parseFoundationCliRequest} from '../src/cli/request.ts';
const observations=[];
for(const command of ['status','next','doctor']){
 const accepted=parseFoundationCliArguments([command,'--input','-']);
 let rejected=null;try{parseFoundationCliArguments([command,'--repository-root','D:/isolated-target-a','--input','-']);}catch(e){rejected={kind:e.kind,message:e.message};}
 assert.equal(rejected?.kind,'invalid-arguments');
 const targets=['D:/isolated-target-a','D:/isolated-target-b'].map(repositoryRoot=>parseFoundationCliRequest(command,{repositoryRoot,flowkitHome:'C:/Users/xuser/.flowkit'}).request.repositoryRoot);
 assert.notEqual(targets[0],targets[1]);
 observations.push({command,acceptedArguments:accepted,visibleTargetRejected:rejected,sameArgvAcceptsJsonTargets:targets});
}
console.log(JSON.stringify({observations,limit:'Pure current request-parser probe, no project queries or mutations; demonstrates missing visible-target binding for status/next/doctor, not host rule evaluation.'}));
