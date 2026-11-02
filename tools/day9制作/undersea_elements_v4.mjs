// Keep the established Day8/Day9 underwater room; enhance depth, not the location.
import {bg} from '../day8制作/render_day8.mjs';
import {block} from './visual_elements_v3.mjs';
export function paintUnderseaRoom(g,{time=0}={}){
 bg(g,0);
 g.save();
 // The original round porthole and its rim remain in exactly their old location.
 g.beginPath();g.arc(148,236,66,0,Math.PI*2);g.clip();
 const sea=g.createLinearGradient(0,170,0,304);sea.addColorStop(0,'#26526B');sea.addColorStop(1,'#0A283E');g.fillStyle=sea;g.fillRect(80,168,136,138);
 g.fillStyle='#87CDD512';for(let i=0;i<3;i++){g.beginPath();g.moveTo(96+i*42,168);g.lineTo(110+i*42,168);g.lineTo(157+i*42,307);g.lineTo(128+i*42,307);g.fill();}
 // Marine silhouettes and slow bubbles stay INSIDE the sea window, not over the cast.
 for(let i=0;i<2;i++){const x=120+i*52+Math.sin(time*.22+i)*8,y=224+i*31;g.fillStyle=i?'#629DAA':'#83BAC3';g.beginPath();g.ellipse(x,y,12,5,0,0,Math.PI*2);g.fill();g.beginPath();g.moveTo(x-10,y);g.lineTo(x-19,y-6);g.lineTo(x-19,y+6);g.fill();}
 g.strokeStyle='#8EC7CF66';g.lineWidth=1;for(let i=0;i<5;i++){const x=101+i*24,y=301-((time*6+i*27)%134);g.beginPath();g.arc(x,y,2+i%2,0,Math.PI*2);g.stroke();}
 g.restore();
 // Add visible top / side / front faces to the EXISTING tables and shelves only.
 block(g,250,516,400,20,11,{front:'#675348',top:'#9E8564',side:'#453C43'});
 block(g,742,494,330,24,12,{front:'#71553F',top:'#B0956D',side:'#463C3B'});
 for(const y of[296,402])block(g,1010,y+8,230,8,7,{front:'#71635D',top:'#A18C73',side:'#4B4654'});
 // Subtle contact shading on the existing floor, not a new floor or a daytime room.
 g.save();g.globalAlpha=.12;g.fillStyle='#0B1229';for(const [x,w]of[[470,210],[910,168]]){g.beginPath();g.ellipse(x,598,w,15,0,0,Math.PI*2);g.fill();}g.restore();
}
