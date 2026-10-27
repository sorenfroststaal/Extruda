// Local export only. Requirements: Node.js, sharp, FFmpeg (FFMPEG_PATH).
const fs=require('fs'),path=require('path'),{spawn,spawnSync}=require('child_process');
const {once}=require('events'),sharp=require('sharp'),{frame}=require('./frames.cjs');
const out=path.resolve(__dirname,'..'),ff=process.env.FFMPEG_PATH;
if(!ff)throw Error('Set FFMPEG_PATH to your local FFmpeg executable.');
const name='extruda-logo-transparent';
function svg(t){return frame(t).replace('width="1200" height="480"','width="3840" height="1536"').replace('<rect width="1200" height="480" fill="#F5F0E8"/>','');}
function run(args){const r=spawnSync(ff,args,{encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw Error(r.stderr);}
(async()=>{
 const proc=spawn(ff,['-y','-f','image2pipe','-framerate','50','-i','pipe:0','-i',path.join(out,'extruda-logo-audio.wav'),'-map','0:v:0','-map','1:a:0','-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-alpha_bits','16','-qscale:v','12','-vendor','apl0','-c:a','pcm_s16le','-t','3.6',path.join(out,name+'-4k.mov')],{stdio:['pipe','ignore','pipe']});
 let errors='';proc.stderr.on('data',b=>errors+=b.toString());proc.stdin.on('error',()=>{});
 const done=new Promise((resolve,reject)=>{proc.on('error',reject);proc.on('close',c=>c===0?resolve():reject(Error(errors)));});
 let previousSvg='',previousPng;
 for(let n=0;n<180;n++){const s=svg(n/50);const png=s===previousSvg?previousPng:await sharp(Buffer.from(s)).png().toBuffer();previousSvg=s;previousPng=png;if(!proc.stdin.write(png))await once(proc.stdin,'drain');}
 proc.stdin.end();await done;
 console.log('Transparent 4K ProRes 4444 MOV ready');
 run(['-y','-i',path.join(out,name+'-4k.mov'),'-i',path.join(out,'extruda-logo-audio.wav'),'-map','0:v:0','-map','1:a:0','-vf','scale=1920:768:flags=lanczos','-c:v','libvpx-vp9','-pix_fmt','yuva420p','-auto-alt-ref','0','-b:v','0','-crf','24','-row-mt','1','-cpu-used','4','-c:a','libopus','-b:a','192k','-t','3.6',path.join(out,name+'-web.webm')]);
 fs.writeFileSync(path.join(out,name+'-poster.svg'),svg(3.5));
 await sharp(Buffer.from(svg(3.5))).png().toFile(path.join(out,name+'-poster.png'));
 console.log('Transparent WebM, PNG and SVG ready');
})().catch(e=>{console.error(e);process.exitCode=1;});
