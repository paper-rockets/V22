import { bakeLineArt, findBlender } from './lib/lineart.mjs';
console.log('blender:', findBlender());
const t = Date.now();
const r = bakeLineArt('public/models/dutch_house.glb', { crease: 45, contour: true, cacheDir: './scripts/deconstruct3d/.cache' });
const lens = r.lines.map(l => { let L=0; for (let i=1;i<l.length;i++){const a=l[i-1],b=l[i];L+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);} return L; }).sort((a,b)=>a-b);
const pct=f=>lens[Math.floor((lens.length-1)*f)];
let min=[1e9,1e9,1e9],max=[-1e9,-1e9,-1e9];
for(const l of r.lines) for(const p of l) for(let k=0;k<3;k++){ if(p[k]<min[k])min[k]=p[k]; if(p[k]>max[k])max[k]=p[k]; }
console.log(`lines=${r.lines.length} points=${r.lines.reduce((a,l)=>a+l.length,0)} in ${((Date.now()-t)/1000).toFixed(1)}s cached=${r.cached}`);
console.log('length p10/p50/p90/max:', [0.1,0.5,0.9,1].map(f=>pct(f).toFixed(3)).join(' / '));
console.log('bounds min', min.map(v=>v.toFixed(2)).join(','), 'max', max.map(v=>v.toFixed(2)).join(','));
