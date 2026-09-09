import {spawn} from 'node:child_process';
for(const [name,script] of [['immediate-exit',"process.stderr.write(Buffer.alloc(1024*1024,255));process.exit(7)"],['flush-before-exit',"process.stderr.write(Buffer.alloc(1024*1024,255),()=>process.exit(7))"]]) {
 const child=spawn(process.execPath,['-e',script],{stdio:['ignore','pipe','pipe']});
 let bytes=0;child.stderr.on('data',chunk=>bytes+=chunk.length);
 const exitCode=await new Promise(resolve=>child.on('close',resolve));
 console.log(JSON.stringify({name,exitCode,bytes,expected:1024*1024}));
}
