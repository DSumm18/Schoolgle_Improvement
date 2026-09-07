import './discovery-exhibition.css';

const drawings={
 letter:'<path d="M24 30h72v52H24z"/><path d="m24 30 36 28 36-28M24 82l25-26m47 26L71 56"/><circle cx="60" cy="59" r="9"/>',
 boat:'<path d="M15 73h90L88 93H33zM60 18v55M57 23 29 65h28zm7 1v41h25z"/><path d="M18 102q12-8 24 0t24 0 24 0"/>',
 jar:'<path d="M45 22h30v13c0 11 23 18 23 41 0 22-17 27-38 27S22 98 22 76c0-23 23-30 23-41z"/><path d="M37 59h46M30 76h60M39 91h42M42 22h36"/>',
 lantern:'<path d="M43 31v-8a17 17 0 0 1 34 0v8M34 33h52l-7 61H41zM30 100h60M49 38l-2 48m26-48 2 48"/><path d="m60 46 9 17-9 16-9-16z"/>',
 river:'<path d="M70 15C15 40 101 56 48 78s3 28 3 28M88 15C33 40 119 56 66 78s3 28 3 28M14 49h17m-12-8v17M82 91h20m-10-9v18"/>',
 star:'<path d="m60 16 13 28 31 4-23 22 6 32-27-15-27 15 6-32-23-22 31-4z"/><circle cx="60" cy="62" r="10"/>'
};
const text=value=>String(value??'').slice(0,4000);
function element(tag,className,content){const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=text(content);return node;}
function object(icon){const node=element('span','discovery-object');node.innerHTML=`<svg viewBox="0 0 120 120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${drawings[icon]||drawings.star}</svg>`;return node;}

// Items must be earned discoveries supplied by the caller. This view reads them;
// it never awards gems, writes saves, invents answers or accepts HTML from data.
export function createDiscoveryExhibition({game='nile',title='Your discovery exhibition',intro,items=[],onRecall,onRevisit,recallId}={}){
 const entries=Array.isArray(items)?items.slice(0,12):[],root=element('section','discovery-exhibition');root.dataset.theme=['plot','fire','nile'].includes(game)?game:'nile';
 const hero=element('header','discovery-exhibition-hero'),heading=element('div');heading.append(element('span','discovery-kicker','MADE FROM YOUR DISCOVERIES'),element('h3','',title),element('p','',intro||'You followed the clues and made choices. Now explore the story you pieced together.'));
 const seal=element('div','discovery-seal');seal.append(element('strong','',entries.length),element('span','','discoveries'));hero.append(heading,seal);root.append(hero);
 if(!entries.length){root.append(element('p','','Your first discovery will appear here after you finish an activity.'));return root;}
 root.append(element('p','discovery-instruction','Tap a discovery to put it in the spotlight.'));
 const collection=element('div','discovery-collection');collection.setAttribute('aria-label','Your discoveries');
 const detail=element('section','discovery-spotlight');detail.setAttribute('aria-live','polite');detail.setAttribute('aria-atomic','true');
 const buttons=[];
 function select(index,bringIntoView=false){const item=entries[index];buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));detail.replaceChildren();const visual=element('div','discovery-plinth');visual.append(object(item.icon),element('small','','DISCOVERY '+(index+1)));
  const copy=element('div','discovery-response'),detailHeading=element('h4','',item.title);detailHeading.tabIndex=-1;const back=element('button','discovery-back','← All discoveries');back.type='button';back.onclick=()=>{buttons[index].focus({preventScroll:true});collection.scrollIntoView({block:'start',behavior:'instant'});};copy.append(back,element('span','discovery-kicker','YOUR SPOTLIGHT'),detailHeading);if(item.context)copy.append(element('p','discovery-context',item.context));
  const responses=Array.isArray(item.responses)?item.responses.slice(-8):item.response?[{label:item.responseLabel||'Your saved choice',text:item.response}]:[];
  if(responses.length){const list=element('div','discovery-answers');for(const response of responses){const entry=element('div','discovery-answer');entry.append(element('span','',response.label||'Your saved choice'),element('blockquote','',response.text));list.append(entry);}copy.append(list);}else copy.append(element('p','discovery-older','This discovery is saved. An answer was not kept in this older record.'));
  const support=(Array.isArray(item.support)?item.support:[item.support]).filter(Boolean);if(support.length){const note=element('details','discovery-support');note.append(element('summary','','Help along the way'));const list=element('ul');support.forEach(s=>list.append(element('li','',s)));note.append(list);copy.append(note);}
  if(typeof onRevisit==='function'){const revisit=element('button','discovery-secondary','Visit this discovery again');revisit.type='button';revisit.onclick=()=>onRevisit(index,item);copy.append(revisit);}const navigation=element('div','discovery-navigation');for(const [label,next]of [['← Previous',index-1],['Next discovery →',index+1]]){if(next<0||next>=entries.length)continue;const b=element('button','discovery-secondary',label);b.type='button';b.onclick=()=>select(next,true);navigation.append(b);}copy.append(navigation);detail.append(visual,copy);if(bringIntoView){detailHeading.focus({preventScroll:true});detail.scrollIntoView({block:'start',behavior:'instant'});}
 }
 entries.forEach((item,index)=>{const b=element('button','discovery-tile');b.type='button';b.dataset.discovery=String(index);b.append(element('span','discovery-number',String(index+1).padStart(2,'0')),object(item.icon),element('strong','',item.title));if(item.label)b.append(element('small','',item.label));b.onclick=()=>select(index,true);buttons.push(b);collection.append(b);});root.append(collection,detail);select(0);
 const story=element('details','discovery-story');story.append(element('summary','','How your discoveries connect'));const trail=element('ol','discovery-story-trail');entries.forEach(item=>{const step=element('li');step.append(element('strong','',item.title));if(item.context)step.append(element('p','',item.context));trail.append(step);});story.append(trail);root.append(story);
 const footer=element('footer','discovery-exhibition-footer');footer.append(element('p','','These illustrated symbols celebrate your discoveries. The choices shown here come from your saved game.'));
 if(typeof onRecall==='function'){const invite=element('div','discovery-return');invite.append(element('div','','Come back another day and see what you remember.'));const b=element('button','discovery-primary','Try a return challenge');b.type='button';b.dataset.exhibitionRecall='';if(recallId)b.id=text(recallId);b.onclick=onRecall;invite.append(b);footer.append(invite);}root.append(footer);return root;
}
