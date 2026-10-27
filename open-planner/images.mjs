export const MAX_IMAGE_BYTES=2_000_000;
const LOCAL=/^\.\/(data\/images|assets\/food)\/[a-z0-9-]+\.(png|jpe?g|webp)$/;
export function imageReference(value,{embedded=false}={}){
  if(value===null||value==='')return null;
  if(typeof value!=='string')throw new Error('Billedet har et ugyldigt format.');
  if(!embedded&&LOCAL.test(value))return value;
  const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if(!match||match[2].length%4!==0||match[2].length>Math.ceil(MAX_IMAGE_BYTES/3)*4)throw new Error('Brug PNG, JPEG eller WebP på højst 2 MB pr. billede.');
  let bytes;try{bytes=Uint8Array.from(atob(match[2]),c=>c.charCodeAt(0));}catch{throw new Error('Billedet kunne ikke læses.');}
  if(bytes.length>MAX_IMAGE_BYTES)throw new Error('Billedet er over 2 MB.');
  const view=new DataView(bytes.buffer),str=(a,b)=>String.fromCharCode(...bytes.subarray(a,b));let width=0,height=0;
  if(match[1]==='png'&&bytes.length>=33&&str(1,4)==='PNG'&&bytes[0]===137&&str(12,16)==='IHDR'){
    width=view.getUint32(16);height=view.getUint32(20);
  }else if(match[1]==='webp'&&bytes.length>=30&&str(0,4)==='RIFF'&&str(8,12)==='WEBP'){
    const type=str(12,16);
    if(type==='VP8X'){width=1+bytes[24]+(bytes[25]<<8)+(bytes[26]<<16);height=1+bytes[27]+(bytes[28]<<8)+(bytes[29]<<16);}
    else if(type==='VP8L'&&bytes[20]===47){width=1+bytes[21]+((bytes[22]&63)<<8);height=1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10);}
    else if(type==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42){width=view.getUint16(26,true)&16383;height=view.getUint16(28,true)&16383;}
  }else if(match[1]==='jpeg'&&bytes.length>4&&bytes[0]===255&&bytes[1]===216){
    for(let offset=2;offset+8<bytes.length;){
      if(bytes[offset++]!==255)break;while(bytes[offset]===255)offset++;
      const marker=bytes[offset++];if(marker===218||marker===217)break;
      const length=view.getUint16(offset);if(length<2||offset+length>bytes.length)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=view.getUint16(offset+3);width=view.getUint16(offset+5);break;}offset+=length;
    }
  }
  if(!width||!height||width>4096||height>4096||width*height>16_000_000)throw new Error('Billedet er ugyldigt eller større end 4096 × 4096 pixels.');
  return value;
}
