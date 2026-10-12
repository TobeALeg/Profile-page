import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
for(const file of ['index.html','system-tokens.css','portfolio.css','assets']) fs.cpSync(file,`dist/${file}`,{recursive:true});
fs.mkdirSync('dist/output/playwright',{recursive:true});
fs.cpSync('output/playwright/jetbao','dist/output/playwright/jetbao',{recursive:true});
console.log('Built dependency-free static portfolio in dist/');
