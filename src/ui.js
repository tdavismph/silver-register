/* ---------- screen state ---------- */
const UI={who:"pa1",tab:null,mode:null,pid:null,F:null,back:null,q:"",pf:"ref",all:false,ym:TODAY.slice(0,7),note:null,keep:false};
const me=()=>IX.w[UI.who];
const TABS={clinic:[["todo","To do"],["newref","New referral"],["patients","Patients"],["billing","Billing"],["reports","Reports"]],
  chw:[["today","Today"],["mine","My patients"],["time","Time log"],["reports","My results"]],
  admin:[["reports","Reports"],["billing","Billing"],["workers","Workers"],["settings","Settings"]]};
const ROLE={admin:"Administrator",clinic:"Clinic",chw:"Community health worker",coord:"Coordinator",vol:"Volunteer visitor"};
const getPath=(o,path)=>{for(const k of path.split(".")){if(o==null)return undefined;o=o[k];}return o;};
function setPath(o,path,v){const k=path.split(".");for(let i=0;i<k.length-1;i++){if(o[k[i]]==null)o[k[i]]={};o=o[k[i]];}o[k[k.length-1]]=v;}

/* ---------- small builders ---------- */
const chip=(t,c)=>'<span class="chip '+(c||"")+'">'+esc(t)+"</span>";
const seg=(path,opts,val,off)=>'<div class="seg">'+opts.map(o=>'<button data-set="'+path+'" data-v="'+esc(o[0])+'" class="'+(String(val)===String(o[0])?"on":"")+'"'+(off&&off.includes(o[0])?" disabled":"")+">"+esc(o[1])+"</button>").join("")+"</div>";
const YN=[["y","Yes"],["n","No"]],YNA=[["y","Yes"],["n","No"],["na","Does not apply"]];
const multi=(path,opts,arr)=>'<div class="seg multi neutral">'+opts.map(o=>'<button data-tog="'+path+'" data-v="'+esc(o[0])+'" class="'+((arr||[]).includes(o[0])?"on":"")+'">'+esc(o[1])+"</button>").join("")+"</div>";
const q=(label,inner,miss,hint)=>'<div class="q'+(miss?" miss":"")+'"><label class="t">'+esc(label)+"</label>"+(hint?'<p class="small muted">'+esc(hint)+"</p>":"")+inner+"</div>";
const num=(path,val,ph,w,live)=>'<input type="number" inputmode="numeric" min="0" data-n="'+path+'"'+(live?' data-live="1"':"")+' value="'+esc(val??"")+'" placeholder="'+esc(ph||"")+'" style="width:'+(w||96)+'px">';
const txt=(path,val,ph,w)=>'<input type="text" data-n="'+path+'" value="'+esc(val??"")+'" placeholder="'+esc(ph||"")+'" style="width:'+(w||"100%")+'">';
const box=(path,label,on)=>'<label class="ck"><input type="checkbox" data-c="'+path+'"'+(on?" checked":"")+"><span>"+label+"</span></label>";
const bar=(label,n,d,target,sub)=>{const p=pct(n,d);return "<tr><td>"+esc(label)+(sub?'<div class="small muted">'+esc(sub)+"</div>":"")+'</td><td class="n">'+n+'</td><td class="n">'+d+'</td><td class="n"><b>'+(p==null?"":p+"%")+'</b></td><td><div class="meter"><i style="width:'+clamp(p||0,0,100)+'%"></i>'+(target?'<b style="left:'+target+'%"></b>':"")+"</div></td></tr>";};
const barHead='<tr><th>Measure</th><th class="n">Number</th><th class="n">Out of</th><th class="n">%</th><th></th></tr>';
const tbl=(head,rows)=>'<div class="tblwrap"><table><tr>'+head.map(h=>"<th"+(h[0]==="#"?' class="n"':"")+">"+esc(h.replace(/^#/,""))+"</th>").join("")+"</tr>"+rows.join("")+"</table></div>";
const pLink=p=>'<button class="link" data-pid="'+p.id+'">'+esc(p.name)+"</button>";
const card=(h,b)=>'<div class="card">'+(h?"<h3>"+esc(h)+"</h3>":"")+b+"</div>";
const stat=(h,v,sub)=>'<div class="card"><h3>'+esc(h)+'</h3><div class="big">'+v+"</div>"+(sub?'<p class="small muted">'+sub+"</p>":"")+"</div>";
const COVCHIP=c=>!c?"":covOK(c.cov)?chip(PATHS[c.cov.path].split(" (")[0],"info"):chip("Not billable","warn");
const ROUTECHIP={chw:["CHW episode","info"],both:["CHW episode, then volunteer","info"],vol:["Volunteer visitor","good"],clinic:["Clinic action only",""]};
const bStat=b=>b.res?chip("Resolved "+fmtD(b.res),"good"):b.status==="review"?chip("Waiting for the practitioner's review","warn"):b.status==="declined"?chip("Not added to the plan","bad"):b.src==="chw"?chip("Added to the plan "+fmtD(b.rev),"info"):chip("In the plan","info");
const linkTxt=(b)=>b.links.join(", ");
const ymSel=()=>'<select id="ym" aria-label="Month">'+months().reverse().map(m=>'<option value="'+m+'"'+(m===UI.ym?" selected":"")+">"+fmtYM(m)+(m===TODAY.slice(0,7)?" (in progress)":"")+"</option>").join("")+"</select>";
const noteHtml=()=>{if(!UI.note)return"";const n=UI.note;UI.note=null;return '<div class="note '+(n[1]||"")+'">'+esc(n[0])+"</div>";};

/* ---------- clinic: To do ---------- */
function vTodo(){
  const safe=S.a.filter(a=>a.safety==="y"&&!a.safeAck),rev=S.b.filter(b=>b.status==="review"),fl=S.flag.filter(f=>f.to==="clinic"&&f.status==="open");
  let h="<h1>To do</h1><p class='muted'>"+esc(CFG.practice)+". "+fmtD(TODAY)+".</p>"+noteHtml();
  h+='<div class="grid">'+stat("Safety concerns",safe.length)+stat("Barriers to review",rev.length)+stat("Flags from volunteers",fl.length)+S.w.filter(w=>w.role==="chw").map(w=>{const n=openOf(w.id).length;return stat(w.name,n+" of "+CFG.caseMax,"patients in an episode now");}).join("")+"</div>";
  for(const a of safe){const p=IX.p[a.p];h+='<div class="card task p1"><h3>Safety concern reported the same day</h3><h2>'+pLink(p)+' <span class="muted small">'+esc(p.mrn)+"</span></h2><p>"+esc(a.safeNote)+"</p><p class='small muted'>Reported by "+esc(IX.w[a.chw].name)+" at a "+a.kind.toLowerCase()+" on "+fmtD(a.d)+'.</p><div class="row"><button class="pri" data-act="ack" data-id="'+a.id+'">I have seen this and acted</button></div></div>';}
  for(const b of rev){const p=IX.p[b.p],m=sum(S.t.filter(r=>r.b===b.id).map(r=>r.min));
    h+='<div class="card task p2"><h3>Barrier found by the CHW: review needed</h3><h2>'+pLink(p)+' <span class="muted small">'+esc(p.mrn)+"</span></h2><p><b>"+esc(BAR[b.key].label)+"</b> ("+esc(BAR[b.key].code)+"), linked by the CHW to "+b.links.map(L=>L+" "+esc(COND[L][0])).join(", ")+".</p><p class='small muted'>Found by "+esc(IX.w[b.by].name)+" on "+fmtD(b.d)+". "+m+" minutes already logged against it cannot be counted until it is in the plan.</p>"+'<div class="row"><button class="pri" data-act="review" data-id="'+b.id+'" data-v="approved">Add to the plan</button><button data-act="review" data-id="'+b.id+'" data-v="declined">Do not add</button></div></div>';}
  for(const f of fl){const p=IX.p[f.p],c=lastCk(p.id),recent=c&&diff(TODAY,c.d)<=CFG.noRepeat;
    h+='<div class="card task p3"><h3>Flag from a volunteer visitor</h3><h2>'+pLink(p)+' <span class="muted small">'+esc(p.mrn)+"</span></h2><p>"+esc(FLAGS[f.type][0])+".</p><p class='small muted'>Passed up by "+esc(IX.w[f.by].name)+" on "+fmtD(f.d)+". The volunteer records and reports, and does not interpret."+(recent?" This patient was seen here on "+fmtD(c.d)+".":"")+'</p><div class="row"><select id="fa_'+f.id+'"><option value="">Choose the action taken</option>'+["Appointment made","Called the patient","Refill sent to the pharmacy","Referral checklist scheduled for the next visit","Reviewed: no action needed"].map(x=>"<option>"+x+"</option>").join("")+'</select><button data-act="flagdone" data-id="'+f.id+'">Record the action</button></div></div>';}
  if(!safe.length&&!rev.length&&!fl.length)h+='<div class="note">Nothing is waiting for you.</div>';
  return h;}

/* ---------- clinic: the referral checklist ---------- */
function startCk(pid){UI.F={t:"ck",pid:pid||"",nw:{name:"",mrn:"",dob:""},vt:null,cov:{partB:null,notElse:null,path:null},cond:[],other:"",otherCode:"",core:{},blk:{},links:{},obs:[],trig:[],route:null,sign:[],tried:false};}
function ckKeys(F){const out=[];for(const c of CORE)if(F.core[c.k]===c.flag)out.push(c.k);for(const L of F.cond)for(const b of BLOCK[L]||[])if(F.blk[b.k]===b.flag)out.push(b.k);return out.concat(F.obs);}
function ckLinks(F,k){const B=BAR[k];if(B.cond)return[B.cond];if(F.cond.length===1)return F.cond.slice();return(F.links[k]||[]).filter(L=>F.cond.includes(L));}
function ckMissing(F){const m=[],ok=covOK(F.cov),full=ok||F.cov.partB==null||F.cov.notElse==null||F.cov.path==null;
  if(!F.pid)m.push("pid");if(F.pid==="new"&&(!F.nw.name.trim()||!F.nw.mrn.trim()||!F.nw.dob))m.push("nw");
  if(!F.vt)m.push("vt");for(const k of["partB","notElse","path"])if(F.cov[k]==null)m.push("cov."+k);
  if(full){if(!F.cond.length)m.push("cond");if(F.cond.includes("O")&&!F.other.trim())m.push("other");
    for(const c of CORE)if(!F.core[c.k])m.push("core."+c.k);for(const L of F.cond)for(const b of BLOCK[L]||[])if(!F.blk[b.k])m.push("blk."+b.k);
    for(const k of ckKeys(F))if(!ckLinks(F,k).length)m.push("links."+k);}
  if(!F.route)m.push("route");if(F.route==="chw"||F.route==="both"){if(!ok)m.push("route");if(F.sign.length<SIGN.length)m.push("sign");if(!ckKeys(F).length)m.push("nobar");}
  return m;}
function vCk(){const F=UI.F,T=F.tried?ckMissing(F):[],miss=k=>T.includes(k),ok=covOK(F.cov),covDone=F.cov.partB!=null&&F.cov.notElse!=null&&F.cov.path!=null,stop=covDone&&!ok,keys=ckKeys(F);
  const condBtns=F.cond.filter(L=>L!=="O"||F.other.trim()).map(L=>[L,L==="O"?"Other":L+" "+COND[L][0]]);
  const linkRow=k=>BAR[k].cond||F.cond.length<2?"":'<div><p class="small muted">Which condition does this barrier obstruct? Tick every one that applies.</p>'+multi("links."+k,condBtns,F.links[k])+"</div>";
  const pts=S.p.filter(p=>!openEp(p.id)).sort((a,b)=>a.sort<b.sort?-1:1);
  let h="<h1>Home-visit referral checklist</h1><p class='muted'>Authorizes Medicare-billable CHW home visits. Complete at the initiating visit (E/M or Annual Wellness Visit). Target time: 5 minutes. Version 4.</p>";
  if(F.tried&&T.length)h+='<div class="note bad">Some answers are missing. They are marked in red.</div>';
  h+='<div class="card">'+q("Patient",'<select data-sel="pid"><option value="">Choose a patient</option><option value="new"'+(F.pid==="new"?" selected":"")+">New patient (not on this list)</option>"+pts.map(p=>'<option value="'+p.id+'"'+(F.pid===p.id?" selected":"")+">"+esc(p.name)+", "+p.age+" ("+esc(p.mrn)+")</option>").join("")+"</select>"+(F.pid==="new"?'<div class="row">'+txt("nw.name",F.nw.name,"Full name","220px")+txt("nw.mrn",F.nw.mrn,"MRN","130px")+'<input type="date" data-n="nw.dob" value="'+esc(F.nw.dob)+'" aria-label="Date of birth"></div>':""),miss("pid")||miss("nw"),"Patients already in a CHW episode are not listed.")
    +q("Visit type",seg("vt",VT.map(v=>[v,v]),F.vt),miss("vt"))+"<p class='small muted'>Billing practitioner: "+esc(me().name)+". Date: "+fmtD(TODAY)+".</p></div>";
  h+='<div class="card"><p class="step">Step 1. Coverage check (30 seconds)</p><p class="small muted">Complete from the record.</p>'
    +q("Medicare Part B (traditional Medicare)?",seg("cov.partB",YN,F.cov.partB),miss("cov.partB"),"If Medicare Advantage, answer Yes only after verifying that the plan pays these codes.")
    +q("Not already receiving these services from another practice?",seg("cov.notElse",YN,F.cov.notElse),miss("cov.notElse"),"One practitioner per calendar month only.")
    +q("Cost-sharing pathway",seg("cov.path",Object.entries(PATHS).concat([["none","None settled"]]),F.cov.path),miss("cov.path"))
    +(stop?'<div class="note warn">The coverage check is not complete, so CHW visits would not be billable. Stop here and route to the volunteer tier. The visit may still be worth making.</div>':"")+"</div>";
  if(!stop){
    h+='<div class="card"><p class="step">Step 2. Active conditions (30 seconds)</p>'+q("Tick every condition that is active and documented today",'<div class="seg multi neutral">'+Object.keys(COND).map(L=>'<button data-tog="cond" data-v="'+L+'" class="'+(F.cond.includes(L)?"on":"")+'">'+(L==="O"?"":"<b>"+L+"</b> ")+esc(COND[L][0])+(COND[L][1]?" <span class='small'>("+esc(COND[L][1])+")</span>":"")+(COND[L][2]?"<br><span class='small'>"+esc(COND[L][2])+"</span>":"")+"</button>").join("")+"</div>",miss("cond"),"At least one is required. Every barrier recorded later must be linked to one of these.")
      +(F.cond.includes("O")?q("Other condition",'<div class="row">'+txt("other",F.other,"Condition","240px")+txt("otherCode",F.otherCode,"ICD-10","110px")+"</div>",miss("other")):"")+"</div>";
    h+='<div class="card"><p class="step">Step 3. Core questions (2 minutes, ask everyone)</p><p class="small muted">These barriers belong to the household, so they are asked once.</p>'
      +CORE.map(c=>{const fl=F.core[c.k]===c.flag;return q(c.q,seg("core."+c.k,YN,F.core[c.k])+(fl?'<div class="note warn"><b>Flagged.</b> '+esc(c.code)+". The CHW may: "+esc(c.may)+".</div>"+linkRow(c.k):""),miss("core."+c.k)||miss("links."+c.k));}).join("")
      +"<p class='small muted'>The two food questions are the Hunger Vital Sign. If the practice also bills a standardized risk-assessment code, administer them in the published wording.</p></div>";
    const Ls=F.cond.filter(L=>BLOCK[L]);
    h+='<div class="card"><p class="step">Step 4. Condition blocks (1 minute)</p>'+(Ls.length?Ls.map(L=>"<h2>"+L+". "+esc(COND[L][0])+"</h2>"+BLOCK[L].map(b=>{const fl=F.blk[b.k]===b.flag;return q(b.q,seg("blk."+b.k,b.na?YNA:YN,F.blk[b.k])+(fl?'<div class="note warn"><b>Flagged.</b> '+esc(b.code===COND[L][1].split(".")[0]||["I10","E11","I50","R26"].includes(b.code)?"Linked to "+b.code:b.code)+". The CHW may: "+esc(b.may)+".</div>":""),miss("blk."+b.k));}).join("")).join(""):'<p class="muted">Tick a condition in Step 2 to see its questions.</p>')+"</div>";
    h+='<div class="card"><p class="step">Step 5. From the record, the labs, and your own eyes (1 minute)</p><h2>5a. Clinical triggers</h2><p class="small muted">Reasons to run the checklist. These are not barriers in themselves.</p>'
      +TRIG.map((t,i)=>box("trig."+i,esc(t[0])+' <span class="small muted">('+esc(t[1])+")</span>",F.trig.includes(i))).join("")
      +"<h2>5b. Observed barriers</h2><p class='small muted'>Documentable without asking.</p>"+OBS.map(o=>box("obs."+o[0],esc(o[1])+' <span class="small muted">('+esc(o[2])+")</span>",F.obs.includes(o[0]))+(F.obs.includes(o[0])?'<div class="'+(miss("links."+o[0])?"q miss":"")+'">'+(miss("links."+o[0])?'<label class="t">Link this barrier to a condition</label>':"")+linkRow(o[0])+"</div>":"")).join("")+"</div>";}
  const caps=S.w.filter(w=>w.role==="chw").map(w=>w.name+" has "+openOf(w.id).length+" of "+CFG.caseMax),full=S.w.filter(w=>w.role==="chw").every(w=>openOf(w.id).length>=CFG.caseMax),off=stop||full?["chw","both"]:[];
  h+='<div class="card"><p class="step">Step 6. Route the referral (30 seconds)</p><p class="small muted">Billable does not mean that a CHW episode is the right destination. CHW capacity is '+CFG.caseLow+" to "+CFG.caseMax+" patients at a time. Today "+esc(caps.join(" and "))+". "+keys.length+" barrier"+(keys.length===1?"":"s")+" flagged on this form.</p>"
    +'<div class="q'+(miss("route")?" miss":"")+'"><label class="t">Choose one destination</label><div class="seg multi neutral">'+Object.keys(ROUTE).map(k=>'<button data-set="route" data-v="'+k+'" class="'+(F.route===k?"on":"")+'"'+(off.includes(k)?" disabled":"")+"><b>"+esc(ROUTE[k][0])+"</b><br><span class='small'>"+esc(ROUTE[k][1])+"</span></button>").join("")+"</div></div>"
    +(full&&!stop?'<div class="note warn">Both CHWs are at capacity, so an episode cannot start today.</div>':"")+(miss("nobar")?'<div class="note bad">A CHW episode needs at least one flagged barrier. Without one, nothing is authorized.</div>':"")+"</div>";
  if(F.route==="chw"||F.route==="both")h+='<div class="card"><p class="step">Step 7. Sign-off (1 minute)</p><div class="'+(miss("sign")?"q miss":"")+'">'+(miss("sign")?'<label class="t">Every statement must be ticked</label>':"")+SIGN.map((s,i)=>box("sign."+i,esc(s),F.sign.includes(i))).join("")+"</div></div>";
  h+='<div class="row"><button class="pri" data-act="saveck">Sign and send the referral</button><button data-act="cancel">Cancel</button></div>';
  return h;}
function saveCk(){const F=UI.F,m=ckMissing(F);if(m.length){F.tried=true;return render();}
  let p;if(F.pid==="new"){const age=Math.floor(diff(TODAY,F.nw.dob)/365.25),nm=F.nw.name.trim();p={id:uid("pn"),hh:uid("hn"),name:nm,sort:nm.split(" ").pop()+" "+nm,sex:"",age,dob:F.nw.dob,mrn:F.nw.mrn.trim(),place:"",county:"",vol:null,phone:"",bp:[]};S.p.push(p);IX.p[p.id]=p;}else p=IX.p[F.pid];
  const keys=covOK(F.cov)||true?ckKeys(F):[],links={};for(const k of keys)links[k]=ckLinks(F,k);
  const epR=F.route==="chw"||F.route==="both";
  const ck={id:uid("k"),p:p.id,d:TODAY,by:UI.who,vt:F.vt,cov:{...F.cov},cond:F.cond.slice(),other:F.other,otherCode:F.otherCode,core:{...F.core},blk:{...F.blk},links,obs:F.obs.slice(),trig:F.trig.slice(),route:F.route,signed:epR};S.ck.push(ck);IX.ck[ck.id]=ck;
  for(const b of barsOf(p.id))if(!b.res&&b.status==="plan"&&!b.ep)b.res=TODAY;   // an older plan with no episode is replaced by this one
  const bs=keys.filter(k=>links[k].length).map(k=>{const b={id:uid("b"),p:p.id,ck:ck.id,key:k,links:links[k],src:"checklist",status:"plan",d:TODAY,res:null};S.b.push(b);IX.b[b.id]=b;return b;});
  let msg="Referral saved for "+p.name+". ";
  if(epR){const c=S.w.filter(w=>w.role==="chw").sort((a,b)=>openOf(a.id).length-openOf(b.id).length)[0],e={id:uid("e"),p:p.id,ck:ck.id,chw:c.id,start:TODAY,_end:addD(TODAY,CFG.epDays)};S.ep.push(e);IX.ep[e.id]=e;for(const b of bs)b.ep=e.id;
    msg+="A CHW episode has started with "+c.name+", who now has "+openOf(c.id).length+" of "+CFG.caseMax+" patients. "+bs.length+" barrier"+(bs.length===1?" is":"s are")+" in the plan.";}
  else msg+=F.route==="vol"?"Sent to the volunteer coordinator. This referral is not billable.":"Recorded as clinic action only.";
  UI.F=null;UI.note=[msg];UI.pid=p.id;UI.back={tab:"todo"};UI.tab="patients";UI.mode="person";render();}

/* ---------- one person ---------- */
function vPerson(){const p=IX.p[UI.pid],w=me(),c=lastCk(p.id),e=lastEp(p.id),open=e&&!e.end,bs=barsOf(p.id),ym=TODAY.slice(0,7),mb=monthBill(ym).find(o=>o.p.id===p.id);
  let h='<button class="link" data-act="back">‹ Back</button>'+noteHtml()+"<h1>"+esc(p.name)+'</h1><div class="row">'+chip(p.age+" years")+(p.mrn?chip(p.mrn):"")+(c?COVCHIP(c):"")+(c?chip(...ROUTECHIP[c.route]):chip("No referral checklist yet","warn"))+"</div>";
  h+='<div class="card"><dl class="kv"><dt>Date of birth</dt><dd>'+fmtD(p.dob)+"</dd>"+(p.place?"<dt>Community</dt><dd>"+esc(p.place)+", "+esc(p.county)+" County</dd>":"")+(p.phone?"<dt>Phone</dt><dd>"+esc(p.phone)+"</dd>":"")+"<dt>Volunteer visitor</dt><dd>"+(p.vol?esc(IX.w[p.vol].name):"None yet")+"</dd>"
    +(c?"<dt>Referral checklist</dt><dd>"+fmtD(c.d)+", "+esc(c.vt)+", "+esc(IX.w[c.by].name)+"</dd><dt>Active conditions</dt><dd>"+c.cond.map(L=>(L==="O"?"":L+" ")+esc(condTxt(c,L))).join("; ")+"</dd>":"")
    +(c&&c.trig.length?"<dt>Clinical triggers</dt><dd>"+c.trig.map(i=>esc(TRIG[i][0])).join("; ")+"</dd>":"")+"</dl>"
    +'<div class="row">'+(w.role==="clinic"&&!open?'<button data-act="startck" data-id="'+p.id+'">'+(c?"New referral checklist":"Start the referral checklist")+"</button>":"")+"</div></div>";
  if(e){const d=epDay(e),vd=visitsDone(e);
    h+='<div class="card task '+(open?(d>CFG.epDays?"p1":"p2"):"p3")+'"><h3>CHW episode</h3><h2>'+(open?"Day "+d+" of "+CFG.epDays+" with "+esc(IX.w[e.chw].name):"Closed on "+fmtD(e.end))+"</h2><p class='small muted'>Started "+fmtD(e.start)+". "+vd+" of "+CFG.visitDays.length+" home visits made."+(open&&d>CFG.epDays?" The episode is past day "+CFG.epDays+" and has not been handed off.":"")+"</p>"
      +(e.handoff?"<p>"+esc(e.handoff.reason)+". "+(e.handoff.vol?"Handed off to volunteer visitor "+esc(IX.w[e.handoff.vol].name)+".":"No volunteer handoff.")+(e.handoff.watch.length?" To keep watching: "+e.handoff.watch.map(id=>esc(BAR[IX.b[id].key].label)).join("; ")+".":"")+(e.handoff.note?" "+esc(e.handoff.note):"")+"</p>":"")
      +(open&&w.id===e.chw?'<div class="row"><button class="pri" data-act="work" data-id="'+p.id+'">Record work</button><button data-act="handoff" data-id="'+p.id+'">Close the episode and hand off</button></div>':"")+"</div>";}
  if(mb&&(mb.count||mb.pend||mb.other)){const u=units(mb.count);
    h+='<div class="card"><h3>Time logged in '+fmtYM(ym)+'</h3><div class="grid">'+stat("Countable minutes",mb.count,u.g19?"G0019 × 1"+(u.g22?", G0022 × "+u.g22:"")+", "+money(u.amt):(CFG.first-mb.count)+" more needed before the month can be billed")+stat("Waiting for review",mb.pend,"minutes on barriers not yet in the plan")+stat("Not countable",mb.other+mb.travel,"travel, and time not tied to a barrier")+"</div></div>";}
  if(bs.length)h+='<div class="card"><h3>Barriers</h3>'+tbl(["Barrier","Code","Linked to","Status","#Minutes"],bs.map(b=>"<tr><td>"+esc(BAR[b.key].label)+(b.src==="chw"?'<div class="small muted">Found by the CHW on '+fmtD(b.d)+"</div>":"")+(BAR[b.key].may&&!b.res?'<div class="small muted">The CHW may: '+esc(BAR[b.key].may)+"</div>":"")+"</td><td>"+esc(BAR[b.key].code)+"</td><td>"+esc(linkTxt(b))+"</td><td>"+bStat(b)+"</td><td class='n'>"+sum(S.t.filter(r=>r.b===b.id).map(r=>r.min))+"</td></tr>"))+"</div>";
  else if(c)h+='<div class="card"><h3>Barriers</h3><p class="muted">No barrier was flagged on the checklist.</p></div>';
  if(p.bp.length)h+='<div class="card"><h3>Blood pressure readings taken at home visits</h3>'+tbl(["Date","#Reading","Taken by"],p.bp.slice(-6).reverse().map(r=>"<tr><td>"+fmtD(r.d)+"</td><td class='n'>"+r.s+"/"+r.di+"</td><td>"+esc(IX.w[r.by].name)+"</td></tr>"))+"</div>";
  const ap=S.app.filter(a=>a.p===p.id),it=S.item.filter(a=>a.p===p.id);
  if(ap.length)h+='<div class="card"><h3>Applications and referrals</h3>'+tbl(["Program","Started","Status"],ap.map(a=>"<tr><td>"+esc(a.type)+"</td><td>"+fmtD(a.d)+"</td><td>"+chip(a.status==="approved"?"Approved "+fmtD(a.dec):a.status==="declined"?"Declined "+fmtD(a.dec):a.status==="submitted"?"Submitted "+fmtD(a.sub):"Started",a.status==="approved"?"good":a.status==="declined"?"bad":"warn")+"</td></tr>"))+"</div>";
  if(it.length)h+='<div class="card"><h3>Items delivered</h3><p>'+it.map(a=>esc(a.item)+" ("+fmtD(a.d)+")").join("; ")+"</p></div>";
  const acts=S.a.filter(a=>a.p===p.id).sort((a,b)=>a.d<b.d?1:-1);
  if(acts.length)h+='<div class="card"><h3>CHW work, most recent first</h3>'+tbl(["Date","Work","#Minutes","Note"],acts.slice(0,UI.all?999:8).map(a=>{const rows=S.t.filter(r=>r.a===a.id);return"<tr><td>"+fmtD(a.d)+"</td><td>"+esc(a.kind)+(a.bp?'<div class="small muted">Blood pressure '+a.bp.s+"/"+a.bp.di+"</div>":"")+"</td><td class='n'>"+sum(rows.filter(r=>r.kind!=="Travel").map(r=>r.min))+"</td><td class='small'>"+(a.safety==="y"?chip("Safety concern","bad")+" "+esc(a.safeNote):esc(a.note||""))+"</td></tr>";}))+(acts.length>8&&!UI.all?'<button data-act="all">Show all '+acts.length+"</button>":"")+"</div>";
  const fl=S.flag.filter(f=>f.p===p.id);
  if(fl.length)h+='<div class="card"><h3>Flags from the volunteer visitor</h3>'+tbl(["Date","Flag","Status"],fl.slice().reverse().map(f=>"<tr><td>"+fmtD(f.d)+"</td><td>"+esc(FLAGS[f.type][0])+"</td><td>"+(f.status==="done"?chip(f.act,"good"):chip("Open","warn"))+"</td></tr>"))+"</div>";
  return h;}

/* ---------- clinic: patients ---------- */
function vPatients(){const ym=TODAY.slice(0,7),mb=Object.fromEntries(monthBill(ym).map(o=>[o.p.id,o])),qq=UI.q.trim().toLowerCase();
  const F={ref:["Referred with the checklist",p=>lastCk(p.id)],ep:["In a CHW episode now",p=>openEp(p.id)],vol:["Routed to a volunteer visitor",p=>{const c=lastCk(p.id);return c&&(c.route==="vol"||(c.route==="both"&&!openEp(p.id)));}],cl:["Clinic action only",p=>(lastCk(p.id)||{}).route==="clinic"],no:["No checklist yet",p=>!lastCk(p.id)],all:["Everyone on the register",()=>true]};
  let L=S.p.filter(F[UI.pf][1]).filter(p=>!qq||p.name.toLowerCase().includes(qq)||p.mrn.toLowerCase().includes(qq)).sort((a,b)=>a.sort<b.sort?-1:1);
  let h="<h1>Patients</h1>"+'<div class="row"><select id="pf" aria-label="Show">'+Object.keys(F).map(k=>'<option value="'+k+'"'+(k===UI.pf?" selected":"")+">"+F[k][0]+"</option>").join("")+'</select><input id="q" type="search" placeholder="Name or MRN" value="'+esc(UI.q)+'" class="grow"></div><p class="muted small">'+L.length+" people. Example data: every person is fictitious.</p>";
  const show=UI.all?L:L.slice(0,40);
  h+='<div class="card">'+tbl(["Name","#Age","Community","Destination","CHW episode","#Countable minutes, "+MON[+ym.slice(5,7)-1]],show.map(p=>{const c=lastCk(p.id),e=lastEp(p.id);return"<tr><td>"+pLink(p)+'<div class="small muted">'+esc(p.mrn)+"</div></td><td class='n'>"+p.age+"</td><td>"+esc(p.place)+"</td><td>"+(c?chip(...ROUTECHIP[c.route]):"")+"</td><td>"+(e?(e.end?"Closed "+fmtD(e.end):"Day "+epDay(e)+" of "+CFG.epDays):"")+"</td><td class='n'>"+(mb[p.id]?mb[p.id].count:"")+"</td></tr>";}))+(L.length>40&&!UI.all?'<button data-act="all">Show all '+L.length+"</button>":"")+"</div>";
  return h;}

/* ---------- billing ---------- */
function billRows(ym){return monthBill(ym).filter(o=>o.count||o.pend);}
function vBilling(){const ym=UI.ym,R=billRows(ym),ok=R.filter(o=>o.g19),cur=ym===TODAY.slice(0,7),tot=sum(ok.map(o=>o.amt));
  let h="<h1>Billing</h1>"+'<div class="row">'+ymSel()+'<button data-act="csv">Download the month for the billing office (CSV)</button></div>';
  h+="<p class='muted'>Community Health Integration (CHI), the Medicare payment for CHW services. G0019 is the first "+CFG.first+" minutes of countable CHW time in a calendar month, and G0022 is each further "+CFG.add+" minutes."+(cur?" This month is still in progress.":"")+"</p>";
  h+='<div class="grid">'+stat("Patients with countable time",R.filter(o=>o.count).length)+stat("Patients who can be billed",ok.length,"at least "+CFG.first+" countable minutes")+stat("G0019 units",sum(ok.map(o=>o.g19)))+stat("G0022 units",sum(ok.map(o=>o.g22)))+stat("Allowed amount",money0(tot),"Medicare pays "+CFG.medicare+"%: "+money(tot*CFG.medicare/100))+"</div>";
  h+='<div class="card">'+tbl(["Patient","Cost sharing","#Countable minutes","#G0019","#G0022","#Allowed","Note"],R.map(o=>{const n=[];if(!o.g19&&o.count)n.push((CFG.first-o.count)+" minutes short of "+CFG.first);if(o.pend)n.push(o.pend+" minutes wait for a barrier review");
    return"<tr><td>"+pLink(o.p)+'<div class="small muted">'+esc(o.p.mrn)+"</div></td><td>"+(o.ck?esc(PATHS[o.ck.cov.path]||""):"")+"</td><td class='n'>"+o.count+"</td><td class='n'>"+(o.g19||"")+"</td><td class='n'>"+(o.g22||"")+"</td><td class='n'>"+(o.amt?money(o.amt):"")+"</td><td class='small'>"+esc(n.join(". "))+"</td></tr>";}))+"</div>";
  const by={};for(const o of ok){const k=o.ck.cov.path;by[k]=by[k]||[0,0];by[k][0]++;by[k][1]+=o.amt;}
  h+='<div class="card"><h3>By cost-sharing pathway</h3>'+tbl(["Pathway","#Patients billed","#Allowed","#Coinsurance (20%)"],Object.keys(PATHS).map(k=>"<tr><td>"+esc(PATHS[k])+"</td><td class='n'>"+((by[k]||[0])[0])+"</td><td class='n'>"+money((by[k]||[0,0])[1])+"</td><td class='n'>"+money((by[k]||[0,0])[1]*(100-CFG.medicare)/100)+"</td></tr>"))+"</div>";
  h+='<div class="note">Only time tied to a barrier in the plan is counted, and each barrier is tied to an active condition. Time on a barrier that the CHW found later is held until the practitioner reviews it. The rates ('+money(CFG.rate.g19)+" and "+money(CFG.rate.g22)+") are 2026 national figures before geographic adjustment, set in Settings. Whether the full "+CFG.first+" minutes must be reached before G0019 is billed has not been confirmed against Medicare guidance: ask the billing office.</div>";
  return h;}
function csv(){const ym=UI.ym,R=billRows(ym).filter(o=>o.g19),qv=s=>'"'+String(s).replace(/"/g,'""')+'"';
  const lines=[["Month","Patient","MRN","Date of birth","Billing practitioner","Cost-sharing pathway","Countable minutes","G0019 units","G0022 units","Allowed amount","Active conditions","Barrier codes","First date of service","Last date of service","Dates of service"].map(qv).join(",")];
  for(const o of R){const ds=[...o.dates].sort();lines.push([ym,o.p.name,o.p.mrn,o.p.dob,IX.w[o.ck.by].name,PATHS[o.ck.cov.path],o.count,o.g19,o.g22,o.amt.toFixed(2),o.ck.cond.map(L=>L==="O"?(o.ck.otherCode||"Other"):COND[L][1]||"Recent discharge").join("; "),[...o.codes].join("; "),ds[0],ds[ds.length-1],ds.join(" ")].map(qv).join(","));}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([lines.join("\r\n")],{type:"text/csv"}));a.download="silver-chi-billing-"+ym+".csv";document.body.appendChild(a);a.click();a.remove();UI.note=[R.length+" patients written to "+a.download+". Example data only."];UI.keep=true;render();}

/* ---------- CHW: due list ---------- */
function tasks(chw){const out=[],ym=TODAY.slice(0,7),mb=Object.fromEntries(monthBill(ym,chw).map(o=>[o.p.id,o])),left=diff(monthEnd(ym),TODAY);
  for(const e of openOf(chw)){const p=IX.p[e.p],d=epDay(e),vd=visitsDone(e),why=[];let pr=3;const set=n=>{if(n<pr)pr=n;};
    if(d>CFG.epDays){why.push("Day "+d+": the episode is past day "+CFG.epDays+". Close it and hand off to the volunteer visitor");set(1);}
    if(vd===0){why.push("Referred by the clinic on "+fmtD(e.start)+". The first home visit has not been made");set(d>=CFG.visitDays[0]?1:2);}
    else if(vd<CFG.visitDays.length&&d<=CFG.epDays){const due=addD(e.start,CFG.visitDays[vd]),late=diff(TODAY,due);
      if(late>=0){why.push("Home visit "+(vd+1)+" of "+CFG.visitDays.length+" was due on "+fmtD(due));set(late>7?1:2);}else if(late>=-3){why.push("Home visit "+(vd+1)+" of "+CFG.visitDays.length+" is due on "+fmtD(due));set(2);}}
    const lc=lastContact(e);if(lc&&diff(TODAY,lc)>=CFG.callGap&&d<=CFG.epDays&&vd>0){why.push("No contact since "+fmtD(lc)+": a call is due");set(2);}
    const rv=S.b.filter(b=>b.ep===e.id&&b.status==="review"&&diff(TODAY,b.d)>=7);if(rv.length){why.push("A barrier you found on "+fmtD(rv[0].d)+" still waits for the practitioner's review: ask the clinic");set(2);}
    for(const a of S.app.filter(a=>a.ep===e.id)){if(a.status==="started"&&diff(TODAY,a.d)>=14){why.push(a.type+" application started on "+fmtD(a.d)+" and not yet submitted");set(2);}
      else if(a.status==="submitted"&&diff(TODAY,a.sub)>=30){why.push(a.type+" application submitted on "+fmtD(a.sub)+" with no decision recorded");set(3);}}
    const o=mb[p.id];if(left<=10&&o&&o.count>0&&o.count<CFG.first)why.push(o.count+" countable minutes logged this month. The month can be billed only from "+CFG.first+" minutes");
    if(d>=CFG.epDays-14&&d<=CFG.epDays){why.push("Day "+d+" of "+CFG.epDays+": prepare the handoff"+(p.vol?" to "+IX.w[p.vol].name:""));}
    if(why.length)out.push({p:pr,e,person:p,d,why:why.join(". ")+"."});}
  return out.sort((a,b)=>a.p-b.p||b.d-a.d);}
function vToday(){const w=me(),ts=tasks(w.id),n=openOf(w.id).length,ym=TODAY.slice(0,7),mb=monthBill(ym,w.id);
  let h="<h1>Today</h1><p class='muted'>"+fmtD(TODAY)+". Every line says why the person is on the list.</p>"+noteHtml();
  h+='<div class="grid">'+stat("Patients in an episode",n+" of "+CFG.caseMax,n>CFG.caseMax?"Above the limit":n>=CFG.caseLow?"Within the usual range of "+CFG.caseLow+" to "+CFG.caseMax:"Room for "+(CFG.caseLow-n)+" more before the usual range")+stat("Priority",ts.filter(t=>t.p===1).length)+stat("Due",ts.filter(t=>t.p===2).length)+stat("Countable hours this month",hrs(sum(mb.map(o=>o.count))))+"</div>";
  h+=ts.map(t=>'<div class="card task p'+t.p+'"><div class="row"><div class="grow"><h3>'+(t.p===1?"Priority":t.p===2?"Due":"To prepare")+" · day "+t.d+" of "+CFG.epDays+"</h3><h2>"+esc(t.person.name)+' <span class="muted small">'+esc(t.person.place)+"</span></h2><p class='small'>"+esc(t.why)+'</p></div><button class="pri" data-pid="'+t.person.id+'">Open</button></div></div>').join("");
  if(!ts.length)h+='<div class="note">Nothing is due today.</div>';return h;}
function vMine(){const w=me(),open=openOf(w.id).sort((a,b)=>epDay(b)-epDay(a)),closed=S.ep.filter(e=>e.chw===w.id&&e.end).sort((a,b)=>a.end<b.end?1:-1),ym=TODAY.slice(0,7),mb=Object.fromEntries(monthBill(ym,w.id).map(o=>[o.p.id,o]));
  let h="<h1>My patients</h1><p class='muted'>"+open.length+" in an episode now. The limit is "+CFG.caseMax+" at one time.</p>"+noteHtml();
  h+='<div class="card">'+tbl(["Patient","#Day","#Home visits","#Open barriers","#Countable minutes, "+MON[+ym.slice(5,7)-1],""],open.map(e=>{const p=IX.p[e.p],d=epDay(e);return"<tr><td>"+pLink(p)+'<div class="small muted">'+esc(p.place)+"</div></td><td class='n'>"+(d>CFG.epDays?chip(d+" of "+CFG.epDays,"bad"):d+" of "+CFG.epDays)+"</td><td class='n'>"+visitsDone(e)+" of "+CFG.visitDays.length+"</td><td class='n'>"+S.b.filter(b=>b.ep===e.id&&!b.res&&b.status!=="declined").length+"</td><td class='n'>"+((mb[p.id]||{}).count||0)+'</td><td><button data-act="work" data-id="'+p.id+'">Record work</button></td></tr>';}))+"</div>";
  h+='<div class="card"><h3>Closed episodes ('+closed.length+")</h3>"+tbl(["Patient","Closed","Result","Handed off to"],closed.slice(0,UI.all?999:10).map(e=>"<tr><td>"+pLink(IX.p[e.p])+"</td><td>"+fmtD(e.end)+"</td><td>"+esc(e.handoff.reason)+"</td><td>"+(e.handoff.vol?esc(IX.w[e.handoff.vol].name):"")+"</td></tr>"))+(closed.length>10&&!UI.all?'<button data-act="all">Show all '+closed.length+"</button>":"")+"</div>";
  return h;}

/* ---------- CHW: record work ---------- */
function startWork(pid){UI.pid=pid;UI.F={t:"work",pid,d:TODAY,kind:null,min:{},res:[],newKey:"",newMin:"",newLink:[],other:"",travel:"",s:"",di:"",items:[],apps:[],appst:{},safety:null,safeNote:"",note:"",tried:false};UI.mode="work";}
function workTot(F){const n=x=>Math.max(0,Math.round(+x||0));let plan=0,pend=0;for(const id in F.min){const b=IX.b[id];if(b.status==="review")pend+=n(F.min[id]);else plan+=n(F.min[id]);}pend+=F.newKey?n(F.newMin):0;return{plan,pend,other:n(F.other),travel:n(F.travel)};}
const totHtml=F=>{const t=workTot(F);return"<b>"+t.plan+"</b> countable minutes"+(t.pend?", <b>"+t.pend+"</b> waiting for review":"")+(t.other?", <b>"+t.other+"</b> not tied to a barrier":"")+(t.travel?", <b>"+t.travel+"</b> travel":"")+"."};
function bpNote(F){const s=+F.s,d=+F.di;if(!s||!d)return"";const B=CFG.bp;
  if(s>=B.now[0]||d>=B.now[1])return'<div class="note bad"><b>'+s+"/"+d+": call the clinic now.</b> If the person has chest pain, weakness on one side, trouble speaking or a severe headache, call 911. Draft line, for clinical review.</div>";
  if(s>=B.report[0]||d>=B.report[1])return'<div class="note warn"><b>'+s+"/"+d+": report this reading to the clinic today.</b> Medication questions go to the pharmacist or the prescriber. Draft line, for clinical review.</div>";
  return'<div class="note">'+s+"/"+d+": below the reporting line. Write it on the wall log.</div>";}
function vWork(){const F=UI.F,p=IX.p[F.pid],e=openEp(p.id),c=IX.ck[e.ck],bs=S.b.filter(b=>b.ep===e.id&&!b.res&&b.status!=="declined"),T=F.tried,t=workTot(F),home=F.kind===KINDS[0],direct=F.kind&&F.kind!==KINDS[2];
  const free=Object.values(BAR).filter(B=>!S.b.some(b=>b.ep===e.id&&b.key===B.k)&&(!B.cond||c.cond.includes(B.cond))),openApps=S.app.filter(a=>a.ep===e.id&&(a.status==="started"||a.status==="submitted"));
  let h='<button class="link" data-act="cancel">‹ Cancel</button><h1>Record work: '+esc(p.name)+"</h1><p class='muted'>Day "+epDay(e)+" of "+CFG.epDays+". Log the minutes against the barrier you worked on. Only time on a barrier in the plan can be billed.</p>";
  if(T)h+='<div class="note bad">Some answers are missing. They are marked in red.</div>';
  h+='<div class="card">'+q("What kind of work was this?",seg("kind",KINDS.map(k=>[k,k]),F.kind),T&&!F.kind)+q("Date",'<input type="date" data-n="d" max="'+TODAY+'" value="'+esc(F.d)+'">',T&&(!F.d||F.d>TODAY||F.d<e.start),"Not before the episode started on "+fmtD(e.start)+".")+"</div>";
  h+='<div class="card'+(T&&!(t.plan+t.pend+t.other)?" q miss":"")+'"><h3>Minutes, by barrier</h3>'+(T&&!(t.plan+t.pend+t.other)?'<label class="t">Enter the minutes worked</label>':"")
    +(bs.length?bs.map(b=>'<div class="minrow"><div class="grow"><b>'+esc(BAR[b.key].label)+"</b> "+(b.status==="review"?chip("Waiting for review","warn"):"")+(BAR[b.key].may?'<div class="small muted">You may: '+esc(BAR[b.key].may)+"</div>":"")+"</div>"+num("min."+b.id,F.min[b.id],"min",84,1)+'<button data-tog="res" data-v="'+b.id+'" class="'+(F.res.includes(b.id)?"on":"")+'" style="'+(F.res.includes(b.id)?"background:var(--good-bg);color:var(--good);border-color:var(--good)":"")+'">'+(F.res.includes(b.id)?"Resolved today ✓":"Mark resolved")+"</button></div>").join(""):'<p class="muted">No open barrier is in the plan.</p>')
    +'<div class="minrow"><div class="grow"><b>A barrier that is not in the plan</b><div class="small muted">The practitioner must review it and add it to the plan before these minutes can be counted.</div><select data-sel="newKey"><option value="">None found today</option>'+free.map(B=>'<option value="'+B.k+'"'+(F.newKey===B.k?" selected":"")+">"+esc(B.label)+"</option>").join("")+"</select>"
    +(F.newKey&&!BAR[F.newKey].cond&&c.cond.length>1?'<div class="'+(T&&!F.newLink.length?"q miss":"")+'"><label class="t small">Which condition does it obstruct?</label>'+multi("newLink",c.cond.map(L=>[L,L==="O"?"Other":L+" "+COND[L][0]]),F.newLink)+"</div>":"")+"</div>"+(F.newKey?num("newMin",F.newMin,"min",84,1):"")+"</div>"
    +'<div class="minrow"><div class="grow"><b>Other time with or for this patient</b><div class="small muted">Not tied to a barrier. Not billable.</div></div>'+num("other",F.other,"min",84,1)+"</div>"
    +(home?'<div class="minrow"><div class="grow"><b>Travel for this visit</b><div class="small muted">Not billable. Logged so that the share of your hours that is billable can be measured.</div></div>'+num("travel",F.travel,"min",84,1)+"</div>":"")
    +'<p id="tot" class="small">'+totHtml(F)+"</p></div>";
  if(home){h+='<div class="card">'+(c.cond.includes("A")?q("Blood pressure, if taken",'<div class="row">'+num("s",F.s,"upper",96,1)+"<span>over</span>"+num("di",F.di,"lower",96,1)+'</div><div id="bpn">'+bpNote(F)+"</div>",T&&(!!F.s!==!!F.di),"Enter the reading exactly as the cuff shows it."):"")
      +q("Items delivered today",multi("items",ITEMS.map(i=>[i,i]),F.items),false,"Tap each item left in the home. Leave blank if none.")+"</div>";}
  if(F.kind)h+='<div class="card">'+q("Applications and referrals started today",multi("apps",APPS.filter(a=>!S.app.some(x=>x.p===p.id&&x.type===a)).map(a=>[a,a]),F.apps),false,"Leave blank if none.")
    +(openApps.length?"<h3>Open applications</h3>"+openApps.map(a=>'<div class="minrow"><div class="grow"><b>'+esc(a.type)+'</b><div class="small muted">'+(a.status==="started"?"Started "+fmtD(a.d):"Submitted "+fmtD(a.sub))+"</div></div>"+seg("appst."+a.id,(a.status==="started"?[["submitted","Submitted today"]]:[]).concat([["approved","Approved"],["declined","Declined"]]),F.appst[a.id])+"</div>").join(""):"")+"</div>";
  if(direct)h+='<div class="card">'+q("Did anything today raise a safety concern?",seg("safety",YN,F.safety)+(F.safety==="y"?'<div class="note bad"><b>Call the clinical supervisor today, before you finish work.</b> If there is immediate danger, call 911. For thoughts of suicide, the 988 Suicide and Crisis Lifeline answers calls and texts at 988. Draft protocol, for clinical review.</div><textarea data-n="safeNote" placeholder="What you saw or heard, and what you did">'+esc(F.safeNote)+"</textarea>":""),T&&(!F.safety||(F.safety==="y"&&!F.safeNote.trim())),"Talk of self-harm, harm from another person, or immediate danger in the home.")+"</div>";
  h+='<div class="card">'+q("Note (optional)",'<textarea data-n="note" placeholder="What was done">'+esc(F.note)+"</textarea>")+'</div><div class="row"><button class="pri" data-act="savework">Save</button><button data-act="cancel">Cancel</button></div>';
  return h;}
function saveWork(){const F=UI.F,p=IX.p[F.pid],e=openEp(p.id),c=IX.ck[e.ck],t=workTot(F),direct=F.kind&&F.kind!==KINDS[2],home=F.kind===KINDS[0],n=x=>Math.max(0,Math.round(+x||0));
  const needLink=F.newKey&&!BAR[F.newKey].cond&&c.cond.length>1&&!F.newLink.length;
  if(!F.kind||!F.d||F.d>TODAY||F.d<e.start||!(t.plan+t.pend+t.other)||(direct&&(!F.safety||(F.safety==="y"&&!F.safeNote.trim())))||(home&&(!!F.s!==!!F.di))||needLink||(F.newKey&&!n(F.newMin))){F.tried=true;return render();}
  const a={id:uid("a"),chw:UI.who,d:F.d,p:p.id,ep:e.id,kind:F.kind,items:home?F.items.slice():[],safety:direct?F.safety:"n",safeNote:F.safeNote.trim(),note:F.note.trim()};S.a.push(a);IX.a[a.id]=a;
  const row=(b,min,kind)=>{if(min>0)S.t.push({id:uid("t"),a:a.id,chw:UI.who,d:F.d,p:p.id,ep:e.id,kind:kind||F.kind,b,min});};
  for(const id in F.min)row(id,n(F.min[id]));
  if(F.newKey){const B=BAR[F.newKey],b={id:uid("b"),p:p.id,ck:c.id,ep:e.id,key:F.newKey,links:B.cond?[B.cond]:c.cond.length===1?c.cond.slice():F.newLink.slice(),src:"chw",status:"review",d:F.d,res:null,by:UI.who};S.b.push(b);IX.b[b.id]=b;row(b.id,n(F.newMin));}
  row(null,t.other);if(home)row(null,t.travel,"Travel");
  for(const id of F.res)IX.b[id].res=F.d;
  if(home&&F.s&&F.di){a.bp={s:+F.s,di:+F.di};p.bp.push({d:F.d,s:+F.s,di:+F.di,by:UI.who});}
  for(const it of a.items)S.item.push({id:uid("i"),p:p.id,ep:e.id,d:F.d,item:it,by:UI.who});
  for(const ty of F.apps)S.app.push({id:uid("ap"),p:p.id,ep:e.id,b:null,type:ty,d:F.d,status:"started"});
  for(const id in F.appst){const ap=S.app.find(x=>x.id===id),v=F.appst[id];if(!ap||!v)continue;ap.status=v;if(v==="submitted")ap.sub=F.d;else{ap.dec=F.d;if(!ap.sub)ap.sub=F.d;}}
  const mb=monthBill(F.d.slice(0,7)).find(o=>o.p.id===p.id);
  UI.note=["Saved: "+t.plan+" countable minutes"+(t.pend?", and "+t.pend+" that wait for the practitioner's review":"")+". "+p.name+" now has "+mb.count+" countable minutes in "+fmtYM(F.d.slice(0,7))+"."+(a.safety==="y"?" The safety concern is on the clinic's To do list. Call the clinical supervisor today.":""),a.safety==="y"?"bad":""];
  UI.F=null;UI.mode="person";render();}

/* ---------- CHW: handoff ---------- */
function startHandoff(pid){const p=IX.p[pid];UI.pid=pid;UI.F={t:"ho",pid,reason:null,vol:p.vol||"",watch:[],note:"",tried:false};UI.mode="handoff";}
function vHandoff(){const F=UI.F,p=IX.p[F.pid],e=openEp(p.id),bs=S.b.filter(b=>b.ep===e.id&&!b.res&&b.status!=="declined"),vols=S.w.filter(w=>w.role==="vol"),T=F.tried,done=F.reason===ENDS[0];
  let h='<button class="link" data-act="cancel">‹ Cancel</button><h1>Close the episode: '+esc(p.name)+"</h1><p class='muted'>Day "+epDay(e)+" of "+CFG.epDays+". "+visitsDone(e)+" of "+CFG.visitDays.length+" home visits made. An episode ends with a handoff back to the volunteer visitor.</p>";
  h+='<div class="card">'+q("Why is the episode closing?",seg("reason",ENDS.map(x=>[x,x]),F.reason),T&&!F.reason)
    +(done?q("Volunteer visitor who continues the monthly visits",'<select data-sel="vol"><option value="">None yet: ask the coordinator to pair one</option>'+vols.map(v=>'<option value="'+v.id+'"'+(F.vol===v.id?" selected":"")+">"+esc(v.name)+" (Care Group "+v.cg+")</option>").join("")+"</select>")
      +(bs.length?q("What should the volunteer keep watching?",multi("watch",bs.map(b=>[b.id,BAR[b.key].label]),F.watch),false,"Barriers still open. The volunteer observes and reports, and does not act on them."):"")
      +q("Note for the volunteer and the coordinator (optional)",'<textarea data-n="note">'+esc(F.note)+"</textarea>"):"")+'</div><div class="row"><button class="pri" data-act="savehandoff">Close the episode</button><button data-act="cancel">Cancel</button></div>';
  return h;}
function saveHandoff(){const F=UI.F;if(!F.reason){F.tried=true;return render();}const p=IX.p[F.pid],e=openEp(p.id),done=F.reason===ENDS[0];
  e.end=TODAY;e.handoff={d:TODAY,reason:F.reason,vol:done?(F.vol||null):null,watch:done?F.watch.slice():[],note:F.note.trim()};if(done&&F.vol)p.vol=F.vol;
  UI.note=["Episode closed for "+p.name+". You now have "+openOf(UI.who).length+" of "+CFG.caseMax+" patients."+(done?(F.vol?" Handed off to "+IX.w[F.vol].name+".":" The coordinator has been asked to pair a volunteer."):"")];UI.F=null;UI.mode=null;UI.tab="mine";render();}

/* ---------- CHW: time log ---------- */
function paidMin(ym){const y=+ym.slice(0,4),m=+ym.slice(5,7),days=new Date(Date.UTC(y,m,0)).getUTCDate(),a=ym===CFG.start.slice(0,7)?+CFG.start.slice(8,10):1,b=ym===TODAY.slice(0,7)?+TODAY.slice(8,10):days;return CFG.paidHours*60*(b-a+1)/days;}
function timeSum(ym,chw){const o={count:0,pend:0,other:0,travel:0,non:0,kinds:{}};for(const r of S.t){if(r.d.slice(0,7)!==ym||(chw&&r.chw!==chw))continue;const st=rowState(r);o[st]+=r.min;if(st==="non")o.kinds[r.kind]=(o.kinds[r.kind]||0)+r.min;}o.all=o.count+o.pend+o.other+o.travel+o.non;return o;}
function vTime(){const w=me(),ym=UI.ym,t=timeSum(ym,w.id),R=monthBill(ym,w.id),paid=paidMin(ym),F=UI.F&&UI.F.t==="nt"?UI.F:(UI.F={t:"nt",kind:null,min:"",d:TODAY,tried:false});
  let h="<h1>Time log</h1>"+'<div class="row">'+ymSel()+"</div>"+noteHtml();
  h+='<div class="grid">'+stat("Countable hours",hrs(t.count),"on barriers in the plan")+stat("Waiting for review",hrs(t.pend),"hours")+stat("Travel",hrs(t.travel),"hours")+stat("Billable share",pct(t.count,paid)+"%","of "+Math.round(paid/60)+" paid hours. Planning figure "+CFG.util.plan+"%, floor "+CFG.util.floor+"%")+"</div>";
  h+='<div class="card"><h3>By patient</h3>'+tbl(["Patient","#Countable","#Waiting for review","#Not tied to a barrier","#Travel","Billing"],R.map(o=>"<tr><td>"+pLink(o.p)+"</td><td class='n'>"+o.count+"</td><td class='n'>"+(o.pend||"")+"</td><td class='n'>"+(o.other||"")+"</td><td class='n'>"+(o.travel||"")+"</td><td class='small'>"+(o.g19?"G0019"+(o.g22?" + G0022 × "+o.g22:""):o.count?(CFG.first-o.count)+" minutes short":"")+"</td></tr>"))+"<p class='small muted'>Minutes.</p></div>";
  h+='<div class="card"><h3>Time not tied to one patient</h3>'+tbl(["Kind","#Hours"],NONPT.map(k=>"<tr><td>"+esc(k)+"</td><td class='n'>"+hrs(t.kinds[k]||0)+"</td></tr>"))
    +"<h2>Add time</h2>"+q("Kind",seg("kind",NONPT.map(k=>[k,k]),F.kind),F.tried&&!F.kind)+q("Minutes and date",'<div class="row">'+num("min",F.min,"min",96)+'<input type="date" data-n="d" max="'+TODAY+'" value="'+esc(F.d)+'"></div>',F.tried&&(!(+F.min>0)||!F.d||F.d>TODAY))+'<div class="row"><button class="pri" data-act="addtime">Add</button></div></div>';
  return h;}

/* ---------- reports ---------- */
function vReports(){const w=me(),chw=w.role==="chw"?w.id:null,EP=S.ep.filter(e=>!chw||e.chw===chw),epIds=new Set(EP.map(e=>e.id)),CK=chw?S.ck.filter(c=>EP.some(e=>e.ck===c.id)):S.ck,ms=months(),chws=S.w.filter(x=>x.role==="chw"&&(!chw||x.id===chw));
  const open=EP.filter(e=>!e.end),closed=EP.filter(e=>e.end),done=closed.filter(e=>e.handoff.reason===ENDS[0]),B=S.b.filter(b=>b.ep&&epIds.has(b.ep));
  const yearAmt=sum(ms.map(m=>sum(monthBill(m,chw).map(o=>o.amt)))),lastFull=ms[ms.length-2]||ms[0],tl=timeSum(lastFull,chw),paidL=paidMin(lastFull)*chws.length;
  let h="<h1>"+(chw?"My results":"Reports")+"</h1><p class='muted'>Month "+(mIdx(TODAY)+1)+" of the program. Example data: every person is fictitious.</p>";
  h+='<div class="grid">'+(chw?"":stat("Referral checklists",CK.length))+stat("Episodes open now",open.length+" of "+chws.length*CFG.caseMax,"capacity at "+CFG.caseMax+" per CHW")+stat("Billable share, "+MON[+lastFull.slice(5,7)-1],pct(tl.count,paidL)+"%","floor "+CFG.util.floor+"%, planning figure "+CFG.util.plan+"%")+stat("Allowed amount to date",money0(yearAmt))+"</div>";
  if(!chw){const rc={};for(const c of CK)rc[c.route]=(rc[c.route]||0)+1;const nb=CK.filter(c=>!covOK(c.cov)).length;
    h+='<h2 class="rep">1. Referrals and routing</h2><div class="card"><div class="tblwrap"><table>'+barHead+Object.keys(ROUTE).map(k=>bar(ROUTE[k][0],rc[k]||0,CK.length)).join("")+bar("Coverage check not passed (not billable)",nb,CK.length,0,"Medicare Advantage not verified, or already served by another practice")+"</table></div><p class='small muted'>"+CK.length+" checklists completed at initiating visits. The checklist says that most flagged patients belong with a volunteer visitor.</p></div>";}
  const vis=done.map(visitsDone);
  h+='<h2 class="rep">'+(chw?"1":"2")+". Episodes</h2><div class='card'>"+tbl(["Measure","#Number"],[["Episodes started",EP.length],["Open now",open.length],["Open past day "+CFG.epDays+" with no handoff",open.filter(e=>epDay(e)>CFG.epDays).length],["Closed",closed.length],["Completed and handed off to a volunteer visitor",done.filter(e=>e.handoff.vol).length],["Closed early (moved, entered a facility, asked to stop, or died)",closed.length-done.length],["Average home visits in a completed episode (plan: "+CFG.visitDays.length+")",vis.length?mean(vis).toFixed(1):""]].map(r=>"<tr><td>"+r[0]+"</td><td class='n'>"+r[1]+"</td></tr>"))+"</div>";
  h+='<h2 class="rep">'+(chw?"2":"3")+". Billing and the billable share of CHW hours</h2><div class='card'>"+tbl(["Month","#Patients billed","#G0019","#G0022","#Allowed","#Countable hours","#Share of paid hours"],ms.map(m=>{const R=monthBill(m,chw).filter(o=>o.g19),t=timeSum(m,chw),sh=pct(t.count,paidMin(m)*chws.length);return"<tr><td>"+fmtYM(m)+(m===TODAY.slice(0,7)?' <span class="small muted">(in progress)</span>':"")+"</td><td class='n'>"+R.length+"</td><td class='n'>"+sum(R.map(o=>o.g19))+"</td><td class='n'>"+sum(R.map(o=>o.g22))+"</td><td class='n'>"+money(sum(R.map(o=>o.amt)))+"</td><td class='n'>"+hrs(t.count)+"</td><td class='n'>"+chip(sh+"%",sh>=CFG.util.plan?"good":sh>=CFG.util.floor?"warn":"bad")+"</td></tr>";}))
    +"<p class='small muted'>The share is countable hours divided by paid hours ("+CFG.paidHours+" a month for each CHW, set in Settings). Travel, supervision, training and time not tied to a barrier in the plan are not countable. The pitch deck plans on "+CFG.util.plan+"% and treats about "+CFG.util.floor+"% as the floor. In this example, a caseload of "+CFG.caseLow+" to "+CFG.caseMax+" patients with six home visits in 90 days does not reach the floor.</p></div>";
  const tAll={count:0,pend:0,other:0,travel:0,non:0};for(const m of ms){const t=timeSum(m,chw);for(const k in tAll)tAll[k]+=t[k];}const tt=sum(Object.values(tAll));
  h+='<div class="card"><h3>Where the logged hours went, program to date</h3><div class="tblwrap"><table>'+barHead+[["Countable: on a barrier in the plan","count"],["Waiting for a barrier review","pend"],["With a patient, not tied to a countable barrier","other"],["Travel to home visits","travel"],["Supervision, training and other work","non"]].map(r=>bar(r[0]+" (hours)",Math.round(tAll[r[1]]/60),Math.round(tt/60))).join("")+"</table></div></div>";
  const bk={};for(const b of B){const o=bk[b.key]=bk[b.key]||[0,0,0];o[0]++;if(b.res)o[1]++;if(b.src==="chw")o[2]++;}const later=B.filter(b=>b.src==="chw");
  h+='<h2 class="rep">'+(chw?"3":"4")+". Barriers in episode plans</h2><div class='card'>"+tbl(["Barrier","#Recorded","#Resolved","#%"],Object.entries(bk).sort((a,b)=>b[1][0]-a[1][0]).slice(0,12).map(([k,v])=>"<tr><td>"+esc(BAR[k].label)+"</td><td class='n'>"+v[0]+"</td><td class='n'>"+v[1]+"</td><td class='n'>"+pct(v[1],v[0])+"%</td></tr>").concat(["<tr><td><b>All barriers</b></td><td class='n'><b>"+B.length+"</b></td><td class='n'><b>"+B.filter(b=>b.res).length+"</b></td><td class='n'><b>"+pct(B.filter(b=>b.res).length,B.length)+"%</b></td></tr>"]))+"<p class='small'>"+later.length+" barriers were found by a CHW after the initiating visit: "+later.filter(b=>b.status==="approved").length+" added to the plan, "+later.filter(b=>b.status==="declined").length+" not added, "+later.filter(b=>b.status==="review").length+" waiting for review. The twelve most frequent barriers are shown.</p></div>";
  const AP=S.app.filter(a=>epIds.has(a.ep)),ak={};for(const a of AP){const o=ak[a.type]=ak[a.type]||[0,0,0];o[0]++;if(a.status!=="started")o[1]++;if(a.status==="approved")o[2]++;}
  h+='<h2 class="rep">'+(chw?"4":"5")+". Benefits applications and referrals</h2><div class='card'>"+tbl(["Program","#Started","#Submitted","#Approved"],Object.entries(ak).sort((a,b)=>b[1][0]-a[1][0]).map(([k,v])=>"<tr><td>"+esc(k)+"</td><td class='n'>"+v[0]+"</td><td class='n'>"+v[1]+"</td><td class='n'>"+v[2]+"</td></tr>").concat(["<tr><td><b>All</b></td><td class='n'><b>"+AP.length+"</b></td><td class='n'><b>"+AP.filter(a=>a.status!=="started").length+"</b></td><td class='n'><b>"+AP.filter(a=>a.status==="approved").length+"</b></td></tr>"]))+"</div>";
  const IT=S.item.filter(a=>epIds.has(a.ep)),ik={};for(const a of IT)ik[a.item]=(ik[a.item]||0)+1;
  h+='<h2 class="rep">'+(chw?"5":"6")+". Items delivered</h2><div class='card'>"+tbl(["Item","#Number"],Object.entries(ik).sort((a,b)=>b[1]-a[1]).map(([k,v])=>"<tr><td>"+esc(k)+"</td><td class='n'>"+v+"</td></tr>"))+"</div>";
  const A=[...new Set(EP.map(e=>e.p))].map(id=>IX.p[id]).filter(p=>p.bp.length>=2),below=A.filter(p=>{const l=p.bp[p.bp.length-1];return l.s<140&&l.di<90;});
  h+='<h2 class="rep">'+(chw?"6":"7")+". Blood pressure in episode patients with hypertension</h2><div class='card'><div class='tblwrap'><table>"+barHead+bar("Latest home reading below 140/90",below.length,A.length,0,"Patients with condition A and two or more home readings")+"</table></div>"+tbl(["Measure","#Value"],[["Average upper reading at the first home visit",A.length?mean(A.map(p=>p.bp[0].s)).toFixed(1):""],["Average upper reading at the latest home visit",A.length?mean(A.map(p=>p.bp[p.bp.length-1].s)).toFixed(1):""]].map(r=>"<tr><td>"+r[0]+"</td><td class='n'>"+r[1]+"</td></tr>"))+"<p class='small muted'>Home readings taken by the CHW. A first high reading tends to be lower when repeated, so part of any fall is not an effect of the program. The clinic's own readings are the measure for quality reporting.</p></div>";
  if(!chw){const fk={};for(const f of S.flag){const o=fk[f.type]=fk[f.type]||[0,0];o[0]++;if(f.status==="done")o[1]++;}
    h+='<h2 class="rep">8. Flags passed up by volunteer visitors</h2><div class="card">'+tbl(["Flag","Goes to","#Raised","#Closed","#Open"],Object.entries(fk).sort((a,b)=>b[1][0]-a[1][0]).map(([k,v])=>"<tr><td>"+esc(FLAGS[k][0])+"</td><td>"+(FLAGS[k][1]==="clinic"?"Clinic":"Coordinator")+"</td><td class='n'>"+v[0]+"</td><td class='n'>"+v[1]+"</td><td class='n'>"+(v[0]-v[1])+"</td></tr>"))+"<p class='small muted'>The volunteer and coordinator screens, visit coverage, quality checklists and the comparison of Care Groups arrive in the next builds.</p></div>";}
  return h;}

/* ---------- administrator ---------- */
function vWorkers(){const g=r=>S.w.filter(w=>w.role===r);
  return"<h1>Workers</h1>"+'<div class="card">'+tbl(["Role","Name","Work now"],g("clinic").map(w=>"<tr><td>Clinic (billing practitioner)</td><td>"+esc(w.name)+"</td><td>"+S.ck.filter(c=>c.by===w.id).length+" checklists</td></tr>").concat(g("chw").map(w=>"<tr><td>Community health worker</td><td>"+esc(w.name)+"</td><td>"+openOf(w.id).length+" of "+CFG.caseMax+" patients</td></tr>"),g("coord").map(w=>"<tr><td>Coordinator</td><td>"+esc(w.name)+"</td><td>3 Care Groups</td></tr>")))+"</div>"
    +'<div class="card"><h3>Volunteer visitors</h3>'+tbl(["Care Group","#Volunteers","#Elders visited"],[1,2,3].map(cg=>{const v=g("vol").filter(w=>w.cg===cg);return"<tr><td>Care Group "+cg+" ("+PLACES.filter(p=>p.cg===cg).map(p=>p.n).join(" and ")+", "+PLACES.find(p=>p.cg===cg).c+" County)</td><td class='n'>"+v.length+"</td><td class='n'>"+S.p.filter(p=>v.some(x=>x.id===p.vol)).length+"</td></tr>";}))+"<p class='small muted'>The coordinator and volunteer screens arrive in build 0.2. The communities are fictitious. Adding workers and sign-in names comes with the sign-in version.</p></div>";}
function vSettings(){const f=(label,path,hint)=>'<div class="minrow"><div class="grow"><b>'+esc(label)+"</b>"+(hint?'<div class="small muted">'+esc(hint)+"</div>":"")+'</div><input type="number" step="any" data-cfg="'+path+'" value="'+getPath(CFG,path)+'" style="width:110px"></div>';
  return"<h1>Settings</h1><p class='muted'>Changes apply at once and last until the page is closed. Build "+BUILD+".</p>"
    +'<div class="card"><h3>Medicare billing</h3>'+f("G0019 rate, dollars","rate.g19","First 60 minutes in a calendar month. 2026 national rate from the pitch deck; the calculator's default is $80.")+f("G0022 rate, dollars","rate.g22","Each further 30 minutes. The calculator's default is $45.")+f("Countable minutes needed before G0019 is billed","first","Confirm the threshold rule with the billing office.")+f("Minutes for each G0022 unit","add")+f("Share of the allowed amount paid by Medicare, %","medicare")+"</div>"
    +'<div class="card"><h3>CHW episodes</h3>'+f("Length of an episode, days","epDays")+f("Patients at one time: upper limit","caseMax")+f("Patients at one time: lower end of the usual range","caseLow")+f("Days with no contact before a call is due","callGap")+f("Paid hours per CHW per month","paidHours","The denominator of the billable share.")+f("Billable share: planning figure, %","util.plan")+f("Billable share: floor, %","util.floor")+"</div>"
    +'<div class="card"><h3>Blood pressure lines for the CHW (draft, for clinical review)</h3>'+f("Report to the clinic today: upper reading at or above","bp.report.0")+f("Report to the clinic today: lower reading at or above","bp.report.1")+f("Call the clinic now: upper reading at or above","bp.now.0")+f("Call the clinic now: lower reading at or above","bp.now.1")+"</div>"
    +'<div class="note">This is an example version. Every person is fictitious, nothing is saved, and nothing leaves this device. A version holding real patients would be subject to HIPAA and needs the clinic\'s compliance review first.</div>';}

/* ---------- frame ---------- */
function render(){const w=me(),y=window.scrollY,tabs=TABS[w.role];if(!tabs.some(t=>t[0]===UI.tab))UI.tab=tabs[0][0];
  $("#who").textContent=(w.role==="admin"?"Administrator":ROLE[w.role]+": "+w.name)+" · example data";
  $("#nav").innerHTML=tabs.map(t=>'<button class="tab'+(t[0]===UI.tab&&!UI.mode?" on":"")+'" data-tab="'+t[0]+'">'+t[1]+"</button>").join("");
  const V={todo:vTodo,newref:()=>{if(!UI.F||UI.F.t!=="ck")startCk("");return vCk();},patients:vPatients,billing:vBilling,reports:vReports,today:vToday,mine:vMine,time:vTime,workers:vWorkers,settings:vSettings};
  const M={person:vPerson,work:vWork,handoff:vHandoff};
  $("#app").innerHTML=(UI.mode?M[UI.mode]:V[UI.tab])();if(UI.keep){window.scrollTo(0,y);UI.keep=false;}else window.scrollTo(0,0);}
function roleSel(){const g=(r,l)=>'<optgroup label="'+l+'">'+S.w.filter(w=>w.role===r).map(w=>'<option value="'+w.id+'">'+esc(w.name)+"</option>").join("")+"</optgroup>";
  $("#role").innerHTML=g("clinic","Clinic")+g("chw","Community health workers")+g("admin","Administrator");$("#role").value=UI.who;}
function reset(){UI.mode=null;UI.F=null;UI.all=false;UI.q="";}
document.addEventListener("click",e=>{const t=e.target.closest("[data-tab],[data-pid],[data-act],[data-set],[data-tog]");if(!t||t.disabled)return;const d=t.dataset;
  if(d.set){const cur=getPath(UI.F,d.set);setPath(UI.F,d.set,cur===d.v?null:d.v);UI.keep=true;return render();}
  if(d.tog){let arr=getPath(UI.F,d.tog);if(!Array.isArray(arr)){arr=[];setPath(UI.F,d.tog,arr);}const i=arr.indexOf(d.v);if(i>=0)arr.splice(i,1);else arr.push(d.v);UI.keep=true;return render();}
  if(d.tab){reset();UI.tab=d.tab;return render();}
  if(d.pid){UI.back={tab:UI.tab};UI.pid=d.pid;UI.F=null;UI.all=false;UI.mode="person";return render();}
  const A=d.act;
  if(A==="back"){reset();return render();}
  if(A==="cancel"){const t=UI.F&&UI.F.t;UI.F=null;UI.all=false;if(t==="ck"){UI.mode=null;UI.tab="todo";}else UI.mode="person";return render();}
  if(A==="all"){UI.all=true;UI.keep=true;return render();}
  if(A==="startck"){reset();startCk(d.id);UI.tab="newref";return render();}
  if(A==="saveck")return saveCk();
  if(A==="work"){startWork(d.id);return render();}
  if(A==="savework")return saveWork();
  if(A==="handoff"){startHandoff(d.id);return render();}
  if(A==="savehandoff")return saveHandoff();
  if(A==="csv")return csv();
  if(A==="ack"){const a=IX.a[d.id];a.safeAck=TODAY;a.safeBy=UI.who;UI.note=["Recorded. "+IX.w[a.chw].name+" can see that you have acted."];UI.keep=true;return render();}
  if(A==="review"){const b=IX.b[d.id];b.status=d.v;b.rev=TODAY;b.revBy=UI.who;const m=sum(S.t.filter(r=>r.b===b.id).map(r=>r.min));UI.note=[d.v==="approved"?"Added to the plan. The "+m+" minutes logged against it now count.":"Not added. The "+m+" minutes logged against it stay uncounted."];UI.keep=true;return render();}
  if(A==="flagdone"){const f=S.flag.find(x=>x.id===d.id),v=$("#fa_"+d.id).value;if(!v){UI.note=["Choose the action taken before recording it.","warn"];UI.keep=true;return render();}f.status="done";f.done=TODAY;f.act=v;UI.note=["Recorded: "+v+"."];UI.keep=true;return render();}
  if(A==="addtime"){const F=UI.F;if(!F.kind||!(+F.min>0)||!F.d||F.d>TODAY){F.tried=true;UI.keep=true;return render();}S.t.push({id:uid("t"),chw:UI.who,d:F.d,p:null,kind:F.kind,min:Math.round(+F.min)});UI.note=[Math.round(+F.min)+" minutes of "+F.kind.toLowerCase()+" added."];UI.F=null;UI.ym=F.d.slice(0,7);return render();}});
document.addEventListener("input",e=>{const el=e.target,d=el.dataset;if(el.type==="checkbox")return;
  if(d.n&&UI.F){setPath(UI.F,d.n,el.value);if(d.live){const t=$("#tot");if(t)t.innerHTML=totHtml(UI.F);const b=$("#bpn");if(b)b.innerHTML=bpNote(UI.F);}return;}
  if(d.cfg){const v=+el.value;if(el.value!==""&&v>=0)setPath(CFG,d.cfg,v);return;}
  if(el.id==="q"){UI.q=el.value;UI.all=false;UI.keep=true;render();const n=$("#q");n.focus();n.setSelectionRange(n.value.length,n.value.length);}});
document.addEventListener("change",e=>{const el=e.target,d=el.dataset;
  if(d.c&&UI.F){const [path,v]=d.c.split(".");const arr=UI.F[path],val=path==="obs"?v:+v,i=arr.indexOf(val);if(el.checked&&i<0)arr.push(val);if(!el.checked&&i>=0)arr.splice(i,1);UI.keep=true;return render();}
  if(d.sel&&UI.F){setPath(UI.F,d.sel,el.value);UI.keep=true;return render();}
  if(el.id==="role"){UI.who=el.value;UI.tab=null;reset();UI.ym=TODAY.slice(0,7);return render();}
  if(el.id==="ym"){UI.ym=el.value;UI.keep=true;return render();}
  if(el.id==="pf"){UI.pf=el.value;UI.all=false;UI.keep=true;return render();}});
build();roleSel();render();
try{if("serviceWorker" in navigator&&location.hostname.endsWith("github.io"))navigator.serviceWorker.register("sw.js").catch(()=>{});}catch(e){}
