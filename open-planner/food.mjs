import {QR} from './qr.mjs?v=20261027-db1';
import {escapeXml,fitText} from './model.mjs?v=20261027-db1';

export function foodGeometry(width,height){
  if(width<50||height<50)throw new Error('Madkort kræver mindst 50 × 50 mm.');
  const diameter=Math.min(38,width-31,height-24);
  const titleY=Math.max(9+diameter+3,29);
  return {photo:{x:5,y:9,diameter},qr:{x:width-22,y:3,size:19},title:{x:4,y:titleY,width:width-8,height:height-3-titleY}};
}

export function foodMarkup(card,width,height,measure,imageHref,uniqueId='card',options={}){
  const {background='#F5F0E8',ink='#28645F',showQr=true,showBranding=true,monochrome=false,includeMetadata=true}=options;
  const {photo,qr,title}=foodGeometry(width,height);
  const cx=photo.x+photo.diameter/2,cy=photo.y+photo.diameter/2;
  const clipId=`food-${uniqueId}`;
  const gray=monochrome?`<filter id="gray-${uniqueId}"><feColorMatrix type="saturate" values="0"/></filter>`:'';
  const photoMarkup=imageHref?`<defs><clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${photo.diameter/2}"/></clipPath>${gray}</defs><image x="${photo.x}" y="${photo.y}" width="${photo.diameter}" height="${photo.diameter}" ${monochrome?`filter="url(#gray-${uniqueId})"`:''} preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" href="${escapeXml(imageHref)}"/>`:`<circle cx="${cx}" cy="${cy}" r="${photo.diameter/2}" fill="white"/><text x="${cx}" y="${cy}" font-family="Nunito,sans-serif" font-size="2.3" text-anchor="middle" fill="${ink}">Billede mangler</text>`;
  const fitted=fitText(card.text,title.width,title.height,measure,4.5);
  const textTop=title.y+(title.height-fitted.lines.length*fitted.fontSize*1.25)/2;
  const text=fitted.lines.map((line,index)=>`<text x="${width/2}" y="${textTop+fitted.fontSize*(.94+index*1.25)}" font-family="Nunito,sans-serif" font-weight="800" font-size="${fitted.fontSize}" fill="${ink}" text-anchor="middle">${escapeXml(line)}</text>`).join('');
  const qrMarkup=showQr&&showBranding?`<g class="food-qr"${includeMetadata?` data-payload="${QR.url}"`:''} transform="translate(${qr.x} ${qr.y})"><rect width="${qr.size}" height="${qr.size}" fill="white"/><path d="${QR.path}" fill="black" transform="scale(${qr.size/QR.size})" shape-rendering="crispEdges"/></g><text x="${qr.x+qr.size/2}" y="25" font-size="2.1" text-anchor="middle" fill="${ink}" font-family="Nunito,sans-serif">extruda.dk</text>`:'';
  return `<g class="food-card" transform="translate(${card.x} ${card.y})"><rect class="card-boundary" width="${width}" height="${height}" fill="${background}" stroke="${ink}" stroke-width=".2"/>${photoMarkup}<circle class="photo-ring" cx="${cx}" cy="${cy}" r="${photo.diameter/2+.3}" fill="none" stroke="${ink}" stroke-width=".6"/>${qrMarkup}${text}</g>`;
}
