export function sheetMarkup({cards,index,plan,state,renderCard,font=''}){
  const {pageWidth:w,pageHeight:h,pages}=plan;
  const label=state.showBranding?'Open Planner':'Kortark';
  const description=state.includeMetadata?` role="img" aria-label="Ark ${index+1} af ${pages.length}"><title>${label} · ark ${index+1} af ${pages.length}</title>`:'>';
  const footer=state.showFooter?`<g fill="#343B3B" font-family="Nunito,sans-serif" font-size="2.7"><text x="10" y="${h-13}">${state.showBranding?'Open Planner · ':''}${state.cardWidth} × ${state.cardHeight} mm</text><text x="10" y="${h-8}">Ark ${index+1} / ${pages.length} · A4 · print 100 %</text><path d="M${w-60} ${h-10}h50m-50-1.5v3m50-3v3" stroke="#343B3B" stroke-width=".25" fill="none"/><text x="${w-35}" y="${h-5}" text-anchor="middle">Kontrolmål: 50 mm</text></g>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="sheet" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}"${description}${font}<rect width="${w}" height="${h}" fill="white"/>${cards.map((card,i)=>renderCard(card,`${index}-${i}`)).join('')}${footer}</svg>`;
}
