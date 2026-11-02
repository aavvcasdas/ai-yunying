// Three distinct scene studies, not a replacement movie or external-project screenshots.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
process.chdir(ROOT);
// Always use the actual production cues for these studies; no estimated timing file.
if(!process.argv.includes('--voice'))process.argv.push('--voice','Day9/配音/鲸鱼看视频_克隆配音_最终版.wav','--alignment','tools/day9制作/voice_alignment.json','--subtitle-file','tools/day9制作/subtitle_timing.json');
const {drawDay9Frame,configureScenePainters}=await import('./render_day9_v2.mjs');
const {createCanvas}=await import('../day8制作/render_day8.mjs');
const {paintMiniatureRoom,paintMiniatureStation,paintMiniatureTable}=await import('./visual_elements_v3.mjs');
configureScenePainters({room:paintMiniatureRoom,station:paintMiniatureStation,table:paintMiniatureTable});
const cues=JSON.parse(fs.readFileSync('tools/day9制作/voice_alignment.json','utf8')).cues;
const out=path.join(ROOT,'Day9/画面试样');fs.mkdirSync(out,{recursive:true});
const manifest={purpose:'visual_set_studies_only_not_a_rendered_new_movie',source_renderer:'render_day9_v2.mjs',external_code_or_assets_imported:false,studies:[]};
for(const [name,line,p]of[['修程序工位',1,.5],['观影区与热饭',33,.5],['电视内卫星锅场景',36,.65]]){
 const cue=cues[line-1],time=cue.start+(cue.end-cue.start)*p,c=createCanvas(1920,1080);
 drawDay9Frame(c.getContext('2d'),time);const file=path.join(out,`Day9_画面元素试样_${name}.png`);fs.writeFileSync(file,c.toBuffer('image/png'));
 manifest.studies.push({file:path.relative(ROOT,file),line,time,text:cue.text});console.log(file);
}
fs.writeFileSync('tools/day9制作/画面试样清单.json',JSON.stringify(manifest,null,2)+'\n');
