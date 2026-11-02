import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,bg,reseedBoil} from '../day8制作/render_day8.mjs';
import {paintUnderseaRoom} from './undersea_elements_v4.mjs';
const hash=data=>createHash('sha256').update(data).digest('hex');
function image(paint,time=0){const c=createCanvas(1280,720),g=c.getContext('2d');reseedBoil(0);paint(g,{time});return g;}
test('original underwater wall and outer porthole rim stay unchanged',()=>{
 const old=image(g=>bg(g,0)),now=image(paintUnderseaRoom);
 for(const [x,y,w,h]of[[300,70,100,50],[65,230,10,14]]){
  assert.equal(hash(old.getImageData(x,y,w,h).data),hash(now.getImageData(x,y,w,h).data));
 }
});
test('underwater room remains dark blue, not the daytime room',()=>{
 const data=image(paintUnderseaRoom).getImageData(300,70,100,50).data;
 let red=0,blue=0;for(let i=0;i<data.length;i+=4){red+=data[i];blue+=data[i+2];}
 assert.ok(blue>red);assert.ok((red+blue)/(data.length/4*2)<85);
});
test('time-varying sea details stay confined to the original porthole',()=>{
 const a=image(paintUnderseaRoom,0).getImageData(0,0,1280,720).data;
 const b=image(paintUnderseaRoom,12).getImageData(0,0,1280,720).data;
 let changed=0;for(let p=0;p<1280*720;p++){
  const i=p*4;if(a[i]===b[i]&&a[i+1]===b[i+1]&&a[i+2]===b[i+2]&&a[i+3]===b[i+3])continue;
  changed++;const x=p%1280,y=Math.floor(p/1280);assert.ok(x>=80&&x<=216&&y>=168&&y<=304);
 }
 assert.ok(changed>0);
});
