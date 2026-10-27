// Requirements: Node.js, sharp, FFmpeg (FFMPEG_PATH). No network calls.
const fs=require('fs'),path=require('path'),{spawn,spawnSync}=require('child_process');
const sharp=require('sharp');
const {once}=require('events');
const {frame}=require('./frames.cjs');
const out=path.resolve(__dirname,'..'),ff=process.env.FFMPEG_PATH;
if(!ff)throw Error('Set FFMPEG_PATH to the local FFmpeg executable.');
const themes=process.argv.length>2?process.argv.slice(2):['light','dark','bw','black'];
if(themes.some(theme=>!['light','dark','bw','black'].includes(theme)))throw Error('Unknown theme.');
function svg(t,theme){let s=frame(t).replace('width="1200" height="480"','width="3840" height="1536"');
 if(theme==='dark')s=s.replace(/#F5F0E8/g,'#252C2C').replace(/#(?:343B3B|619B98|E8B08E|28645F)/g,'#FFFFFF');
 if(theme==='bw')s=s.replace(/#F5F0E8/g,'#FFFFFF').replace(/#(?:343B3B|619B98|E8B08E|28645F)/g,'#000000');
 if(theme==='black')s=s.replace(/#F5F0E8/g,'#000000').replace(/#(?:343B3B|619B98|E8B08E|28645F)/g,'#FFFFFF');
 return s;
}
function run(args){const r=spawnSync(ff,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw Error(r.stderr);}
(async()=>{for(const theme of themes){
 const name='extruda-logo-'+theme;
 const proc=spawn(ff,['-y','-f','image2pipe','-framerate','50','-i','pipe:0','-i',path.join(out,'extruda-logo-audio.wav'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-c:a','aac','-b:a','320k','-t','3.6','-movflags','+faststart',path.join(out,name+'-4k.mp4')],{stdio:['pipe','ignore','pipe']});
 let errors='';proc.stderr.on('data',b=>errors+=b.toString());
 const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',c=>c===0?resolve():reject(Error(errors)));});
 proc.stdin.on('error',()=>{});
 let previousSvg='',previousPng;
 for(let n=0;n<180;n++){const currentSvg=svg(n/50,theme);const png=currentSvg===previousSvg?previousPng:await sharp(Buffer.from(currentSvg)).png().toBuffer();previousSvg=currentSvg;previousPng=png;if(!proc.stdin.write(png))await once(proc.stdin,'drain');}
 proc.stdin.end();await done;
 console.log(theme+': 4K MP4 ready');
 run(['-y','-i',path.join(out,name+'-4k.mp4'),'-i',path.join(out,'extruda-logo-audio.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=1920:768:flags=lanczos','-c:v','libvpx-vp9','-b:v','0','-crf','24','-row-mt','1','-cpu-used','4','-c:a','libopus','-b:a','192k','-t','3.6',path.join(out,name+'-web.webm')]);
 fs.writeFileSync(path.join(out,name+'-poster.svg'),svg(3.5,theme));
 await sharp(Buffer.from(svg(3.5,theme))).png().toFile(path.join(out,name+'-poster.png'));
 console.log(theme+': WebM and posters ready');
 }})().catch(e=>{console.error(e);process.exitCode=1;});
