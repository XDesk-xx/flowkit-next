import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {EventEmitter} from 'node:events';
import {mkdtemp,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {executeScopedCheckpoint} from '../src/internal/git-checkpoint-execution.ts';
import {gitBytes,readPendingPaths} from '../src/internal/git-checkpoint-scope.ts';
const root=await mkdtemp(path.join(process.cwd(),'.tmp/reviewer045-pipe-'));
await gitBytes(root,['init','-b','main']);await writeFile(path.join(root,'a.txt'),'bounded fixture\n');
const original=childProcess.execFile;let childComplete=false,addCalls=0,complete;
const completed=new Promise(resolve=>{complete=resolve;});
childProcess.execFile=function(program,args,options,callback){
 if(program==='git'&&args.includes('--pathspec-from-file=-')){
  addCalls++;
  const stdin=new EventEmitter();
  stdin.end=()=>{
   // Model a pipe error before the still-running child finishes its effects.
   queueMicrotask(()=>stdin.emit('error',Object.assign(new Error('injected stdin EPIPE before child exit'),{code:'EPIPE'})));
   setTimeout(()=>original('git',['add','--','a.txt'],{cwd:root,windowsHide:true},error=>{
    childComplete=true;callback(error??Object.assign(new Error('injected nonzero response after stage'),{code:23}));complete();
   }),800);
  };
  return {stdin};
 }
 return original.apply(this,arguments);
};
syncBuiltinESMExports();
let observation;
try{
 const outcome=await executeScopedCheckpoint(root,'main',{kind:'create-new',paths:['a.txt'],commitMessage:'review fixture',commitShape:null},async()=>true);
 observation={outcome,childCompleteAtReturn:childComplete,indexAtReturn:await readPendingPaths(root)};
 await completed;
 observation.indexAfterChildComplete=await readPendingPaths(root);observation.childComplete=childComplete;observation.addCalls=addCalls;
 assert.equal(observation.childCompleteAtReturn,false);assert.deepEqual(observation.indexAtReturn,[]);assert.deepEqual(observation.indexAfterChildComplete,['a.txt']);assert.equal(addCalls,1);
}finally{childProcess.execFile=original;syncBuiltinESMExports();}
console.log(JSON.stringify({scope:'Injected process ordering with one real delayed Git add in an isolated fixture; not a claim that native Git normally closes stdin early.',root,...observation}));
