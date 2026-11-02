// Independently drawn Canvas set studies. No voxel-mv code, images, fonts or models imported.
// Generic visual ideas: layered miniature sets, soft warm/cool light, dimensional props.
const P={wall:'#D8DEE1',side:'#BCCBD0',floor:'#B7C5C7',top:'#F0E5CA',front:'#B59C7D',edge:'#8F8177'};
function rect(g,x,y,w,h,color,r=0){g.fillStyle=color;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();}
function poly(g,points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function line(g,x,y,xx,yy,color,width=1){g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function oval(g,x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();}
export function block(g,x,y,w,h,d=12,{front=P.front,top=P.top,side=P.edge}={}){
 poly(g,[[x,y-h],[x+d,y-h-d*.55],[x+w+d,y-h-d*.55],[x+w,y-h]],top);
 poly(g,[[x+w,y-h],[x+w+d,y-h-d*.55],[x+w+d,y-d*.55],[x+w,y]],side);
 rect(g,x,y-h,w,h,front,2);
}
function softShadow(g,x,y,w,h,alpha=.14){
 g.save();const grad=g.createRadialGradient(x,y,1,x,y,w);grad.addColorStop(0,`rgba(67,64,91,${alpha})`);grad.addColorStop(1,'rgba(67,64,91,0)');g.translate(x,y);g.scale(1,h/w);g.fillStyle=grad;g.beginPath();g.arc(0,0,w,0,Math.PI*2);g.fill();g.restore();
}
function plant(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);softShadow(g,12,1,41,12);block(g,-17,0,34,30,10,{front:'#A98B79',top:'#DCC7AB',side:'#8C7C75'});for(let i=0;i<5;i++){const a=(i-2)*.37,dx=Math.sin(a)*45;line(g,0,-29,dx,-80-i%2*15,'#6C958D',3);poly(g,[[dx,-70],[dx-13,-88],[dx+5,-95],[dx+9,-77]],i%2?'#729E92':'#92B6A2');}g.restore();}
function shelf(g,x,y,s=1){g.save();g.translate(x,y);g.scale(s,s);block(g,0,0,170,160,16,{front:'#8C9E9F',side:'#78898F',top:'#C6D0C7'});rect(g,8,-149,154,140,'#BBC7BD');for(let j=0;j<2;j++){block(g,6,-69+j*66,158,9,12,{front:'#AC967C',side:'#917E72',top:'#DCC8A6'});for(let i=0;i<5;i++)block(g,17+i*27,-79+j*66,18,31+(i%3)*6,5,{front:['#D9B49A','#93B0B4','#C6BBA5','#A6BBA5','#B7A9BE'][i],side:'#8E9694',top:'#EAE1CC'});}g.restore();}
function windowPane(g,x,y,w,h){
 block(g,x-8,y+h+8,w+16,h+16,10,{front:'#94ABAE',top:'#E5E6D9',side:'#82999F'});
 const sky=g.createLinearGradient(x,y,x,y+h);sky.addColorStop(0,'#A6C8D3');sky.addColorStop(1,'#E4E8DD');rect(g,x,y,w,h,sky,3);
 poly(g,[[x,y+h],[x,y+h*.72],[x+w*.35,y+h*.34],[x+w*.64,y+h*.8],[x+w,y+h*.54],[x+w,y+h]],'#C6D5D5');
 rect(g,x+w*.5-3,y,6,h,'#E4E7DA');rect(g,x,y+h*.59,w,5,'#E4E7DA');
 block(g,x-15,y+h+14,w+30,11,17,{front:'#A2B7B7',top:'#EEF0DC',side:'#90A5AB'});
}
function tiles(g,{x=0,y=410,w=1280,h=310,near='#BAC6C9',far='#D3D9D4'}={}){
 const fill=g.createLinearGradient(0,y,0,y+h);fill.addColorStop(0,far);fill.addColorStop(1,near);rect(g,x,y,w,h,fill);
 const vx=x+w*.51,vy=y-110;
 g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 for(let i=-9;i<=16;i++)line(g,vx,vy,x+i*w/7,y+h,'#788E9940',1);
 for(let i=0;i<9;i++){const py=y+h*(i/8)**1.6;line(g,x,py,x+w,py,'#87989E55',1);}
 g.restore();
}
export function paintMiniatureRoom(g,{work=false}={}){
 g.save();
 const wall=g.createLinearGradient(0,0,1200,430);wall.addColorStop(0,'#EEE3D3');wall.addColorStop(.56,'#D9DFDD');wall.addColorStop(1,'#BACBD2');rect(g,0,0,1280,720,wall);
 poly(g,[[0,0],[240,0],[240,382],[0,445]],'#C3CFD0');
 line(g,240,0,240,382,'#A9B9BE',2);line(g,0,445,240,382,'#A6B5B8',4);line(g,240,382,1280,382,'#ABBABD',4);
 rect(g,242,290,1038,90,'#C0CED0');for(let i=0;i<11;i++)rect(g,258+i*99,304,79,58,'#B8C7CB',3);
 tiles(g,{y:385,h:335,near:'#ACBBC5',far:'#CDD5D4'});
 block(g,242,396,1038,14,8,{front:'#91A5AE',top:'#D4DED9',side:'#9FAEB3'});
 // Window / shelves are set landmarks, maintained across the work and viewing scenes.
 windowPane(g,472,61,268,159);shelf(g,1088,279,.9);
 // Low storage lives behind the acting strip; it never crosses faces or the TV screen.
 block(g,575,422,285,53,18,{front:'#9DAFAD',top:'#DEDBBF',side:'#8B9EA2'});
 for(let i=0;i<3;i++){rect(g,589+i*88,382,74,31,'#BAC8BE',3);rect(g,616+i*88,394,21,3,'#819595');}
 // Real fixture, not a halo attached to a character.
 line(g,955,0,955,67,'#9EAAA7',3);block(g,893,86,124,21,13,{front:'#C5B6A0',top:'#F2E3C4',side:'#A69A8C'});
 const light=g.createLinearGradient(0,90,0,366);light.addColorStop(0,'rgba(255,239,203,.18)');light.addColorStop(1,'rgba(255,239,203,0)');poly(g,[[903,88],[1010,88],[1157,366],[758,366]],light);
 // Dedicated floor zones clarify the two workstations, or the viewing area.
 if(work){
  softShadow(g,343,594,174,36,.10);softShadow(g,901,595,155,32,.10);
  poly(g,[[175,619],[480,619],[513,579],[212,579]],'#A5B9BE');
  poly(g,[[757,619],[1042,619],[1075,579],[790,579]],'#A5B9BE');
 }else{
  softShadow(g,337,611,224,53,.12);
  poly(g,[[39,634],[501,634],[551,585],[90,585]],'#B4ADB5');
  poly(g,[[58,627],[487,627],[521,592],[98,592]],'#C6BDC2');
 }
 plant(g,38,645,.67);
 // Front corner gives a foreground plane, with all detail below the actors' faces.
 block(g,1189,675,91,49,22,{front:'#A9B7B3',top:'#DDD8BD',side:'#8E9FA6'});
 block(g,1210,618,47,17,9,{front:'#B5A48E',top:'#EAD6AF',side:'#A08E83'});
 g.restore();
}
export function paintMiniatureStation(g,t,outside=false){
 g.save();
 if(outside){
  const sky=g.createLinearGradient(0,0,0,360);sky.addColorStop(0,'#AAC6D3');sky.addColorStop(1,'#E5ECE4');rect(g,0,0,640,360,sky);
  for(let i=0;i<4;i++)poly(g,[[i*190-70,245],[i*190+35,70+(i%2)*33],[i*190+135,245]],i%2?'#C2D4DA':'#E9F0E9');
  tiles(g,{y:243,w:640,h:117,near:'#D9E5E7',far:'#ECF0E7'});
  block(g,402,264,191,152,25,{front:'#A1B9BE',top:'#D9E4DD',side:'#7B99A7'});
  block(g,420,171,57,46,7,{front:'#DCEBE4',top:'#F2F1E2',side:'#7895A2'});
  block(g,510,265,57,112,6,{front:'#668C9B',top:'#9EB7BC',side:'#597E90'});rect(g,551,205,4,16,'#D8D7BA');
  block(g,499,276,85,10,13,{front:'#A6B8B8',top:'#EEF1E4',side:'#839EA7'});
  for(let i=0;i<14;i++){const x=(i*67+t*9)%640,y=48+i*23%230;rect(g,x,y,2,3,'#F5F7EC');}
 }else{
  const wall=g.createLinearGradient(0,0,640,270);wall.addColorStop(0,'#E5D8BC');wall.addColorStop(1,'#B8C9CA');rect(g,0,0,640,360,wall);
  rect(g,0,203,640,66,'#B0C2C1');for(let i=0;i<9;i++)line(g,i*82,206,i*82,267,'#96ADAF',2);
  tiles(g,{y:267,w:640,h:93,near:'#B5BAB2',far:'#CFD0BD'});
  windowPane(g,33,47,213,132);shelf(g,464,220,.87);
  // Low supply boxes and a bench: a complete station, not an isolated sprite on a colour field.
  block(g,36,287,194,16,18,{front:'#AB9479',top:'#E0CDAB',side:'#958775'});
  for(const x of[50,204])block(g,x,335,12,47,8,{front:'#A28F78',top:'#D9C8A9',side:'#8F8275'});
  block(g,534,266,57,35,10,{front:'#B3A38A',top:'#DDD1AF',side:'#938C7E'});
  line(g,350,0,350,34,'#A1ADA5',2);block(g,316,47,69,12,9,{front:'#C1B18B',top:'#F0DFB2',side:'#A89E89'});
 }
 g.restore();
}
export function paintMiniatureTable(g){
 softShadow(g,444,343,147,12,.11);
 block(g,279,292,310,18,18,{front:'#B09576',top:'#EBDBC0',side:'#988573'});
 for(const x of[297,558])block(g,x,351,12,59,8,{front:'#A28D75',top:'#C8B799',side:'#8D7F73'});
}
