// Suggested grade placements are editorial. Source links point to competency areas,
// not an official per-year syllabus. Mapping awaits subject-specialist review.
export const curriculumSources={kindergarten:'https://www.retsinformation.dk/eli/lta/2024/1716/pdf',math:'https://www.retsinformation.dk/eli/lta/2024/1715'};
export const extendedFamilies=[
 [0,'match-quantity','Forbind antal og tal','Match quantities and numbers','numbers','match','exact'],
 [0,'draw-quantity','Tegn en mængde','Draw a quantity','numbers','draw','criteria'],
 [0,'order-cards','Ordn talkort','Order number cards','numbers','order','exact'],
 [0,'shape-pattern','Fortsæt figurmønster','Continue the shape pattern','patterns','pattern','exact'],
 [0,'sort-shapes','Sortér former','Sort shapes','geometry','shape-sort','exact'],
 [0,'positions','Over og under','Above and below','geometry','position','exact'],
 [0,'compare-length','Sammenlign længder','Compare lengths','measurement','length-compare','exact'],
 [0,'collect-count','Find ting og tæl dem','Collect and count objects','data','collect','criteria'],
 [1,'tens-ones','Byg med tiere og enere','Build tens and ones','numbers','place-build','exact'],
 [1,'numberline-jumps','Hop på tallinjen','Jump on the number line','addition','jump','exact'],
 [1,'ten-bonds','Find tiervenner','Make ten','addition','bonds','exact'],
 [1,'picture-story','Regn i billedhistorier','Solve picture stories','problems','story','exact'],
 [1,'shape-properties','Figurers egenskaber','Properties of shapes','geometry','shape-sides','exact'],
 [1,'unit-length','Mål med ens enheder','Measure with equal units','measurement','unit-length','exact'],
 [1,'clock-simple','Læs klokken','Read the clock','measurement','clock','exact'],
 [1,'pictogram','Læs et billeddiagram','Read a pictogram','data','pictogram','exact'],
 [2,'place-value','Pladsværditabel','Place value table','numbers','place-table','exact'],
 [2,'regroup','Regn med tierovergang','Calculate across tens','addition','regroup','exact'],
 [2,'equal-groups','Lige store grupper','Equal groups','multiplication','groups','exact'],
 [2,'sharing','Fordel ligeligt','Share equally','division','sharing','exact'],
 [2,'shopping','Køb for et beløb','Shopping with a budget','problems','shopping','exact'],
 [2,'ruler','Mål med lineal','Measure with a ruler','measurement','ruler','tolerance'],
 [2,'explain-pattern','Forklar talmønsteret','Explain the number pattern','patterns','explain-pattern','criteria'],
 [2,'bar-chart','Byg et søjlediagram','Build a bar chart','data','draw-chart','criteria'],
 [3,'explain-strategy','Vis din regnestrategi','Show your strategy','problems','strategy','criteria'],
 [3,'multiply-divide','Gange og division hænger sammen','Multiplication and division are linked','division','inverse','exact'],
 [3,'fraction-intro','Halve og fjerdedele','Halves and quarters','fractions','shade-fraction','criteria'],
 [3,'elapsed-time','Hvor lang tid går der?','How much time passes?','measurement','elapsed','exact'],
 [3,'estimate-measure','Anslå og mål','Estimate and measure','measurement','measure-object','criteria'],
 [3,'perimeter','Find omkredsen','Find the perimeter','geometry','perimeter','exact'],
 [3,'read-data','Læs et søjlediagram','Read a bar chart','data','read-chart','exact'],
 [3,'chance-trial','Undersøg chancen','Explore probability','chance','chance-trial','criteria'],
 [4,'fraction-model','Sammenlign brøker','Compare fractions','fractions','compare-fractions','exact'],
 [4,'decimal-money','Regn med kroner og øre','Calculate kroner and øre','decimals','decimal-money','exact'],
 [4,'larger-products','Større gange og division','Larger multiplication and division','multiplication','large-product','exact'],
 [4,'choose-operation','Vælg regningsart','Choose the operation','problems','choose-operation','criteria'],
 [4,'area-perimeter','Areal og omkreds','Area and perimeter','geometry','area','exact'],
 [4,'reflection','Spejl figuren','Reflect the shape','geometry','reflection','criteria'],
 [4,'coordinates','Find koordinater','Find coordinates','geometry','coordinates','exact'],
 [4,'compare-data','Sammenlign datasæt','Compare data sets','data','compare-data','criteria']
].map(([grade,id,da,en,goal,type,answerPolicy])=>({id:'plan-'+id,goal,da,en,shortDa:'Løs opgaven. Brug tegning eller forklaring, hvor der er brug for det.',shortEn:'Solve the task. Draw or explain where needed.',grades:[grade],type,answerPolicy,revision:1,status:'pilot',curriculumStatus:'proposed-needs-subject-review',curriculumStage:grade===0?0:grade===4?6:3,curriculumSource:grade===0?curriculumSources.kindergarten:curriculumSources.math,domain:grade===0?'mathematical-awareness':['geometry','measurement'].includes(goal)?'geometry-measurement':['data','chance'].includes(goal)?'statistics-probability':goal==='problems'?'competencies':'numbers-algebra'}));

export function makeExtendedItems(family,random){
 const int=(lo,hi)=>lo+Math.floor(random()*(hi-lo+1));
 return Array.from({length:4},(_,index)=>{
  const q={type:family.type,a:int(1,9),b:int(1,5),answerPolicy:family.answerPolicy};
  const criterion=(da,en)=>{q.answerDa=da;q.answerEn=en;q.answer=da;};
  switch(q.type){
   case'match':q.a=int(1,10);q.choices=[q.a+1,q.a,Math.max(0,q.a-1)];{const rotation=int(0,2);q.choices=q.choices.slice(rotation).concat(q.choices.slice(0,rotation));}q.answer=q.a;break;
   case'draw':q.a=int(0,10);criterion(`Tegningen skal vise præcis ${q.a} ting.`,`The drawing must show exactly ${q.a} objects.`);break;
   case'order':{const values=new Set();while(values.size<4)values.add(int(0,20));q.values=[...values];q.answer=[...values].sort((a,b)=>a-b).join(', ');break;}
   case'pattern':q.shapes=random()<.5?['circle','triangle']:['square','circle'];q.answerDa=q.shapes[0]==='circle'?'cirkel':'kvadrat';q.answerEn=q.shapes[0];q.answer=q.answerDa;break;
   case'shape-sort':q.shapes=['circle','square','triangle','circle','square','circle'];q.answer=3;break;
   case'position':q.above=random()<.5;q.answerDa=q.above?'over':'under';q.answerEn=q.above?'above':'below';q.answer=q.answerDa;break;
   case'length-compare':q.a=int(2,4);q.b=int(5,8);q.reverse=random()<.5;q.answer=q.reverse?'A':'B';break;
   case'collect':q.a=int(3,8);criterion(`Barnet finder ${q.a} ting og tæller én gang pr. ting.`,`Find ${q.a} objects and count each once.`);break;
   case'place-build':q.a=int(1,9);q.b=int(0,9);q.answer=q.a*10+q.b;break;
   case'jump':q.a=int(0,15);q.b=int(1,5);q.answer=q.a+q.b;break;
   case'bonds':q.a=int(0,10);q.answer=10-q.a;break;
   case'story':q.a=int(1,12);q.b=int(0,20-q.a);q.answer=q.a+q.b;break;
   case'shape-sides':q.shape=['triangle','square','pentagon'][index%3];q.answer={triangle:3,square:4,pentagon:5}[q.shape];break;
   case'unit-length':q.a=int(2,8);q.answer=q.a;break;
   case'clock':q.hour=int(1,12);q.minute=random()<.5?0:30;q.answer=`${String(q.hour).padStart(2,'0')}:${String(q.minute).padStart(2,'0')}`;break;
   case'pictogram':q.values=[int(1,6),int(1,6),int(1,6)];q.answer=q.values.reduce((a,b)=>a+b,0);break;
   case'place-table':q.a=int(100,999);q.answer=`${Math.floor(q.a/100)} | ${Math.floor(q.a/10)%10} | ${q.a%10}`;break;
   case'regroup':q.a=int(1,7)*10+int(5,9);q.b=int(5,9);q.answer=q.a+q.b;break;
   case'groups':q.a=int(2,5);q.b=int(2,5);q.answer=q.a*q.b;break;
   case'sharing':q.a=int(2,6);q.b=int(2,5);q.total=q.a*q.b;q.answer=q.a;break;
   case'shopping':q.a=int(2,8)*5;q.b=int(1,q.a-1);q.answer=q.a-q.b;break;
   case'ruler':q.a=int(2,5);q.answer=`${q.a} cm (± 1 mm)`;q.answerEn=`${q.a} cm (± 1 mm)`;break;
   case'explain-pattern':q.a=int(0,10);q.b=int(2,5);criterion(`Mønsteret vokser med ${q.b}. Næste tal: ${q.a+3*q.b}.`,`The pattern increases by ${q.b}. Next number: ${q.a+3*q.b}.`);break;
   case'draw-chart':q.values=[int(1,5),int(1,5),int(1,5)];criterion(`Søjlehøjder A/B/C: ${q.values.join('/')}. En enhed pr. felt.`,`Bar heights A/B/C: ${q.values.join('/')}. One unit per square.`);break;
   case'strategy':q.a=int(20,70);q.b=int(10,29);criterion(`Summen er ${q.a+q.b}. Se efter en korrekt metode; fx opdeling i tiere og enere.`,`Sum: ${q.a+q.b}. Accept any correct strategy, e.g. splitting tens and ones.`);break;
   case'inverse':q.a=int(2,10);q.b=int(2,10);q.total=q.a*q.b;q.answer=q.b;break;
   case'shade-fraction':q.b=index%2===0?2:4;q.a=1;criterion(`Én af ${q.b} lige store dele skal være farvet.`,`Shade one of ${q.b} equal parts.`);break;
   case'elapsed':q.start=int(8,14)*60+int(0,3)*15;q.duration=int(1,6)*15;q.end=q.start+q.duration;q.answer=`${q.duration} min`;break;
   case'measure-object':q.object=['blyant','bog','bordkant'][index%3];q.objectEn=['pencil','book','table edge'][index%3];criterion('Svar afhænger af genstanden. Se efter et overslag og korrekt måling fra linealens nulpunkt med enhed.','Answers vary. Look for an estimate and a measurement from the zero mark, with a unit.');break;
   case'perimeter':q.a=int(2,9);q.b=int(2,7);q.answer=`${2*(q.a+q.b)} cm`;break;
   case'read-chart':q.values=[int(1,8),int(1,8),int(1,8)];q.target=index%3;q.answer=q.values[q.target];break;
   case'chance-trial':q.trials=6;criterion('Registrér seks terningkast. Resultater kan variere; hvert udfald skal være fra 1 til 6. Der forventes ikke lige mange af hvert tal.','Record six die rolls. Results vary; every outcome must be 1–6. Equal frequencies are not expected.');break;
   case'compare-fractions':q.d=int(2,8);q.a=int(1,q.d);q.b=int(1,q.d);q.answer=q.a>q.b?'>':q.a<q.b?'<':'=';break;
   case'decimal-money':q.a=int(1,49)*100+int(0,19)*5;q.b=int(1,29)*100+int(0,19)*5;q.answer=((q.a+q.b)/100).toFixed(2).replace('.',',')+' kr.';q.answerEn=((q.a+q.b)/100).toFixed(2)+' DKK';break;
   case'large-product':q.a=int(12,99);q.b=int(2,9);q.divide=index%2===1;q.answer=q.divide?q.a:q.a*q.b;break;
   case'choose-operation':q.a=int(3,9);q.b=int(4,12);criterion(`${q.a} × ${q.b} = ${q.a*q.b}. Acceptér en tilsvarende sum af lige store grupper.`,`${q.a} × ${q.b} = ${q.a*q.b}. An equivalent repeated-addition expression is valid.`);break;
   case'area':q.a=int(2,9);q.b=int(2,8);q.answer=`${q.a*q.b} cm²; ${2*(q.a+q.b)} cm`;break;
   case'reflection':q.points=[[int(1,3),1],[int(1,3),3],[int(1,3),5]];criterion(`Spejlpunkter: ${q.points.map(([x,y])=>`(${8-x},${y})`).join(', ')}. Forbind i samme rækkefølge.`,`Reflected points: ${q.points.map(([x,y])=>`(${8-x},${y})`).join(', ')}. Join in the same order.`);break;
   case'coordinates':q.a=int(1,5);q.b=int(1,5);q.answer=`(${q.a}, ${q.b})`;break;
   case'compare-data':q.values=[int(2,8),int(2,8),int(2,8)];q.other=[int(2,8),int(2,8),int(2,8)];{const sum=q.values.reduce((a,b)=>a+b),other=q.other.reduce((a,b)=>a+b);criterion(`I alt: hold A ${sum}, hold B ${other}. ${sum===other?'Lige mange.':`Hold ${sum>other?'A':'B'} har ${Math.abs(sum-other)} flere.`}`,`Totals: team A ${sum}, team B ${other}. ${sum===other?'Equal totals.':`Team ${sum>other?'A':'B'} has ${Math.abs(sum-other)} more.`}`);}break;
   default:throw Error('Unknown extended exercise type: '+q.type);
  }
  return q;
 });
}
