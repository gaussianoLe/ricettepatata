import {readFileSync,writeFileSync} from 'node:fs';
import {parseMarkdown,readCatalog} from '../src/catalog/io.mjs';
const routes=JSON.parse(readFileSync('src/catalog/legacy-routes.json','utf8'));
const ingredients={
 'pitta-di-patate':[['patata','patate',1,'kg'],['cipolla','cipolle',2,'piece'],['pomodoro','pomodori pelati',300,'g'],['pecorino','pecorino',60,'g'],['olio-extravergine','olio extravergine',3,'tbsp'],['pangrattato','pangrattato',30,'g']],
 rosti:[['patata','patate',700,'g'],['burro','burro',40,'g'],['sale','sale',null,'qb'],['pepe','pepe',null,'qb']],
 'aloo-gobi':[['patata','patate',500,'g'],['cavolfiore','cavolfiore piccolo',1,'piece'],['cipolla','cipolla',1,'piece'],['curcuma','curcuma',1,'tsp'],['cumino','cumino',1,'tsp'],['olio','olio',3,'tbsp'],['sale','sale',null,'qb']],
 hasselback:[['patata','patate medie',4,'piece'],['burro','burro',40,'g'],['rosmarino','rosmarino',null,'qb'],['sale','sale',null,'qb']],
 gnocchi:[['patata','patate farinose',700,'g'],['farina','farina, più altra per il piano',180,'g'],['uovo','uovo',1,'piece'],['sale','sale',null,'qb']],
 'patatas-bravas':[['patata','patate',700,'g'],['pomodoro','passata di pomodoro',200,'g'],['paprika','paprika affumicata',1,'tsp'],['peperoncino','peperoncino',null,'qb'],['olio','olio',3,'tbsp'],['sale','sale',null,'qb']],
};
const metadata={
 'pitta-di-patate':['Pitta di patate','it','europe','IT','Italia','Salento','Cucina salentina','piatto-unico',['bollitura','forno'],'sformati'],
 rosti:['Rösti','de-CH','europe','CH','Svizzera',null,'Cucina svizzera','contorno',['padella'],'frittelle'],
 'aloo-gobi':['Aloo gobi','hi-Latn','asia','IN','India',null,'Cucina indiana','piatto-unico',['stufatura'],'stufati'],
 hasselback:['Hasselbackspotatis','sv','europe','SE','Svezia',null,'Cucina svedese','contorno',['forno'],'patate-arrosto'],
 gnocchi:['Gnocchi di patate','it','europe','IT','Italia',null,'Cucina italiana','primo',['bollitura'],'gnocchi'],
 'patatas-bravas':['Patatas bravas','es','europe','ES','Spagna',null,'Cucina spagnola','snack',['forno','stufatura'],'patate-arrosto'],
};
let changed=0;
for(const [route,catalogId] of Object.entries(routes)) {
 const file=`src/content/${route}.md`;
 const {data:old,body}=parseMarkdown(readFileSync(file,'utf8'));
 if(old.schemaVersion===1) continue;
 const [collection,slug]=route.split('/');
 const common={schemaVersion:1,catalogId,slug,names:{italian:old.title,original:{text:old.title,language:'it'},alternatives:[]},description:old.description,date:String(old.date),demo:true,editorial:{status:'draft',author:'RicettePatata.it'},sources:[{id:'prototipo-p0',kind:'internal',title:'Prototipo P0 — contenuto non verificato',url:`https://github.com/gaussianoLe/ricettepatata/blob/dc72557/src/content/${route}.md`,author:'RicettePatata.it',accessedAt:'2026-11-09'}],notes:[],externalIds:[]};
 let record;
 if(collection==='ricette') {
  const [original,language,continent,code,name,region,tradition,course,methods,family]=metadata[slug];
  common.names.original={text:original,language};
  if(slug==='rosti') common.names.alternatives=[{text:'Rosti',language:'it'}];
  if(slug==='hasselback') common.names.alternatives=[{text:'Patate a ventaglio',language:'it'}];
  record={...common,provenance:{continent,country:{code,name},region,traditions:[tradition]},taxonomy:{courses:[course],cookingMethods:methods,families:[family],occasions:['quotidiano']},potatoRole:'protagonist',relation:{kind:'primary'},timing:{prepMinutes:old.prep,cookMinutes:old.cook,restMinutes:0},servings:old.servings,ingredients:ingredients[slug].map(([ingredientId,name,value,unit])=>({id:ingredientId,ingredientId,name,quantity:{value,unit},optional:false})),steps:old.steps.map((text,index)=>({id:`step-${index+1}`,text,ingredientIds:[]})),color:old.color};
 } else record={...common,topics:collection==='guide'?['tecnica','patate']:['cultura','patate'],relatedRecipeIds:[]};
 writeFileSync(file,`---\n${JSON.stringify(record,null,2)}\n---\n${body}`);changed++;
}
readCatalog();
console.log(`Migrazione P0: ${changed} file aggiornati; ID e slug dal registro storico.`);
