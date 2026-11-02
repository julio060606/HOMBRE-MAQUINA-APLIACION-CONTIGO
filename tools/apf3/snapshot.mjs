import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import{execFileSync}from'node:child_process';
const root=path.resolve(import.meta.dirname,'../..'),out=path.join(root,'output/apf3/evidence/after');await fs.mkdir(out,{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const scope=['frontend/src','frontend/index.html','frontend/package.json','frontend/package-lock.json','frontend/vite.config.ts','frontend/tailwind.config.js','frontend/tsconfig.json'];
const tracked=git('ls-files','--',...scope).trim().split('\n').filter(Boolean),untracked=git('ls-files','--others','--exclude-standard','--',...scope).trim().split('\n').filter(Boolean);
const files=[];for(const file of [...new Set([...tracked,...untracked])].sort()){
  try{const buffer=await fs.readFile(path.join(root,file));files.push({path:file.replaceAll('\\','/'),bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),tracked:tracked.includes(file)});}catch(error){if(error.code!=='ENOENT')throw error;files.push({path:file,deleted:true});}
}
let patch=git('diff','--no-ext-diff','--binary','HEAD','--',...scope);
for(const file of untracked){const content=await fs.readFile(path.join(root,file),'utf8'),lines=content.replaceAll('\r\n','\n').split('\n');if(lines.at(-1)==='')lines.pop();patch+=`diff --git a/${file} b/${file}\nnew file mode 100644\n--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${lines.length} @@\n`+lines.map(line=>`+${line}\n`).join('');}
await fs.writeFile(path.join(out,'git-diff.patch'),patch);
const manifest={timestamp:new Date().toISOString(),baselineCommit:'4656d72365080d18b267f69d565e4d77a7ae3d56',currentHead:git('rev-parse','HEAD').trim(),state:'v3 source is working-tree modifications, not a new commit; hashes and patch identify inspected source',hashAlgorithm:'SHA-256',scope,files,patch:{path:'output/apf3/evidence/after/git-diff.patch',sha256:crypto.createHash('sha256').update(patch).digest('hex')},excluded:['Environment files, credentials, node_modules, build output, real patient data']};
await fs.writeFile(path.join(out,'source-manifest.json'),JSON.stringify(manifest,null,2));console.log(`Snapshot: ${files.length} files, ${untracked.length} new source files, patch ${Buffer.byteLength(patch)} bytes`);
