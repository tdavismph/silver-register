/* ---------- volunteer tier: the checks, the monthly visit, flags, and the coordinator's work ----------
   Wording of the six checks was agreed with Tom Davis on November 21, 2026 ("SILVER volunteer visit checks: draft instruments").
   Yes is the safe answer on every item except the first hearing question, which keeps its published wording.
   The volunteer measures, observes and records. The app decides what is passed up; the volunteer never interprets. */
const YNV=[["y","Yes"],["n","No"]],YNX=[["y","Yes"],["n","No"],["x","Could not check"]],YNXA=YNX.concat([["na","Does not apply"]]),YNS=[["y","Yes"],["n","No"],["ns","Not sure"]];
const CHK={
 heat:{n:"Heating check",when:"October to December, once each season",src:"National Institute on Aging; NFPA",opts:YNX,items:[
  "Is the heat working today?","Is the room where the person spends the day at 68°F or warmer? (Read the room thermometer.)","Is there enough fuel, or money for the bill, to last the next month?","Is the household free of any shutoff notice for electricity or fuel?",
  "Is every space heater at least 3 feet from anything that can burn?","Is every electric space heater plugged straight into the wall, with no extension cord?","Is the home heated without using the oven or the stove top?",
  "Is there a working smoke alarm? (Press the test button.)","Is there a working carbon monoxide alarm? (Press the test button.)","If wood is burned: was the chimney or flue cleaned or inspected in the past year?"],na:[4,5,9]},
 cool:{n:"Cooling check",when:"May to July, once each season",src:"CDC; National Institute on Aging",opts:YNX,items:[
  "Is there a working air conditioner in the home?","Is there a working fan?","Last summer, was the home kept cool enough?","Is there a cooler place the person can get to on a very hot day?","Does someone check on the person on very hot days?","Is the household free of any shutoff notice for electricity?"]},
 vax:{n:"Vaccine checklist",when:"September to November, once each season",src:"CDC adult immunization schedule",opts:YNS,items:[
  "Have you had a flu shot since August?","Have you had a COVID-19 shot since August?","Have you ever had a pneumonia shot?","Have you had both doses of the shingles shot (Shingrix)?","Have you had the RSV shot?"],short:["Flu","COVID-19","Pneumonia","Shingles","RSV"]},
 home:{n:"Home safety check",when:"At enrollment, then once a year, and after any fall",src:"CDC, Check for Safety (2017)",opts:YNX,items:[
  "Stairs and steps: are they clear of shoes, papers and other objects?","Stairs and steps: are all the steps in good repair, with none broken or uneven?","Stairs and steps: is there a working light for the stairs?","Stairs and steps: is there a sturdy handrail on both sides?",
  "Floors: is there a clear pathway through each room, with no furniture, cords or clutter to step around?","Floors: are throw rugs absent, or held down with tape or a non-slip backing?","Kitchen: are the things used most often kept within easy reach, at about waist height?",
  "Bedroom: is there a lamp that can be reached from the bed?","Bedroom: is the pathway from the bed to the bathroom lit at night?","Bathroom: is there a non-slip mat or strips in the tub or shower?","Bathroom: is there a grab bar by the tub or shower?","Bathroom: is there a grab bar beside the toilet?"],na:[0,1,2,3]},
 mood:{n:"Mood questions (PHQ-2)",when:"Every three months",src:"Patient Health Questionnaire-2, published wording; a score of 3 or more of 6 is passed up",opts:[["0","Not at all"],["1","Several days"],["2","More than half the days"],["3","Nearly every day"]],
  lead:"Over the last 2 weeks, how often have you been bothered by any of the following problems?",items:["Little interest or pleasure in doing things","Feeling down, depressed, or hopeless"]},
 food:{n:"Food questions (Hunger Vital Sign)",when:"Every three months",src:"Hunger Vital Sign, published wording (© 2010 Hager, Quigg and Children's HealthWatch; confirm permission before real use)",opts:[["o","Often true"],["s","Sometimes true"],["n","Never true"]],
  lead:"For each statement, was it often true, sometimes true, or never true for your household in the past 12 months?",items:["Within the past 12 months we worried whether our food would run out before we got money to buy more.","Within the past 12 months the food we bought just didn't last and we didn't have money to get more."]},
 vis:{n:"Vision check",when:"Once a year",src:"USPSTF 2022; American Academy of Ophthalmology",opts:YNV,items:[
  "With your glasses on, do you see well enough for everyday tasks?","Can you read the print on your medicine bottles?","Can you recognize a person's face across the room?","Have you had an eye exam in the past two years? (In the past year, if the person has diabetes.)","Over the past month, has your sight stayed the same?"]},
 hear:{n:"Hearing check",when:"Once a year",src:"USPSTF 2021",opts:YNV,items:[
  "Do you have difficulty with your hearing?","Do you have hearing aids?","Do you wear them on most days?","Has anyone tested your hearing in the past two years?","Your own observation: could the person follow the conversation today without your repeating yourself or raising your voice?"]}};
const CHKS=Object.keys(CHK);
/* Which items are asked, given the answers so far (hearing and cooling have follow-up questions). */
function asked(c,a,i){if(c==="hear")return i===0||i===4||(i===1&&a[0]==="y")||(i===2&&a[1]==="y")||(i===3&&a[0]==="y");if(c==="cool"&&i===1)return a[0]==="n";return true;}
const itemOpts=(c,i)=>(CHK[c].na||[]).includes(i)?YNXA:CHK[c].opts;
const FLAGTXT={bp:"Blood pressure above the line on the card",mood:"Mood questions: score above the line on the card",fall:"A fall since the last visit",meds:"Medicines ran out or were not refilled",food:"Food questions: a positive answer",
 home:"Home safety check: one or more No answers",heat:"Heating check: No on heat, warmth, fuel or shutoff",heatsafe:"Heating check: No on a fire or alarm item",cool:"Cooling check: one or more No answers",vax:"Vaccine checklist: a No or Not sure",vision:"Vision check: one or more No answers",hearing:"Hearing check",safety:"Safety concern"};
for(const k in FLAGS)delete FLAGS[k];for(const k in FLAGTXT)FLAGS[k]=[FLAGTXT[k],k==="vax"?"clinic":"coord"];
const CLINICT=["bp","mood","fall","meds","safety"],JOBT=["home","heatsafe"];
const CACT=["Passed to the clinic","Put on the handyman work list","Resource referral made","Asked the volunteer to follow up at the next visit","No action needed"];
const VITEMS=["Blood pressure cuff","Wall log for readings","Night lights or non-slip strips","Pill organizer","Fan","Food box"];
const MODULES=["Blood pressure","Diabetes detection","Immunization","Tobacco","Activity, strength and balance","Nutrition","Vision and hearing","Home safety and safe temperatures","Depression and social connection","Benefits and transport"];
S.v=[];S.job=[];S.mt=[];IX.vp={};
const visitsOf=pid=>IX.vp[pid]||[];
function addVisit(v){S.v.push(v);(IX.vp[v.p]=IX.vp[v.p]||[]).push(v);}
const lastVisit=pid=>{const a=visitsOf(pid);return a[a.length-1]||null};
const lastDone=(pid,c,before)=>{const a=visitsOf(pid).filter(v=>v.checks[c]&&v.d<=before);return a.length?a[a.length-1].d:null};
/* The checks due for a person on a date, most pressing first. */
function dueChecks(pid,d){const out=[],y=+d.slice(0,4),m=+d.slice(5,7),since=(c,from)=>{const l=lastDone(pid,c,d);return !l||l<from};
  if(m>=10&&since("heat",y+"-10-01"))out.push("heat");
  if(m>=5&&m<=7&&since("cool",y+"-05-01"))out.push("cool");
  if(m>=9&&m<=11&&since("vax",y+"-09-01"))out.push("vax");
  const lh=lastDone(pid,"home",d),fell=visitsOf(pid).some(v=>v.ev.fall==="y"&&v.d<=d&&(!lh||v.d>lh));
  if(!lh||diff(d,lh)>365||fell)out.push("home");
  for(const c of["mood","food"]){const l=lastDone(pid,c,d);if(!l||diff(d,l)>=85)out.push(c);}
  for(const c of["vis","hear"]){const l=lastDone(pid,c,d);if(!l||diff(d,l)>365)out.push(c);}
  return out;}
const above=(bp,line)=>bp&&(bp.s>=line[0]||bp.di>=line[1]);
/* What a visit passes up. Returns [{type, detail, urg}]. */
function visitFlags(v){const out=[],add=(type,detail,urg)=>out.push({type,detail,urg:!!urg}),C=v.checks,no=(c,idx)=>idx.filter(i=>C[c][i]==="n").map(i=>CHK[c].items[i]),all=c=>CHK[c].items.map((x,i)=>i);
  if(v.ev.safety==="y")add("safety",v.safeNote||"",true);
  if(v.bp){const prev=visitsOf(v.p).filter(x=>x.d<v.d&&x.bp).pop();
    if(above(v.bp,CFG.bp.now))add("bp","Reading "+v.bp.s+"/"+v.bp.di+", at or above "+CFG.bp.now.join("/"),true);
    else if(above(v.bp,CFG.bp.report)&&prev&&above(prev.bp,CFG.bp.report))add("bp","Two visits in a row at or above "+CFG.bp.report.join("/")+": "+prev.bp.s+"/"+prev.bp.di+" on "+fmtD(prev.d)+", then "+v.bp.s+"/"+v.bp.di);}
  if(v.ev.fall==="y")add("fall","");if(v.ev.meds==="y")add("meds","");
  if(C.mood){const sc=(+C.mood[0])+(+C.mood[1]);if(sc>=3)add("mood","PHQ-2 score "+sc+" of 6",true);}
  if(C.food&&(C.food[0]!=="n"||C.food[1]!=="n"))add("food","");
  if(C.home){const n=no("home",all("home"));if(n.length)add("home",n.join(" | "));}
  if(C.heat){const u=no("heat",[0,1,2,3]),r=no("heat",[4,5,6,7,8,9]);if(u.length)add("heat",u.join(" | "),true);if(r.length)add("heatsafe",r.join(" | "));}
  if(C.cool){const a=C.cool,r=no("cool",[2,3,4,5]);if(a[0]==="n"&&a[1]==="n")add("cool","No working air conditioner and no working fan",true);else if(r.length)add("cool",r.join(" | "));}
  if(C.vax){const g=CHK.vax.short.filter((x,i)=>C.vax[i]!=="y");if(g.length)add("vax","Gaps reported: "+g.join(", "));}
  if(C.vis){if(C.vis[4]==="n")add("vision","Sight has changed in the past month",true);else{const n=no("vis",[0,1,2,3]);if(n.length)add("vision",n.join(" | "));}}
  if(C.hear){const a=C.hear,t=[];if(a[0]==="y")t.push("Reports difficulty hearing");if(a[1]==="n")t.push("No hearing aids");if(a[2]==="n")t.push("Has hearing aids, does not wear them"+(v.hearWhy?" ("+v.hearWhy+")":""));if(a[3]==="n")t.push("No hearing test in two years");if(a[4]==="n")t.push("Had trouble following conversation");if(t.length)add("hearing",t.join(" | "));}
  return out;}
/* Turns what a visit passes up into flags. A routine flag is not repeated while one of the same kind is open, a blood pressure flag not within 90 days,
   and a vaccine gap is not sent to the clinic for a person seen there within CFG.noRepeat days. Urgent flags always pass. */
function raiseFlags(v){const made=[],held=[];
  for(const x of visitFlags(v)){const same=S.flag.filter(f=>f.p===v.p&&f.type===x.type);
    if(!x.urg){if(same.some(f=>f.status==="open")){held.push(FLAGS[x.type][0]+" (already open)");continue;}
      if(x.type==="bp"&&same.some(f=>diff(v.d,f.d)<90)){held.push(FLAGS.bp[0]+" (flagged within 90 days)");continue;}
      const c=lastCk(v.p);if(x.type==="vax"&&c&&diff(v.d,c.d)>=0&&diff(v.d,c.d)<=CFG.noRepeat){held.push(FLAGS.vax[0]+" (seen at the clinic on "+fmtD(c.d)+")");continue;}}
    const f={id:uid("f"),p:v.p,v:v.id,d:v.d,by:v.vol,type:x.type,detail:x.detail,urg:x.urg,to:FLAGS[x.type][1],status:"open"};S.flag.push(f);made.push(f);}
  return{made,held};}
function addJob(f){const j={id:uid("j"),p:f.p,f:f.id,d:f.d,items:f.detail.split(" | "),status:"open"};S.job.push(j);return j;}

/* ---------- example data for the volunteer tier ---------- */
function simVisits(R,N,pick,ch,ri){const mon=months(),ACT=["Appointment made","Called the patient","Refill sent to the pharmacy","Referral checklist scheduled for the next visit","Reviewed: no action needed"];
  const ans=(c,first)=>{const a={},C=CHK[c];
    if(c==="mood"){const hi=ch(.05);a[0]=String(hi?ri(1,3):ch(.15)?1:0);a[1]=String(hi?ri(2,3):ch(.12)?1:0);return a;}
    if(c==="food"){const pos=ch(.12);a[0]=pos?pick(["o","s"]):"n";a[1]=pos&&ch(.6)?"s":"n";return a;}
    if(c==="vax"){[.72,.5,.74,.52,.38].forEach((p,i)=>a[i]=ch(p)?"y":ch(.75)?"n":"ns");return a;}
    if(c==="hear"){a[0]=ch(.25)?"y":"n";if(a[0]==="y"){a[1]=ch(.35)?"y":"n";if(a[1]==="y")a[2]=ch(.7)?"y":"n";a[3]=ch(.4)?"y":"n";}a[4]=ch(a[0]==="y"?.7:.97)?"y":"n";return a;}
    const pn={home:.03,heat:.02,cool:.05,vis:.05}[c];C.items.forEach((x,i)=>{if(!asked(c,a,i))return;if((C.na||[]).includes(i)&&ch(c==="home"?.25:.5)){a[i]="na";return;}a[i]=ch(pn)?"n":ch(.03)&&C.opts===YNX?"x":"y";});
    if(c==="cool"&&a[0]==="n")a[1]=ch(.85)?"y":"n";if(c==="vis")a[4]=ch(.985)?"y":"n";return a;};
  for(const p of S.p){p.enr=addD(CFG.start,ri(0,70));const bs=N(129,12),bd=N(77,7);
    for(const ym of mon){const cur=ym===TODAY.slice(0,7),day=ri(1,28);if(cur&&day>+TODAY.slice(8,10))continue;const d=ym+"-"+String(day).padStart(2,"0");if(d<p.enr||d>TODAY)continue;const first=!visitsOf(p.id).length;if(!first&&!ch(.9))continue;
      const v={id:uid("v"),p:p.id,vol:p.vol,d,bp:{s:Math.round(bs+N(0,7)),di:Math.round(bd+N(0,5))},ev:{fall:ch(.03)?"y":"n",meds:ch(.02)?"y":"n",safety:"n"},checks:{},items:[],note:""};
      for(const c of dueChecks(p.id,d).slice(0,first?2:3))v.checks[c]=ans(c);
      addVisit(v);const age=diff(TODAY,d);
      for(const f of raiseFlags(v).made){
        if(f.type==="vax"){if(age>14&&ch(.75)){f.status="done";f.done=addD(d,ri(5,14));f.act="Registry checked";}continue;}
        if(!(f.urg?(age>2||(age>=1&&ch(.8))):age>35?ch(.95):age>12?ch(.5):false))continue;
        const lag=f.urg?0:Math.min(age,ri(3,30));f.seen=addD(d,lag);
        if(CLINICT.includes(f.type)){f.to="clinic";f.cact=CACT[0];if(age>lag+10?ch(.9):ch(.3)){f.status="done";f.done=addD(f.seen,Math.min(age-lag,ri(1,9)));f.act=pick(ACT);}}
        else if(JOBT.includes(f.type)){f.status="done";f.done=f.seen;f.act=f.cact=CACT[1];const j=addJob(f);if(age>lag+25&&ch(.8)){j.status="done";j.done=addD(f.seen,ri(6,24));}
          if(f.type==="home"&&ch(.5)&&!S.item.some(x=>x.p===p.id&&x.item===VITEMS[2])){S.item.push({id:uid("i"),p:p.id,d,item:VITEMS[2],by:p.vol});v.items.push(VITEMS[2]);}}
        else{f.status="done";f.done=f.seen;f.act=f.cact=f.type==="vision"||f.type==="hearing"?pick([CACT[2],CACT[3]]):CACT[2];}}}}
  for(const cg of[1,2,3]){const vols=S.w.filter(w=>w.cg===cg);let k=0;for(const ym of mon){const d=ym+"-"+String(8+cg*2).padStart(2,"0");if(d<CFG.start||d>TODAY)continue;S.mt.push({id:uid("m"),cg,d,module:MODULES[k++%MODULES.length],att:vols.filter(()=>ch(.86)).map(w=>w.id),restock:"y"});}}
  S.flag.sort((a,b)=>a.d<b.d?-1:1);}

/* ---------- volunteer: due list, elders, the visit ---------- */
const myElders=vol=>S.p.filter(p=>p.vol===vol).sort((a,b)=>a.sort<b.sort?-1:1);
const visitedIn=(pid,ym)=>visitsOf(pid).some(v=>v.d.slice(0,7)===ym);
const chkNames=a=>a.map(c=>CHK[c].n).join(", ");
function volTasks(vol){const out=[],ym=TODAY.slice(0,7);
  for(const p of myElders(vol)){const lv=lastVisit(p.id),why=[];let pr=2;const e=lastEp(p.id);
    if(visitedIn(p.id,ym))continue;
    if(!lv){why.push("New on your list. The first visit has not been made");pr=1;}
    else{const gap=diff(TODAY,lv.d);why.push("Not yet visited in "+MONL[+ym.slice(5,7)-1]+". Last visit: "+fmtD(lv.d));if(gap>45){why.push(gap+" days since the last visit");pr=1;}}
    const due=dueChecks(p.id,TODAY);if(due.length)why.push("Due at this visit: "+chkNames(due));
    if(e&&e.end&&e.handoff&&e.handoff.vol===vol&&diff(TODAY,e.end)<=60)why.push("Handed back from the community health worker on "+fmtD(e.end)+(e.handoff.watch.length?". Asked to keep watching: "+e.handoff.watch.map(id=>BAR[IX.b[id].key].label).join("; "):""));
    out.push({p:pr,person:p,why:why.join(". ")+"."});}
  return out.sort((a,b)=>a.p-b.p||(a.person.sort<b.person.sort?-1:1));}
function vVToday(){const w=me(),ts=volTasks(w.id),el=myElders(w.id),ym=TODAY.slice(0,7),done=el.filter(p=>visitedIn(p.id,ym)).length;
  let h="<h1>Today</h1><p class='muted'>"+fmtD(TODAY)+". Every line says why the person is on the list.</p>"+noteHtml();
  h+='<div class="grid">'+stat("My elders",el.length)+stat("Visited in "+MON[+ym.slice(5,7)-1],done+" of "+el.length)+stat("Still to visit",ts.length)+"</div>";
  h+=ts.map(t=>'<div class="card task p'+t.p+'"><div class="row"><div class="grow"><h3>'+(t.p===1?"Priority":"Due this month")+"</h3><h2>"+esc(t.person.name)+' <span class="muted small">'+esc(t.person.place)+"</span></h2><p class='small'>"+esc(t.why)+'</p></div><button class="pri" data-act="visit" data-id="'+t.person.id+'">Start visit</button></div></div>').join("");
  if(!ts.length)h+='<div class="note">Everyone on your list has been visited this month.</div>';return h;}
function vVMine(){const w=me(),el=myElders(w.id),ym=TODAY.slice(0,7);
  return"<h1>My elders</h1><p class='muted'>"+el.length+" people. One visit a month.</p>"+noteHtml()+'<div class="card">'+tbl(["Name","Community","Last visit","Due at the next visit",""],el.map(p=>{const lv=lastVisit(p.id),due=dueChecks(p.id,TODAY);
    return"<tr><td>"+pLink(p)+'<div class="small muted">'+p.age+" years · "+esc(p.phone)+"</div></td><td>"+esc(p.place)+"</td><td>"+(lv?fmtD(lv.d):"")+" "+(visitedIn(p.id,ym)?chip("This month","good"):chip("Not this month","warn"))+"</td><td class='small'>"+esc(due.length?chkNames(due):"Blood pressure only")+'</td><td><button data-act="visit" data-id="'+p.id+'">Visit</button></td></tr>';}))+"</div>";}
/* The page a volunteer or the coordinator sees for one elder. It shows nothing from the clinic's record. */
function vElder(){const p=IX.p[UI.pid],w=me(),vs=visitsOf(p.id).slice().reverse(),e=lastEp(p.id),fl=S.flag.filter(f=>f.p===p.id).reverse(),jobs=S.job.filter(j=>j.p===p.id);
  let h='<button class="link" data-act="back">‹ Back</button>'+noteHtml()+"<h1>"+esc(p.name)+'</h1><div class="row">'+chip(p.age+" years")+chip(p.place+", "+p.county+" County")+(p.phone?chip(p.phone):"")+"</div>";
  h+='<div class="card"><dl class="kv"><dt>Volunteer visitor</dt><dd>'+(p.vol?esc(IX.w[p.vol].name)+" (Care Group "+IX.w[p.vol].cg+")":"None yet")+"</dd><dt>Enrolled</dt><dd>"+fmtD(p.enr)+"</dd><dt>Visits made</dt><dd>"+vs.length+"</dd></dl>"
    +(w.role==="vol"&&p.vol===w.id?'<div class="row"><button class="pri" data-act="visit" data-id="'+p.id+'">Record a visit</button></div>':"")+"</div>";
  if(e&&!e.end)h+='<div class="note">A community health worker, '+esc(IX.w[e.chw].name)+", is also visiting this person until about "+fmtD(addD(e.start,CFG.epDays))+". Keep making your monthly visit.</div>";
  if(e&&e.end&&e.handoff&&e.handoff.vol)h+='<div class="card task p2"><h3>Handed back from the community health worker</h3><p>On '+fmtD(e.end)+"."+(e.handoff.watch.length?" Asked to keep watching: "+e.handoff.watch.map(id=>esc(BAR[IX.b[id].key].label)).join("; ")+".":"")+(e.handoff.note?" "+esc(e.handoff.note):"")+"</p><p class='small muted'>Observe and report. Do not act on these yourself.</p></div>";
  h+='<div class="card"><h3>Checks</h3>'+tbl(["Check","How often","Last done","Now"],CHKS.map(c=>{const l=lastDone(p.id,c,TODAY),due=dueChecks(p.id,TODAY).includes(c);return"<tr><td>"+CHK[c].n+"</td><td class='small'>"+CHK[c].when+"</td><td>"+(l?fmtD(l):"Never")+"</td><td>"+(due?chip("Due","warn"):"")+"</td></tr>";}))+"</div>";
  if(vs.length)h+='<div class="card"><h3>Visits, most recent first</h3>'+tbl(["Date","#Blood pressure","Checks done","Passed up"],vs.slice(0,UI.all?999:6).map(v=>"<tr><td>"+fmtD(v.d)+"</td><td class='n'>"+(v.bp?v.bp.s+"/"+v.bp.di:"Not taken")+"</td><td class='small'>"+esc(chkNames(Object.keys(v.checks)))+(v.items.length?"<div class='muted'>Left in the home: "+esc(v.items.join(", "))+"</div>":"")+"</td><td class='small'>"+esc(S.flag.filter(f=>f.v===v.id).map(f=>FLAGS[f.type][0]).join("; "))+"</td></tr>"))+(vs.length>6&&!UI.all?'<button data-act="all">Show all '+vs.length+"</button>":"")+"</div>";
  if(w.role==="coord"&&fl.length)h+='<div class="card"><h3>Flags</h3>'+tbl(["Date","Flag","Status"],fl.map(f=>"<tr><td>"+fmtD(f.d)+"</td><td>"+esc(FLAGS[f.type][0])+(f.detail?'<div class="small muted">'+esc(flagDetail(f))+"</div>":"")+"</td><td>"+flagChip(f)+"</td></tr>"))+"</div>";
  if(w.role==="coord"&&jobs.length)h+='<div class="card"><h3>Handyman work</h3>'+tbl(["Listed","Work","Status"],jobs.map(j=>"<tr><td>"+fmtD(j.d)+"</td><td class='small'>"+j.items.map(esc).join("<br>")+"</td><td>"+(j.status==="done"?chip("Done "+fmtD(j.done),"good"):chip("Open","warn"))+"</td></tr>"))+"</div>";
  return h;}
const flagDetail=f=>!f.detail?"":(f.detail.includes("?")?"Answered No: ":"")+f.detail.split(" | ").join("; ");
const flagChip=f=>f.status==="done"?chip(f.act||"Closed","good"):f.to==="clinic"&&f.type!=="vax"&&f.seen?chip("With the clinic","info"):f.to==="clinic"?chip("With the clinic","info"):chip(f.urg?"Urgent: open":"Open",f.urg?"bad":"warn");

function startVisit(pid){const due=dueChecks(pid,TODAY),on={},a={};CHKS.forEach(c=>{a[c]={};});due.forEach((c,i)=>{on[c]=i<3?"y":null;});
  UI.pid=pid;UI.F={t:"visit",pid,d:TODAY,due,on,a,bpTaken:null,s:"",di:"",ev:{fall:null,meds:null,safety:null},safeNote:"",hearWhy:"",temp:"",items:[],extra:"",note:"",tried:false};UI.mode="visit";}
function chkMissing(c,a){return CHK[c].items.map((x,i)=>i).filter(i=>asked(c,a,i)&&a[i]==null);}
function volBpNote(F){const s=+F.s,d=+F.di,B=CFG.bp;if(F.bpTaken!=="y"||!s||!d)return"";
  return above({s,di:d},B.now)?'<div class="note bad"><b>'+s+"/"+d+": call the coordinator now.</b> If the person has chest pain, weakness on one side, trouble speaking or a severe headache, call 911. Draft line, for clinical review.</div>":above({s,di:d},B.report)?'<div class="note warn">'+s+"/"+d+" is above the line on the card. Write it on the wall log. The app keeps count and passes it up if the reading is above the line at two visits in a row.</div>":'<div class="note">'+s+"/"+d+" is below the line on the card. Write it on the wall log.</div>";}
function vVisit(){const F=UI.F,p=IX.p[F.pid],T=F.tried,first=!visitsOf(p.id).length,B=CFG.bp;
  let h='<button class="link" data-act="cancel">‹ Cancel</button><h1>Visit: '+esc(p.name)+"</h1><p class='muted'>"+fmtD(TODAY)+(first?". First visit.":". Last visit "+fmtD(lastVisit(p.id).d)+".")+" Measure, observe and record. The app passes up what needs to be seen. Do not interpret a result or advise on medicines.</p>";
  if(T)h+='<div class="note bad">Some answers are missing. They are marked in red.</div>';
  if(F.extra){F.on[F.extra]="y";F.extra="";}
  const s=+F.s,d=+F.di,bpn=volBpNote(F);
  h+='<div class="card"><h3>Every visit</h3>'+q("Did you take the blood pressure?",seg("bpTaken",YN,F.bpTaken)+(F.bpTaken==="y"?'<div class="row">'+num("s",F.s,"upper",96,1)+"<span>over</span>"+num("di",F.di,"lower",96,1)+'</div><div id="vbpn">'+bpn+"</div>":""),T&&(!F.bpTaken||(F.bpTaken==="y"&&!(s&&d))),"Seated, after five minutes of rest. Enter the reading exactly as the cuff shows it.")
    +q("Has the person fallen since your last visit?",seg("ev.fall",YN,F.ev.fall),T&&!F.ev.fall)
    +q("Has the person run out of any medicine, or not refilled one?",seg("ev.meds",YN,F.ev.meds),T&&!F.ev.meds)
    +q("Did anything today raise a safety concern?",seg("ev.safety",YN,F.ev.safety)+(F.ev.safety==="y"?'<div class="note bad"><b>Stay with the person and call the coordinator today.</b> If there is immediate danger, call 911. For thoughts of suicide, the 988 Suicide and Crisis Lifeline answers calls and texts at 988. Draft protocol, for clinical review.</div><textarea data-n="safeNote" placeholder="What you saw or heard, and what you did">'+esc(F.safeNote)+"</textarea>":""),T&&(!F.ev.safety||(F.ev.safety==="y"&&!F.safeNote.trim())),"Talk of self-harm, harm from another person, or immediate danger in the home.")+"</div>";
  const other=CHKS.filter(c=>!F.due.includes(c)&&F.on[c]!=="y");
  for(const c of F.due.concat(CHKS.filter(c=>!F.due.includes(c)&&F.on[c]==="y"))){const C=CHK[c],a=F.a[c],on=F.on[c],isDue=F.due.includes(c),miss=T&&on==="y"?chkMissing(c,a):[];
    h+='<div class="card"><p class="step">'+(isDue?"Due at this visit":"Added today")+"</p><h2>"+C.n+"</h2><p class='small muted'>"+C.when+". Source: "+C.src+". "+C.items.length+" items.</p>"+q("Do this check today?",seg("on."+c,[["y","Yes"],["n","Not today"]],on),T&&!on,on==="n"?"It stays on the list for the next visit.":"");
    if(on==="y"){if(C.lead)h+="<p><b>"+esc(C.lead)+"</b></p>";
      C.items.forEach((x,i)=>{if(!asked(c,a,i))return;h+=q((i+1)+". "+x,seg("a."+c+"."+i,itemOpts(c,i),a[i])+(c==="heat"&&i===1?'<div class="row"><span class="small muted">Thermometer reading, if taken:</span>'+num("temp",F.temp,"°F",84)+"</div>":"")+(c==="hear"&&i===2&&a[2]==="n"?txt("hearWhy",F.hearWhy,"The reason, in the person's words"):""),miss.includes(i));});}
    h+="</div>";}
  if(other.length)h+='<div class="card">'+q("Add a check that is not due",'<select data-sel="extra"><option value="">None</option>'+other.map(c=>'<option value="'+c+'">'+CHK[c].n+"</option>").join("")+"</select>",false,"For example, a home safety check after a fall.")+"</div>";
  h+='<div class="card">'+q("Items left in the home today",multi("items",VITEMS.map(i=>[i,i]),F.items),false,"Leave blank if none.")+q("Note (optional)",'<textarea data-n="note" placeholder="Anything the coordinator should know">'+esc(F.note)+"</textarea>")+'</div><div class="row"><button class="pri" data-act="savevisit">Save the visit</button><button data-act="cancel">Cancel</button></div>';
  return h;}
function saveVisit(){const F=UI.F,p=IX.p[F.pid],s=+F.s,d=+F.di;let bad=!F.bpTaken||(F.bpTaken==="y"&&!(s&&d))||!F.ev.fall||!F.ev.meds||!F.ev.safety||(F.ev.safety==="y"&&!F.safeNote.trim());
  for(const c of CHKS){if(F.due.includes(c)&&!F.on[c])bad=true;if(F.on[c]==="y"&&chkMissing(c,F.a[c]).length)bad=true;}
  if(bad){F.tried=true;return render();}
  const v={id:uid("v"),p:p.id,vol:UI.who,d:TODAY,bp:F.bpTaken==="y"?{s,di:d}:null,ev:{...F.ev},safeNote:F.safeNote.trim(),hearWhy:F.hearWhy.trim(),temp:F.temp,checks:{},items:F.items.slice(),note:F.note.trim()};
  for(const c of CHKS)if(F.on[c]==="y"){v.checks[c]={};CHK[c].items.forEach((x,i)=>{if(asked(c,F.a[c],i))v.checks[c][i]=F.a[c][i];});}
  addVisit(v);for(const it of v.items)S.item.push({id:uid("i"),p:p.id,d:TODAY,item:it,by:UI.who});
  const r=raiseFlags(v),urg=r.made.filter(f=>f.urg);
  UI.note=["Visit saved. "+(r.made.length?"Passed up: "+r.made.map(f=>FLAGS[f.type][0]+(f.to==="clinic"?" (to the clinic)":"")).join("; ")+".":"Nothing needed to be passed up.")+(r.held.length?" Not passed up again: "+r.held.join("; ")+".":"")+(urg.length?" Call the coordinator today about: "+urg.map(f=>FLAGS[f.type][0]).join("; ")+".":""),urg.length?"bad":""];
  UI.F=null;UI.mode="elder";render();}
function vVResults(){const w=me(),el=myElders(w.id),ids=new Set(el.map(p=>p.id)),ms=months().slice(-6),V=S.v.filter(v=>v.vol===w.id),fl=S.flag.filter(f=>f.by===w.id),mt=S.mt.filter(m=>m.cg===w.cg);
  let h="<h1>My results</h1>"+'<div class="grid">'+stat("Visits made",V.length)+stat("Flags passed up",fl.length,fl.filter(f=>f.status==="done").length+" closed")+stat("Care Group meetings attended",mt.filter(m=>m.att.includes(w.id)).length+" of "+mt.length)+"</div>";
  h+='<div class="card"><h3>Elders visited each month</h3><div class="tblwrap"><table>'+barHead+ms.map(m=>{const en=el.filter(p=>p.enr&&p.enr.slice(0,7)<=m);return bar(fmtYM(m)+(m===TODAY.slice(0,7)?" (in progress)":""),en.filter(p=>visitedIn(p.id,m)).length,en.length,90);}).join("")+"</table></div><p class='small muted'>The mark shows the target of 90%.</p></div>";
  const ck={};for(const v of V)for(const c in v.checks)ck[c]=(ck[c]||0)+1;
  h+='<div class="card"><h3>Checks done</h3>'+tbl(["Check","#Done"],CHKS.map(c=>"<tr><td>"+CHK[c].n+"</td><td class='n'>"+(ck[c]||0)+"</td></tr>"))+"</div>";return h;}

/* ---------- coordinator ---------- */
const cgOf=p=>p.vol?IX.w[p.vol].cg:0;
function vCFlags(){const open=S.flag.filter(f=>f.to==="coord"&&f.status==="open").sort((a,b)=>(b.urg-a.urg)||(a.d<b.d?-1:1)),urg=open.filter(f=>f.urg),atClinic=S.flag.filter(f=>f.to==="clinic"&&f.status==="open"&&f.type!=="vax").length;
  let h="<h1>Flags</h1><p class='muted'>"+fmtD(TODAY)+". Urgent flags need action the same day. The rest are reviewed at the monthly Care Group meeting.</p>"+noteHtml();
  h+='<div class="grid">'+stat("Urgent",urg.length)+stat("For the monthly review",open.length-urg.length,open.filter(f=>!f.urg&&diff(TODAY,f.d)>31).length+" have waited more than a month")+stat("Passed to the clinic, still open",atClinic)+stat("Handyman jobs open",S.job.filter(j=>j.status==="open").length)+"</div>";
  const show=UI.all?open:open.slice(0,12);
  for(const f of show){const p=IX.p[f.p],c=lastCk(p.id),recent=c&&diff(TODAY,c.d)<=CFG.noRepeat,noClinic=recent&&!f.urg,opts=CACT.filter((x,i)=>!(i===0&&noClinic)&&!(i===1&&!JOBT.includes(f.type)));
    h+='<div class="card task p'+(f.urg?1:3)+'"><h3>'+(f.urg?"Urgent · ":"")+"Care Group "+cgOf(p)+" · "+fmtD(f.d)+(!f.urg&&diff(TODAY,f.d)>31?" · waiting "+diff(TODAY,f.d)+" days":"")+"</h3><h2>"+pLink(p)+' <span class="muted small">'+esc(p.place)+"</span></h2><p><b>"+esc(FLAGS[f.type][0])+".</b>"+(f.detail?" "+esc(flagDetail(f)):"")+"</p><p class='small muted'>Passed up by "+esc(IX.w[f.by].name)+"."+(noClinic?" Seen at the clinic on "+fmtD(c.d)+", so a routine flag is not sent there again within "+CFG.noRepeat+" days.":"")+'</p><div class="row"><select id="ca_'+f.id+'"><option value="">Choose what you did</option>'+opts.map(x=>"<option>"+x+"</option>").join("")+'</select><button data-act="cflag" data-id="'+f.id+'">Record</button></div></div>';}
  if(open.length>12&&!UI.all)h+='<button data-act="all">Show all '+open.length+"</button>";
  if(!open.length)h+='<div class="note">No flag is waiting for you.</div>';return h;}
function cgStats(cg){const ym=TODAY.slice(0,7),vols=S.w.filter(w=>w.cg===cg),el=S.p.filter(p=>cgOf(p)===cg&&p.enr<=TODAY),mt=S.mt.filter(m=>m.cg===cg),fl=S.flag.filter(f=>cgOf(IX.p[f.p])===cg&&f.type!=="vax");
  return{vols,el,vis:el.filter(p=>visitedIn(p.id,ym)).length,mt,att:mt.length?Math.round(100*sum(mt.map(m=>m.att.length))/(mt.length*vols.length)):0,fl,closed:fl.filter(f=>f.status==="done").length};}
function vGroups(){const F=UI.F&&UI.F.t==="mt"?UI.F:(UI.F={t:"mt",cg:null,d:TODAY,module:"",att:[],restock:null,tried:false}),ym=TODAY.slice(0,7);
  let h="<h1>Care Groups</h1><p class='muted'>Each group meets for four hours a month: one module taught, the month's flags reviewed, supplies restocked.</p>"+noteHtml();
  for(const cg of[1,2,3]){const s=cgStats(cg),last=s.mt[s.mt.length-1];
    h+='<div class="card"><h2>Care Group '+cg+' <span class="muted small">'+PLACES.filter(p=>p.cg===cg).map(p=>p.n).join(" and ")+", "+PLACES.find(p=>p.cg===cg).c+" County</span></h2><div class='tblwrap'><table>"+barHead+bar("Elders visited in "+MON[+ym.slice(5,7)-1],s.vis,s.el.length,90)+bar("Volunteers at the last meeting"+(last?" ("+fmtD(last.d)+", "+last.module+")":""),last?last.att.length:0,s.vols.length,80)+"</table></div>"
      +tbl(["Volunteer","#Elders","#Visited this month","#Open flags","Last visit made"],s.vols.map(w=>{const el=myElders(w.id),lv=S.v.filter(v=>v.vol===w.id).map(v=>v.d).sort().pop();return"<tr><td>"+esc(w.name)+"</td><td class='n'>"+el.length+"</td><td class='n'>"+el.filter(p=>visitedIn(p.id,ym)).length+"</td><td class='n'>"+S.flag.filter(f=>f.by===w.id&&f.status==="open").length+"</td><td>"+(lv?fmtD(lv):"")+"</td></tr>";}))+"</div>";}
  const vols=F.cg?S.w.filter(w=>w.cg===+F.cg):[];
  h+='<div class="card"><h2>Record a meeting</h2>'+q("Care Group",seg("cg",[["1","Care Group 1"],["2","Care Group 2"],["3","Care Group 3"]],F.cg),F.tried&&!F.cg)+q("Date",'<input type="date" data-n="d" max="'+TODAY+'" value="'+esc(F.d)+'">',F.tried&&(!F.d||F.d>TODAY))
    +q("Module taught",'<select data-sel="module"><option value="">Choose the module</option>'+MODULES.map(m=>'<option'+(F.module===m?" selected":"")+">"+m+"</option>").join("")+"</select>",F.tried&&!F.module)
    +(F.cg?q("Volunteers present",multi("att",vols.map(w=>[w.id,w.name]),F.att),F.tried&&!F.att.length,"Tap each volunteer who attended."):"")+q("Were supplies restocked?",seg("restock",YN,F.restock),F.tried&&!F.restock)+'<div class="row"><button class="pri" data-act="savemt">Save the meeting</button></div></div>';
  return h;}
function vJobs(){const open=S.job.filter(j=>j.status==="open").sort((a,b)=>a.d<b.d?-1:1),done=S.job.filter(j=>j.status==="done");
  let h="<h1>Work list</h1><p class='muted'>Home repairs and safety fittings for the church handyman teams, from No answers on the home safety and heating checks.</p>"+noteHtml()+'<div class="grid">'+stat("Open",open.length)+stat("Done",done.length)+stat("Oldest open",open.length?diff(TODAY,open[0].d)+" days":"None")+"</div>";
  h+=open.slice(0,UI.all?999:10).map(j=>{const p=IX.p[j.p];return'<div class="card task p3"><h3>Care Group '+cgOf(p)+" · listed "+fmtD(j.d)+"</h3><h2>"+pLink(p)+' <span class="muted small">'+esc(p.place)+" · "+esc(p.phone)+"</span></h2><ul>"+j.items.map(x=>"<li>No: "+esc(x)+"</li>").join("")+'</ul><div class="row"><button data-act="jobdone" data-id="'+j.id+'">Mark as done</button></div></div>';}).join("");
  if(open.length>10&&!UI.all)h+='<button data-act="all">Show all '+open.length+"</button>";return h;}
function vCReports(){const ms=months(),ym=TODAY.slice(0,7),el=S.p.filter(p=>p.enr<=TODAY),vols=S.w.filter(w=>w.role==="vol"),F=S.flag;
  let h="<h1>Volunteer tier</h1><p class='muted'>Month "+(mIdx(TODAY)+1)+" of the program. Example data: every elder is fictitious.</p>";
  h+='<div class="grid">'+stat("Elders enrolled",el.length)+stat("Volunteer visitors",vols.length,"about "+(el.length/vols.length).toFixed(1)+" elders each")+stat("Visited in "+MON[+ym.slice(5,7)-1],pct(el.filter(p=>visitedIn(p.id,ym)).length,el.length)+"%","month in progress")+stat("Flags open",F.filter(f=>f.status==="open").length)+"</div>";
  h+='<h2 class="rep">1. Enrollment and visit coverage</h2><div class="card"><div class="tblwrap"><table>'+barHead.replace("Measure","Month: elders visited, of those enrolled")+ms.map(m=>{const en=S.p.filter(p=>p.enr&&p.enr.slice(0,7)<=m);return bar(fmtYM(m)+(m===ym?" (in progress)":""),en.filter(p=>visitedIn(p.id,m)).length,en.length,90);}).join("")+"</table></div><p class='small muted'>The mark shows the target of 90% of enrolled elders visited in the month.</p></div>";
  const bpv=S.v.filter(v=>v.bp),twice=new Set(F.filter(f=>f.type==="bp").map(f=>f.p)),lastHi=el.filter(p=>{const l=lastVisit(p.id);return l&&above(l.bp,CFG.bp.report);});
  h+='<h2 class="rep">2. Blood pressure checks</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Visits with a blood pressure reading",bpv.length,S.v.length)+bar("Elders flagged for readings above the line",twice.size,el.length,0,"Two visits in a row at or above "+CFG.bp.report.join("/")+", or one at or above "+CFG.bp.now.join("/"))+bar("Elders whose latest reading is above the line",lastHi.length,el.length)+"</table></div></div>";
  h+='<h2 class="rep">3. Checks done</h2><div class="card">'+tbl(["Check","#Done","#With something passed up","#%"],CHKS.map(c=>{const d=S.v.filter(v=>v.checks[c]),t={heat:["heat","heatsafe"],vis:["vision"],hear:["hearing"]}[c]||[c],pos=d.filter(v=>F.some(f=>f.v===v.id&&t.includes(f.type))).length;return"<tr><td>"+CHK[c].n+'<div class="small muted">'+CHK[c].when+"</div></td><td class='n'>"+d.length+"</td><td class='n'>"+pos+"</td><td class='n'>"+(d.length?pct(pos,d.length)+"%":"")+"</td></tr>";}))+"<p class='small muted'>A check whose flag was held back because one was already open is not counted as passed up.</p></div>";
  const fk={};for(const f of F){const o=fk[f.type]=fk[f.type]||{n:0,u:0,c:0,days:[]};o.n++;if(f.urg)o.u++;if(f.status==="done"){o.c++;o.days.push(diff(f.done,f.d));}}
  h+='<h2 class="rep">4. Flags raised and how they were closed</h2><div class="card">'+tbl(["Flag","Goes first to","#Raised","#Urgent","#Closed","#Open","#Average days to close"],Object.keys(FLAGS).filter(k=>fk[k]).sort((a,b)=>fk[b].n-fk[a].n).map(k=>{const o=fk[k];return"<tr><td>"+esc(FLAGS[k][0])+"</td><td>"+(FLAGS[k][1]==="clinic"?"Clinic":"Coordinator")+"</td><td class='n'>"+o.n+"</td><td class='n'>"+(o.u||"")+"</td><td class='n'>"+o.c+"</td><td class='n'>"+(o.n-o.c)+"</td><td class='n'>"+(o.days.length?mean(o.days).toFixed(0):"")+"</td></tr>";}))+"</div>";
  const ak={};for(const f of F)if(f.cact)ak[f.cact]=(ak[f.cact]||0)+1;
  h+='<div class="card"><h3>What the coordinator did with them</h3>'+tbl(["Action","#Flags"],CACT.filter(a=>ak[a]).map(a=>"<tr><td>"+a+"</td><td class='n'>"+ak[a]+"</td></tr>"))+"</div>";
  const jd=S.job.filter(j=>j.status==="done");
  h+='<h2 class="rep">5. Handyman work</h2><div class="card"><div class="tblwrap"><table>'+barHead+bar("Jobs done",jd.length,S.job.length)+"</table></div><p class='small'>Average of "+(jd.length?mean(jd.map(j=>diff(j.done,j.d))).toFixed(0):"0")+" days from listing to done.</p></div>";
  const ik={};for(const i of S.item.filter(i=>i.by&&IX.w[i.by].role==="vol"))ik[i.item]=(ik[i.item]||0)+1;
  h+='<h2 class="rep">6. Items left in homes by volunteers</h2><div class="card">'+(Object.keys(ik).length?tbl(["Item","#Number"],Object.entries(ik).sort((a,b)=>b[1]-a[1]).map(([k,n])=>"<tr><td>"+esc(k)+"</td><td class='n'>"+n+"</td></tr>")):'<p class="muted">None recorded yet.</p>')+"</div>";
  h+='<h2 class="rep">7. Care Groups compared</h2><div class="card"><div class="tblwrap"><table><tr><th>Care Group</th><th>Measure</th><th class="n">Number</th><th class="n">Out of</th><th class="n">%</th><th></th></tr>'+[1,2,3].map(cg=>{const s=cgStats(cg),r=(l,n,d,t)=>bar(l,n,d,t).replace("<tr><td>","<td>");return'<tr><td rowspan="3"><b>Care Group '+cg+"</b><div class='small muted'>"+PLACES.find(p=>p.cg===cg).c+" County</div></td>"+r("Elders visited this month",s.vis,s.el.length,90)+"<tr>"+r("Meeting attendance, all meetings",sum(s.mt.map(m=>m.att.length)),s.mt.length*s.vols.length,80)+"<tr>"+r("Flags closed",s.closed,s.fl.length)+"";}).join("")+"</table></div><p class='small muted'>Quality checklists for home visits arrive in a later build.</p></div>";
  return h;}
/* Clinic: vaccine gaps reported by volunteers, shown as one table and not as separate tasks. */
function vaxCard(){const g=S.flag.filter(f=>f.type==="vax"&&f.status==="open");if(!g.length)return"";
  return'<div class="card"><h3>Vaccine gaps reported by volunteer visitors ('+g.length+")</h3><p class='small muted'>From the person's own recall, September to November. Check the state registry before acting. Not urgent.</p>"+tbl(["Patient","Reported","Gaps",""],g.slice(0,UI.all?999:8).map(f=>{const p=IX.p[f.p];return"<tr><td>"+pLink(p)+'<div class="small muted">'+esc(p.mrn)+"</div></td><td>"+fmtD(f.d)+"</td><td class='small'>"+esc(f.detail.replace("Gaps reported: ",""))+'</td><td><button data-act="vaxdone" data-id="'+f.id+'">Registry checked</button></td></tr>';}))+(g.length>8&&!UI.all?'<button data-act="all">Show all '+g.length+"</button>":"")+"</div>";}
const XV={vtoday:vVToday,vmine:vVMine,vresults:vVResults,cflags:vCFlags,groups:vGroups,jobs:vJobs,creports:vCReports},XM={elder:vElder,visit:vVisit};
const XACT={
 visit:d=>{startVisit(d.id);render();},savevisit:()=>saveVisit(),
 cflag:d=>{const f=S.flag.find(x=>x.id===d.id),v=$("#ca_"+d.id).value;UI.keep=true;if(!v){UI.note=["Choose what you did before recording it.","warn"];return render();}
   f.cact=v;f.seen=TODAY;if(v===CACT[0]){f.to="clinic";UI.note=["Passed to the clinic. It is now on the clinic's To do list."];}else{f.status="done";f.done=TODAY;f.act=v;if(v===CACT[1]){addJob(f);UI.note=["Added to the handyman work list."];}else UI.note=["Recorded: "+v+"."];}render();},
 jobdone:d=>{const j=S.job.find(x=>x.id===d.id);j.status="done";j.done=TODAY;UI.note=["Marked as done for "+IX.p[j.p].name+"."];UI.keep=true;render();},
 vaxdone:d=>{const f=S.flag.find(x=>x.id===d.id);f.status="done";f.done=TODAY;f.act="Registry checked";UI.note=["Recorded for "+IX.p[f.p].name+"."];UI.keep=true;render();},
 savemt:()=>{const F=UI.F;UI.keep=true;if(!F.cg||!F.d||F.d>TODAY||!F.module||!F.att.length||!F.restock){F.tried=true;return render();}S.mt.push({id:uid("m"),cg:+F.cg,d:F.d,module:F.module,att:F.att.slice(),restock:F.restock});S.mt.sort((a,b)=>a.d<b.d?-1:1);UI.note=["Meeting saved for Care Group "+F.cg+": "+F.att.length+" volunteers present."];UI.F=null;UI.keep=false;render();}};
