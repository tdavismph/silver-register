"use strict";
/* SILVER Register: home visit register for the SILVER program (healthy aging through home visitation, Appalachian High Country).
   Example mode only in this build: every person is fictitious, and nothing is stored or sent. */
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const TODAY=iso(new Date());
const dn=s=>Math.round(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5);
const addD=(s,n)=>{const d=new Date(Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))+Math.round(n)*864e5);return d.toISOString().slice(0,10)};
const diff=(a,b)=>dn(a)-dn(b);
const pct=(n,d)=>d?Math.round(100*n/d):null;
const cmp=(a,b)=>a<b?-1:a>b?1:0;   // returns 0 for ties, so every browser sorts the same way
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const sum=a=>a.reduce((x,y)=>x+y,0);
const MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONL=["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmtD=s=>s?MON[+s.slice(5,7)-1]+" "+(+s.slice(8,10))+", "+s.slice(0,4):"";
const fmtYM=ym=>MONL[+ym.slice(5,7)-1]+" "+ym.slice(0,4);
const money=n=>"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const hrs=m=>(m/60).toFixed(1);
const money0=n=>"$"+Math.round(n).toLocaleString("en-US");
const monthEnd=ym=>{const y=+ym.slice(0,4),m=+ym.slice(5,7);return ym+"-"+String(new Date(Date.UTC(y,m,0)).getUTCDate()).padStart(2,"0")};
let SEQ=0;const uid=p=>p+(++SEQ);
const BUILD="0.2.9";

/* ---------- settings (all editable by the administrator) ---------- */
const CFG={
  practice:"High Ridge Community Health Center (fictitious)",
  start:addD(TODAY,-236),            // the example program is in its 8th month
  // Medicare Community Health Integration (CHI). 2026 national rates before geographic adjustment, as given in the SILVER pitch deck. Confirm with the billing office.
  rate:{g19:86.17,g22:31.73},
  first:60,                          // minutes of countable time in a calendar month before G0019 can be billed
  add:30,                            // minutes for each unit of G0022
  medicare:80,                       // % of the allowed amount paid by Medicare
  epDays:90,                         // length of a CHW episode
  visitDays:[4,15,29,46,66,84],      // day of the episode on which each of the six home visits is due
  callGap:10,                        // days without any contact before a call is due
  caseMax:15,caseLow:12,             // patients at one time per full-time CHW (Connected Care benchmark)
  paidHours:150,                     // paid hours per CHW per month, for the billable share
  util:{plan:60,floor:55},
  // What one full-time CHW costs the organization that employs the CHWs, per year. Defaults are the SILVER Project Calculator's.
  // The billing practitioner's time is not included: that cost sits with the clinic.
  cost:{salary:55000,miles:6000,superv:0,overhead:12},
  collect:80,                        // % of the allowed amount expected to be collected. 80 = Medicare's payment alone, with no coinsurance.           // % of paid hours that are billable: planning figure and floor (pitch deck)
  // Draft lines for the CHW's blood pressure check. For clinical review before any real use.
  bp:{report:[140,90],now:[180,120]},
  noRepeat:30                        // days: no new routine flag for a person seen at the clinic this recently (used from build 0.2)
};
const mIdx=d=>Math.floor(diff(d,CFG.start)/30.4375);

/* ---------- the referral checklist (SILVER Home-Visit Referral Checklist, version 4) ---------- */
const COND={
 A:["Hypertension","I10","Newly diagnosed, uncontrolled at the last two readings, or medication changed within 90 days"],
 B:["Type 2 diabetes or prediabetes","E11.– / R73.03","Including any insulin use"],
 C:["Heart failure or COPD","I50.– / J44.–","Or taking a diuretic or beta-blocker"],
 D:["Falls or unsteady gait","R26.– / M81 / Z91.81","Including osteoporosis or a prior fragility fracture"],
 E:["Depression or anxiety","F32.– / F41.–","Or a PHQ-2 score of 3 or more"],
 F:["Malnutrition or unintentional weight loss","E44.– / R63.4 / R63.6",""],
 G:["Five or more prescriptions","Z79.–","Or known non-adherence"],
 H:["Hospital or emergency department discharge","","Within the past 30 days"],
 O:["Other condition","",""]};
// key, short name of the barrier, question, the answer that is flagged, what the CHW may do, code, condition block, "does not apply" allowed
const QS=[
 ["cost","Cost keeps the patient from taking medicines as prescribed","In the past 12 months, have you skipped a dose, split a pill, or put off a refill because of what it costs?","y","Pharmacy assistance, Extra Help and Medicare Savings Program applications, generic review","Z91.120"],
 ["ride","No reliable way to get to appointments","Do you have a reliable way to get to your appointments here?","n","Transit eligibility, ride ministry, appointment clustering","Z59.82"],
 ["food1","Worried that food would run out","In the past 12 months, have you worried your food would run out before you had money to buy more?","y","Food box, SNAP application, pantry linkage","Z59.41"],
 ["food2","Food ran out","In the past 12 months, did the food you bought run out before you had money to buy more?","y","Food box, SNAP application, pantry linkage","Z59.41"],
 ["warm","Home not warm enough in winter","Last winter, were you able to keep your home warm enough?","n","LIHEAP application, weatherization referral, heating safety check","Z59.1–"],
 ["cool","Home not cool enough in summer","Last summer, were you able to keep your home cool enough?","n","Cooling assistance, fan and AC referral","Z59.1–"],
 ["talk","No one to talk with on most days","In a usual week, is there someone you talk with most days?","n","Volunteer pairing, phone contact, reconnection to a group","Z60.2"],
 ["prem","No help with Medicare premiums or drug costs","Are you getting any help with your Medicare premiums or drug costs?","n","SHIIP referral, Extra Help and MSP applications","Z59.7"],
 ["pills","No system that keeps the medicines straight","Do you have a system that keeps your medicines straight?","n","Pill organizer, written schedule, weekly check","Z91.14"],
 ["A1","No working blood pressure cuff at home","Do you have a blood pressure cuff at home that works?","n","Deliver cuff, set up wall log, report readings to clinic","I10","A"],
 ["A2","Cannot use the cuff without help","Are you able to use it, or is there someone who can help you?","n","Teach technique, take and record readings at each visit","I10","A"],
 ["B1","No reliable way to keep insulin cold","If you use insulin: do you have a reliable way to keep it cold?","n","Utility assistance, appliance referral, storage workaround","Z59.1–","B",1],
 ["B2","Cannot check own blood sugar","Are you able to check your own blood sugar?","n","Meter teaching, supervised checks, escalate readings; MDPP referral if prediabetic","E11","B"],
 ["B3","Cannot see or reach the bottoms of the feet","Are you able to see and reach the bottoms of your feet?","n","Visual foot checks each visit, escalate findings same day","E11","B"],
 ["C1","No working scales for daily weight","If you are meant to weigh yourself daily, do you have working scales?","n","Provide scales, teach daily weight log, escalate gains","I50","C",1],
 ["D1","Loose rugs, dark stairways or worrying outside steps","Are there loose rugs, dark stairways or outside steps that worry you?","y","Hazard removal, night lighting, volunteer work crew","Z59.1–","D"],
 ["D2","Cannot manage the cost of a grab bar or handrail","If a grab bar or handrail would help, could you manage the cost?","n","Equipment sourcing, volunteer installation crew","Z59.86","D",1],
 ["D3","Nothing regular for strength or balance","Are you doing anything regular for strength or balance?","n","Enroll in a balance class or walking group; arrange transport","R26","D"],
 ["E1","Lost a spouse or a helper in the past two years","In the past two years, have you lost a spouse, or someone who helped look after you?","y","Grief support linkage, caregiving gap assessment","Z63.4","E"],
 ["E2","Mood medicine not taken as prescribed","Are you taking the medicine for your mood as it was prescribed?","n","Adherence support, cost assistance, clinic feedback","Z91.14","E",1],
 ["F1","Cannot get to a store to shop","Are you able to get to a store and do your own shopping?","n","Shopping help, delivery setup, volunteer accompaniment","Z59.1–","F"],
 ["F2","No working stove or refrigerator","Do you have a working stove and refrigerator?","n","Appliance referral, home-delivered meals","Z59.1–","F"],
 ["F3","Not receiving SNAP or delivered meals","Are you receiving SNAP or delivered meals?","n","Complete SNAP and meal-program applications","Z59.7","F"],
 ["F4","Teeth or dentures prevent normal eating","Do your teeth or dentures let you eat normally?","n","Dental referral, texture guidance, transport","R63.4","F"],
 ["G1","Cannot read the labels on the bottles","Can you read the labels on your bottles?","n","Large-print relabeling, pharmacy request, teaching","Z91.14","G"],
 ["H1","Discharge instructions were not clear","Was everything in the discharge instructions clear to you?","n","Walk through instructions at home, escalate questions","Z91.14","H"],
 ["H2","New medicines were not clear","Was everything about the new medicines clear?","n","Reconcile bottles at home, escalate discrepancies same day","Z91.14","H"],
 ["H3","Something at home played a part in the admission","Was there anything at home (the cold, no food, a fall) that played a part in you going in?","y","Address the specific hazard, cold, or food gap identified","Z59.1–","H"]];
// Step 5b: barriers the practitioner can document without asking
const OBS=[
 ["o_refill","Late or missed refills on the pharmacy record","Z91.14"],
 ["o_appt","Two or more missed or cancelled appointments in the past 12 months","Z59.82"],
 ["o_ride","Arrived without a ride, or the person who drove them is no longer available","Z59.82"],
 ["o_cold","Underdressed for the weather, or describes the house as unheated","Z59.1–"],
 ["o_meds","Cannot name their medicines and did not bring a list or the bottles","Z91.14"],
 ["o_care","Caregiver or family reports they can no longer manage the care","Z74.2"],
 ["o_home","Home described as cluttered, unlit, or unsafe underfoot","Z59.1–"],
 ["o_hear","Could not follow conversation in the exam room, or asked for repetition throughout","H91.9"],
 ["o_see","Squinting, holding papers close, or reports not reading mail or pill bottles","H54.7"]];
// Step 5a: clinical triggers (reasons to run the checklist; not barriers)
const TRIG=[
 ["A1c at or above 9.0%, or no A1c in the past 12 months","B"],
 ["Blood pressure at or above 140/90 at the last two visits, or no reading in 12 months","A"],
 ["LDL above goal with a statin on the medication list","A, G"],
 ["eGFR falling, or new albuminuria","B"],
 ["Weight loss of 5% or more in the past 6 months","F"],
 ["PHQ-9 of 10 or above with no treatment started","E"],
 ["Two or more ED visits, or any admission, in the past 12 months","H"],
 ["Vaccination gaps on the state registry","attach to A, B or C"],
 ["No colorectal cancer screening on record, age 45 to 75","attach to an active condition"],
 ["Newly started insulin, anticoagulant, or an inhaler needing technique","B, C, G"]];
const BAR={};
for(const a of QS)BAR[a[0]]={k:a[0],label:a[1],q:a[2],flag:a[3],may:a[4],code:a[5],cond:a[6]||null,na:!!a[7]};
for(const a of OBS)BAR[a[0]]={k:a[0],label:a[1],code:a[2],may:"",obs:true,cond:null};
const CORE=QS.filter(a=>!a[6]).map(a=>BAR[a[0]]);
const BLOCK={};for(const a of QS)if(a[6])(BLOCK[a[6]]=BLOCK[a[6]]||[]).push(BAR[a[0]]);
const ROUTE={chw:["CHW episode (Tier 2)","About 90 days. For a patient who is medically frail, or has had a hospitalization, emergency visit or fall in the past 90 days, or whose barriers obstruct treatment now."],
 vol:["Volunteer visitor and resource referral (Tier 1)","The flags are real but the patient is stable. A trained volunteer visits monthly and the office sends the applications. Not billable. Most flagged patients belong here."],
 both:["Both","A CHW episode now, with the volunteer visitor continuing after the handoff."],
 clinic:["Clinic action only","Pharmacist review, medication reconciliation or a scheduled follow-up resolves this without a home visit."]};
const PATHS={dual:"Dual-eligible or QMB",slide:"Sliding-fee discount",pays:"Patient pays about $18 to $30 a month"};
const SIGN=["Every flagged answer and ticked barrier is in my assessment and plan with its code, linked to a condition from Step 2.",
 "I have explained the service to the patient and obtained consent.",
 "The patient has been told a 20% coinsurance applies (or is covered or discounted in their case), and that only one practitioner per month may bill for it.",
 "Consent is documented in the chart.",
 "Referral sent to the CHW team with this form attached."];
const VT=["E/M","Annual Wellness Visit","TCM"];

/* ---------- CHW work ---------- */
const KINDS=["Home visit","Phone call with the patient","Call or paperwork for the patient"];
const NONPT=["Supervision","Training","Travel not tied to one patient","Other work"];
const ITEMS=["Blood pressure cuff","Wall log for readings","Pill organizer","Scales","Night lights or non-slip strips","Fan","Food box","Large-print medicine labels","Hearing aids (over the counter)"];
const APPS=["SNAP","Extra Help (Part D)","Medicare Savings Program","LIHEAP (heating or cooling)","Weatherization","Operation Fan Heat Relief","Home-delivered meals","County transit eligibility","Homestead exclusion","SHIIP referral","QuitlineNC referral","Medicare Diabetes Prevention Program","Balance class enrollment","Pharmacy assistance"];
const APPMAP={cost:["Extra Help (Part D)","Pharmacy assistance"],ride:["County transit eligibility"],food1:["SNAP"],food2:["SNAP"],warm:["LIHEAP (heating or cooling)","Weatherization"],cool:["Operation Fan Heat Relief"],prem:["Medicare Savings Program","SHIIP referral"],D3:["Balance class enrollment"],F3:["SNAP","Home-delivered meals"],F2:["Home-delivered meals"],B2:["Medicare Diabetes Prevention Program"],o_ride:["County transit eligibility"],o_cold:["LIHEAP (heating or cooling)"]};
const ITEMMAP={A1:["Blood pressure cuff","Wall log for readings"],pills:["Pill organizer"],C1:["Scales"],cool:["Fan"],food2:["Food box"],G1:["Large-print medicine labels"],D1:["Night lights or non-slip strips"],o_hear:["Hearing aids (over the counter)"],o_meds:["Pill organizer"]};
const ENDS=["Episode completed","Moved out of the area","Entered a nursing facility","Patient asked to stop","Died"];
const FLAGS={bp:["Blood pressure above the line on the card at two visits in a row","clinic"],mood:["Mood questions: answer above the line on the card","clinic"],fall:["A fall since the last visit","clinic"],meds:["Medicines ran out or were not refilled","clinic"],
 food:["Food questions: a yes answer","coord"],home:["Home safety checklist: a hazard seen","coord"],temp:["Home too cold or too hot","coord"],mail:["Unopened mail or a shutoff notice","coord"]};

/* ---------- data ---------- */
const S={w:[],p:[],ck:[],b:[],ep:[],a:[],t:[],app:[],item:[],flag:[]};
const IX={};
function index(){for(const k of["w","p","ck","b","ep","a"])IX[k]=Object.fromEntries(S[k].map(x=>[x.id,x]));}
const eps=pid=>S.ep.filter(e=>e.p===pid);
const openEp=pid=>S.ep.find(e=>e.p===pid&&!e.end)||null;
const lastEp=pid=>{const a=eps(pid);return a[a.length-1]||null};
const lastCk=pid=>{const a=S.ck.filter(c=>c.p===pid);return a[a.length-1]||null};
const epDay=e=>diff(TODAY,e.start);
const openOf=chw=>S.ep.filter(e=>e.chw===chw&&!e.end);
const barsOf=pid=>S.b.filter(b=>b.p===pid);
const liveBars=pid=>barsOf(pid).filter(b=>!b.res&&b.status!=="declined");
const covOK=c=>c.partB==="y"&&c.notElse==="y"&&!!c.path&&c.path!=="none";
const billableEp=e=>{const c=IX.ck[e.ck];return !!c&&covOK(c.cov)&&c.signed;};
const epAt=(pid,ym)=>eps(pid).filter(e=>e.start.slice(0,7)<=ym&&(!e.end||e.end.slice(0,7)>=ym)).pop()||lastEp(pid);
const condTxt=(c,L)=>L==="O"?"Other: "+(c.other||""):COND[L][0];
/* Whether a row of logged time counts toward billing.
   count: tied to a barrier in the plan. pend: tied to a barrier the practitioner has not yet reviewed. other: with the patient, not tied to a countable barrier. */
function rowState(r){if(!r.p)return"non";if(r.kind==="Travel")return"travel";if(!r.b)return"other";const s=IX.b[r.b].status;return s==="review"?"pend":s==="declined"?"other":"count";}
function units(min){const g19=min>=CFG.first?1:0,g22=g19?Math.floor((min-CFG.first)/CFG.add):0;return{g19,g22,amt:g19*CFG.rate.g19+g22*CFG.rate.g22};}
/* One line per patient for a calendar month (ym = "2026-11"). */
function monthBill(ym,chw){const m={};
  for(const r of S.t){if(!r.p||r.d.slice(0,7)!==ym||(chw&&r.chw!==chw))continue;
    const o=m[r.p]=m[r.p]||{p:IX.p[r.p],count:0,pend:0,other:0,travel:0,dates:new Set(),codes:new Set()},st=rowState(r);o[st]+=r.min;
    if(st==="count"){o.dates.add(r.d);const b=IX.b[r.b];o.codes.add(BAR[b.key].code);}}
  return Object.values(m).map(o=>{o.ep=epAt(o.p.id,ym);o.ok=!!o.ep&&billableEp(o.ep);o.ck=o.ep?IX.ck[o.ep.ck]:null;Object.assign(o,o.ok?units(o.count):{g19:0,g22:0,amt:0});return o;})
    .sort((a,b)=>cmp(a.p.sort,b.p.sort));}
const months=()=>{const out=[];let y=+CFG.start.slice(0,4),m=+CFG.start.slice(5,7);const ty=+TODAY.slice(0,4),tm=+TODAY.slice(5,7);while(y<ty||(y===ty&&m<=tm)){out.push(y+"-"+String(m).padStart(2,"0"));m++;if(m>12){m=1;y++;}}return out;};
const visitsDone=e=>S.a.filter(a=>a.ep===e.id&&a.kind===KINDS[0]).length;
const lastContact=e=>{const a=S.a.filter(a=>a.ep===e.id).map(a=>a.d).sort();return a[a.length-1]||null};

/* ---------- example data (fictitious) ---------- */
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const PLACES=[{n:"Laurel Fork",c:"Yancey",cg:1},{n:"Cane Hollow",c:"Yancey",cg:1},{n:"Stony Gap",c:"Mitchell",cg:2},{n:"Buck Ridge",c:"Mitchell",cg:2},{n:"Piney Knob",c:"Avery",cg:3},{n:"Elk Shoals",c:"Avery",cg:3}];
function build(){
  const R=rng(20261121),N=(m,sd)=>{let u=0;for(let i=0;i<6;i++)u+=R();return m+sd*(u-3)*1.414},pick=a=>a[Math.floor(R()*a.length)],shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},ch=p=>R()<p,ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const FN=["Mary","Betty","Shirley","Wanda","Ruth","Doris","Brenda","Carolyn","Peggy","Linda","Glenda","Faye","Edna","Lois","Irene","Joyce","Martha","Nancy","Hazel","Opal","Ruby","Thelma","Patsy","Darlene"];
  const MN=["James","Robert","Billy","Harold","Clyde","Roy","Earl","Larry","Jerry","Dennis","Wayne","Gary","Ronnie","Carl","Ralph","Floyd","Lester","Howard","Kenneth","Dale","Vernon","Glenn","Donald","Charles"];
  const SN=["Buchanan","McKinney","Hughes","Presnell","Ledford","Hensley","Byrd","Wilson","Young","Ray","Robinson","Greene","Edwards","Tipton","Peterson","Burleson","Pittman","Honeycutt","Styles","Carpenter","Vance","Wiseman","Hicks","Phillips","Johnson","Boone","Riddle","Garland","Banks","Renfro","Shepherd"];
  S.w.push({id:"pa1",role:"clinic",name:"Nathan Davis, PA"},{id:"chw1",role:"chw",name:"Tasha Greer"},{id:"chw2",role:"chw",name:"Luke Hollifield"},{id:"adm",role:"admin",name:"Administrator"},{id:"co1",role:"coord",name:"Anne Mace, RN"});
  for(let i=1;i<=36;i++){const f=ch(.7);S.w.push({id:"v"+i,role:"vol",name:pick(f?FN:MN)+" "+pick(SN),cg:Math.ceil(i/12)});}
  let hn=0;
  for(const v of S.w.filter(w=>w.role==="vol")){const pl=PLACES.filter(x=>x.cg===v.cg);let k=0;
    while(k<8){hn++;const place=pick(pl),two=k<7&&ch(.42),sn=pick(SN);
      for(const j of two?[0,1]:[0]){const sex=two?(j?"M":"F"):(ch(.64)?"F":"M"),age=clamp(Math.round(65+Math.abs(N(9,8))),65,97),fn=pick(sex==="F"?FN:MN);
        S.p.push({id:"p"+(S.p.length+1),hh:"h"+hn,name:fn+" "+sn,sort:sn+" "+fn+S.p.length,sex,age,dob:addD(TODAY,-(age*365.25+ri(1,360))),mrn:"HR"+ri(100000,999999),place:place.n,county:place.c,vol:v.id,
          phone:"828-555-01"+String(ri(0,99)).padStart(2,"0"),bp:[],_s:N(152,12),_d:N(88,7)});k++;}}}
  index();
  // Referral checklists completed by the PA, in date order
  const pool=shuffle(S.p.slice()),plan=[];
  for(let m=0;m<=mIdx(TODAY);m++){const n=m===0?16:ri(27,32);for(let i=0;i<n;i++){const d=addD(CFG.start,m*30.4375+ri(0,29));if(d<=TODAY&&pool.length)plan.push({d,p:pool.pop()});}}
  plan.sort((a,b)=>cmp(a.d,b.d));
  const PR={cost:.24,ride:.2,food1:.17,food2:.1,warm:.2,cool:.13,talk:.22,prem:.3,pills:.18};
  const openAt=(c,d)=>S.ep.filter(e=>e.chw===c&&e.start<=d&&e._end>d).length;
  for(const {d,p} of plan){
    const cond=[];for(const [L,pr] of [["A",.6],["B",.3],["C",.2],["D",.26],["E",.2],["F",.1],["G",.36],["H",.13]])if(ch(pr))cond.push(L);if(!cond.length)cond.push("A");
    const cov={partB:ch(.87)?"y":"n",notElse:ch(.97)?"y":"n",path:(u=>u<.42?"dual":u<.8?"slide":"pays")(R())};
    const core={},blk={},links={},keys=[];
    for(const c of CORE){const f=ch(PR[c.k]);core[c.k]=f?c.flag:(c.flag==="y"?"n":"y");if(f)keys.push(c.k);}
    for(const L of cond)for(const b of BLOCK[L]||[]){if(b.na&&ch(.45)){blk[b.k]="na";continue;}const f=ch(.34);blk[b.k]=f?b.flag:(b.flag==="y"?"n":"y");if(f)keys.push(b.k);}
    const obs=OBS.filter(()=>ch(.07)).map(o=>o[0]);keys.push(...obs);
    for(const k of keys)links[k]=BAR[k].cond?[BAR[k].cond]:[pick(cond)];
    const trig=TRIG.map((t,i)=>i).filter(i=>ch(.13));
    const ok=covOK(cov),frail=cond.includes("H")||(cond.includes("D")&&ch(.5))||keys.length>=5;
    let route=!ok?"vol":frail&&keys.length?(ch(.3)?"both":"chw"):!keys.length?(ch(.6)?"clinic":"vol"):(u=>u<.72?"vol":u<.84?"clinic":"chw")(R());
    let chw=null;if(route==="chw"||route==="both"){chw=openAt("chw1",d)<=openAt("chw2",d)?"chw1":"chw2";if(openAt(chw,d)>=CFG.caseMax-(chw==="chw2"?1:0)){route="vol";chw=null;}}   // leaves one CHW place open in the example
    const ck={id:uid("k"),p:p.id,d,by:"pa1",vt:cond.includes("H")&&ch(.5)?"TCM":pick(["E/M","Annual Wellness Visit"]),cov,cond,core,blk,links,obs,trig,route,signed:!!chw};S.ck.push(ck);IX.ck[ck.id]=ck;
    const bs=keys.map(k=>{const b={id:uid("b"),p:p.id,ck:ck.id,key:k,links:links[k],src:"checklist",status:"plan",d,res:null};S.b.push(b);IX.b[b.id]=b;return b;});
    if(chw)episode(p,ck,chw,bs,cond);}
  function episode(p,ck,chw,bs,cond){
    const early=ch(.08),len=early?ri(20,70):ri(88,94),e={id:uid("e"),p:p.id,ck:ck.id,chw,start:ck.d,_end:addD(ck.d,len)};S.ep.push(e);IX.ep[e.id]=e;
    for(const b of bs)b.ep=e.id;
    const closing=e._end<=TODAY&&!(diff(TODAY,e._end)<=5&&ch(.6));const last=closing?e._end:TODAY;
    const ev=[];CFG.visitDays.forEach((o,i)=>ev.push([o+ri(-2,2),"v",i]));[9,22,36,52,60,74,80].forEach(o=>{if(ch(.9))ev.push([o+ri(-1,2),"c"]);});[5,12,20,26,33,40,48,58,70,78].forEach(o=>{if(ch(.85))ev.push([o+ri(-1,2),"w"]);});
    ev.sort((a,b)=>a[0]-b[0]);let stopped=false,nb=null,vis=0;
    const live=()=>S.b.filter(b=>b.ep===e.id&&!b.res&&b.status!=="declined");
    const row=(a,b,min,kind)=>S.t.push({id:uid("t"),a:a?a.id:null,chw,d:a.d,p:p.id,ep:e.id,kind:kind||a.kind,b:b?b.id:null,min});
    for(const [o,ty,i] of ev){const d=addD(e.start,o);if(d>last)break;
      if(ty==="v"){if(stopped||(!closing&&diff(TODAY,d)<9&&ch(.3))){stopped=true;continue;}
        const a={id:uid("a"),chw,d,p:p.id,ep:e.id,kind:KINDS[0],items:[],safety:"n",note:""};S.a.push(a);vis++;
        if(!nb&&vis>=2&&ch(.13)){const k=pick(CORE.filter(c=>!bs.some(b=>b.key===c.k)).map(c=>c.k));const old=diff(TODAY,d)>10;
          nb={id:uid("b"),p:p.id,ck:ck.id,ep:e.id,key:k,links:[pick(cond)],src:"chw",status:old?(ch(.9)?"approved":"declined"):"review",d,res:null,by:chw};if(old){nb.rev=addD(d,ri(2,8));nb.revBy="pa1";}S.b.push(nb);IX.b[nb.id]=nb;}
        const L=shuffle(live()).slice(0,ri(1,3)),tot=ri(95,135);
        if(L.length){const share=Math.round(tot/L.length/5)*5;for(const b of L){row(a,b,share);
          for(const it of ITEMMAP[b.key]||[])if(!S.item.some(x=>x.p===p.id&&x.item===it)&&ch(.8)){S.item.push({id:uid("i"),p:p.id,ep:e.id,d,item:it,by:chw});a.items.push(it);}
          if(vis>=2&&ch(vis>=4?.34:.16))b.res=d;}}
        else row(a,null,tot);
        if(ch(.3))row(a,null,ri(2,4)*5);
        row(a,null,ri(6,13)*5,"Travel");
        if(cond.includes("A")){const drop=Math.min(14,vis*3.2);const s=Math.round(p._s-drop+N(0,6)),di=Math.round(p._d-drop*.5+N(0,4));a.bp={s,di};p.bp.push({d,s,di,by:chw});}}
      else if(ty==="c"){const L=live();const a={id:uid("a"),chw,d,p:p.id,ep:e.id,kind:KINDS[1],items:[],safety:"n",note:""};S.a.push(a);row(a,L.length?pick(L):null,ri(3,6)*5);}
      else{const L=live(),withApp=L.filter(b=>APPMAP[b.key]),b=withApp.length&&ch(.75)?pick(withApp):(L.length?pick(L):null);const a={id:uid("a"),chw,d,p:p.id,ep:e.id,kind:KINDS[2],items:[],safety:"n",note:""};S.a.push(a);row(a,b,ri(6,12)*5);
        if(b&&APPMAP[b.key]){const type=pick(APPMAP[b.key]);let ap=S.app.find(x=>x.p===p.id&&x.type===type);
          if(!ap)S.app.push({id:uid("ap"),p:p.id,ep:e.id,b:b.id,type,d,status:"started"});
          else if(ap.status==="started"){ap.status="submitted";ap.sub=d;const dec=addD(d,ri(18,45));if(dec<=TODAY&&ch(.88)){ap.status=ch(.86)?"approved":"declined";ap.dec=dec;if(ap.status==="approved"&&!IX.b[ap.b].res&&ch(.7))IX.b[ap.b].res=dec;}}}}}
    if(closing){e.end=e._end;e.handoff={d:e._end,reason:early?pick(ENDS.slice(1)):ENDS[0],vol:early?null:p.vol,watch:live().slice(0,2).map(b=>b.id),note:""};
      if(!early)for(const b of S.b.filter(b=>b.ep===e.id&&!b.res))if(ch(.5))b.res=e._end;}}
  // Time not tied to one patient: weekly supervision and other work, monthly training
  for(const c of["chw1","chw2"]){for(let d=addD(CFG.start,3);d<=TODAY;d=addD(d,7)){S.t.push({id:uid("t"),chw:c,d,p:null,kind:NONPT[0],min:60});S.t.push({id:uid("t"),chw:c,d:addD(d,1)>TODAY?d:addD(d,1),p:null,kind:NONPT[3],min:ri(30,48)*5});}
    for(let d=addD(CFG.start,12);d<=TODAY;d=addD(d,30))S.t.push({id:uid("t"),chw:c,d,p:null,kind:NONPT[1],min:240});}
  // Two same-day safety escalations: one acknowledged, one waiting for the clinic
  const recent=S.a.filter(a=>a.kind===KINDS[0]&&!IX.ep[a.ep].end).sort((a,b)=>cmp(b.d,a.d));
  if(recent[0]){recent[0].safety="y";recent[0].safeNote="Said that life has not felt worth living since his wife died. No plan stated. Clinical supervisor called before leaving the home.";}
  const older=S.a.filter(a=>a.kind===KINDS[0]&&diff(TODAY,a.d)>40)[7];if(older){older.safety="y";older.safeNote="Space heater running beside an oxygen line. Moved it and called the supervisor.";older.safeAck=addD(older.d,0);older.safeBy="pa1";}
  // Monthly volunteer visits, the flags they pass up, handyman jobs and Care Group meetings (see vol.js)
  simVisits(R,N,pick,ch,ri);
  index();
}
