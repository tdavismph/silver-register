// Opens every screen for every role at three widths, then runs the main flows. Usage: node test/run.js
const {chromium}=require(process.env.PW||"playwright");const path=require("path");
(async()=>{const b=await chromium.launch();let bad=0;const fail=m=>{bad++;console.log("FAIL",m)};
  const url="file://"+path.resolve(__dirname,"../index.html");
  for(const w of [390,820,1100]){const pg=await b.newPage({viewport:{width:w,height:900}});pg.on("pageerror",e=>fail(w+" pageerror "+e.message));pg.on("console",m=>{if(m.type()==="error"&&!/fonts|net::/.test(m.text()))fail(w+" console "+m.text())});
    await pg.goto(url);
    const check=async where=>{const r=await pg.evaluate(()=>{const W=window.innerWidth,out=[];if(document.documentElement.scrollWidth>W+1)out.push("page wider than screen: "+document.documentElement.scrollWidth);
        for(const el of document.querySelectorAll("button,select,input,.chip,h1,h2,td,th")){const r=el.getBoundingClientRect();if(!r.width)continue;const inScroll=el.closest(".tblwrap,nav");if(!inScroll&&(r.right>W+1||r.left<-1))out.push(el.tagName+" cut off: "+(el.textContent||el.value||"").slice(0,40));}
        if(/undefined|NaN|\[object/.test(document.querySelector("#app").innerText))out.push("bad text: "+document.querySelector("#app").innerText.match(/.{0,40}(undefined|NaN|\[object).{0,30}/)[0]);return out;});
      for(const x of r)fail(w+" "+where+": "+x);};
    for(const who of ["pa1","chw1","chw2","adm"]){await pg.selectOption("#role",who);const tabs=await pg.$$eval("#nav button",a=>a.map(x=>x.dataset.tab));
      for(const t of tabs){await pg.click('#nav [data-tab="'+t+'"]');await check(who+"/"+t);
        const link=await pg.$("#app [data-pid]");if(link){await link.click();await check(who+"/"+t+"/person");const all=await pg.$('#app [data-act="all"]');if(all){await all.click();await check(who+"/"+t+"/person/all");}await pg.click('[data-act="back"]');}}}
    // flow 1: the PA completes a checklist and routes to a CHW episode
    await pg.selectOption("#role","pa1");await pg.click('[data-tab="newref"]');await pg.click('[data-act="saveck"]');await check("ck/empty-tried");
    const before=await pg.evaluate(()=>[S.ep.length,S.b.length,S.ck.length]);
    await pg.selectOption('[data-sel="pid"]',"new");await pg.fill('[data-n="nw.name"]',"Test Person");await pg.fill('[data-n="nw.mrn"]',"HR000001");await pg.fill('[data-n="nw.dob"]',"1948-03-02");
    await pg.click('[data-set="vt"][data-v="E/M"]');await pg.click('[data-set="cov.partB"][data-v="y"]');await pg.click('[data-set="cov.notElse"][data-v="y"]');await pg.click('[data-set="cov.path"][data-v="dual"]');
    await pg.click('[data-tog="cond"][data-v="A"]');await pg.click('[data-tog="cond"][data-v="D"]');
    for(const k of await pg.$$eval('[data-set^="core."][data-v="n"]',a=>a.map(x=>x.dataset.set)))await pg.click('[data-set="'+k+'"][data-v="n"]');
    for(const k of await pg.$$eval('[data-set^="blk."][data-v="n"]',a=>a.map(x=>x.dataset.set)))await pg.click('[data-set="'+k+'"][data-v="n"]');
    await check("ck/filled");
    for(const k of await pg.$$eval('[data-tog^="links."][data-v="A"]',a=>a.map(x=>x.dataset.tog)))await pg.click('[data-tog="'+k+'"][data-v="A"]');
    await pg.check('[data-c="obs.o_see"]');await pg.click('[data-tog="links.o_see"][data-v="D"]');await pg.check('[data-c="trig.1"]');
    await pg.click('[data-set="route"][data-v="chw"]');for(let i=0;i<5;i++)await pg.check('[data-c="sign.'+i+'"]');await check("ck/ready");
    await pg.click('[data-act="saveck"]');const after=await pg.evaluate(()=>[S.ep.length,S.b.length,S.ck.length,document.querySelector("h1").textContent,S.ep[S.ep.length-1].chw,S.b.filter(b=>b.ep===S.ep[S.ep.length-1].id).map(b=>b.key+":"+b.links.join("")).join(" ")]);
    if(after[0]!==before[0]+1||after[2]!==before[2]+1||after[3]!=="Test Person")fail(w+" checklist save "+JSON.stringify([before,after]));else if(w===390)console.log("checklist ->",after.slice(4).join(" | "));await check("ck/saved-person");
    // flow 2: the CHW records a home visit for that patient
    const chw=after[4];await pg.selectOption("#role",chw);await pg.click('[data-tab="today"]');const first=await pg.evaluate(()=>[...document.querySelectorAll("#app .task h2")].map(x=>x.textContent).findIndex(t=>t.startsWith("Test Person")));if(first<0)fail(w+" new referral not on the CHW due list");
    await pg.click('[data-tab="mine"]');await pg.click('tr:has-text("Test Person") [data-act="work"]');await pg.click('[data-act="savework"]');await check("work/empty-tried");
    await pg.click('[data-set="kind"][data-v="Home visit"]');const mins=await pg.$$('[data-n^="min."]');await mins[0].fill("40");await mins[1].fill("25");await pg.fill('[data-n="travel"]',"35");await pg.fill('[data-n="other"]',"10");
    await pg.selectOption('[data-sel="newKey"]',"cost");await pg.click('[data-tog="newLink"][data-v="A"]');await pg.fill('[data-n="newMin"]',"15");await pg.fill('[data-n="s"]',"168");await pg.fill('[data-n="di"]',"94");
    await pg.click('[data-tog="items"][data-v="Blood pressure cuff"]');await pg.click('[data-tog="apps"][data-v="SNAP"]');await pg.click('[data-set="safety"][data-v="n"]');await check("work/filled");
    const tot=await pg.textContent("#tot");if(!/65 countable.*15 waiting.*10 not tied.*35 travel/.test(tot))fail(w+" live total: "+tot);
    await pg.click('[data-act="savework"]');const st=await pg.evaluate(()=>{const p=S.p.find(x=>x.name==="Test Person"),o=monthBill(TODAY.slice(0,7)).find(o=>o.p.id===p.id);return[o.count,o.pend,o.other,o.travel,o.g19,o.g22,+o.amt.toFixed(2)]});
    if(JSON.stringify(st)!=="[65,15,10,35,1,0,86.17]")fail(w+" billing after visit "+JSON.stringify(st));await check("work/saved-person");
    // flow 3: the PA adds the new barrier to the plan, so 80 minutes count: still G0019 only; then 10 more minutes makes 90 = one G0022
    await pg.selectOption("#role","pa1");await pg.click('.task:has-text("Test Person") [data-act="review"][data-v="approved"]');
    const st2=await pg.evaluate(()=>{const p=S.p.find(x=>x.name==="Test Person"),o=monthBill(TODAY.slice(0,7)).find(o=>o.p.id===p.id);return[o.count,o.pend,o.g19,o.g22]});if(JSON.stringify(st2)!=="[80,0,1,0]")fail(w+" after review "+JSON.stringify(st2));
    await pg.selectOption("#role",chw);await pg.click('[data-tab="mine"]');await pg.click('tr:has-text("Test Person") [data-act="work"]');await pg.click('[data-set="kind"][data-v="Call or paperwork for the patient"]');await (await pg.$$('[data-n^="min."]'))[0].fill("10");await pg.click('[data-set="appst.'+await pg.evaluate(()=>S.app[S.app.length-1].id)+'"][data-v="submitted"]');await pg.click('[data-act="savework"]');
    const st3=await pg.evaluate(()=>{const p=S.p.find(x=>x.name==="Test Person"),o=monthBill(TODAY.slice(0,7)).find(o=>o.p.id===p.id);return[o.count,o.g19,o.g22,+o.amt.toFixed(2),S.app[S.app.length-1].status]});if(JSON.stringify(st3)!=='[90,1,1,117.9,"submitted"]')fail(w+" after call "+JSON.stringify(st3));
    // flow 4: time not tied to a patient, then handoff
    await pg.click('[data-tab="time"]');await pg.click('[data-act="addtime"]');await check("time/tried");await pg.click('[data-set="kind"][data-v="Training"]');await pg.fill('[data-n="min"]',"120");await pg.click('[data-act="addtime"]');await check("time/added");
    await pg.click('[data-tab="mine"]');await pg.click('tr:has-text("Test Person") [data-pid]');await pg.click('[data-act="handoff"]');await pg.click('[data-act="savehandoff"]');await check("handoff/tried");await pg.click('[data-set="reason"][data-v="Episode completed"]');await check("handoff/filled");await pg.click('[data-act="savehandoff"]');
    if(!await pg.evaluate(()=>{const p=S.p.find(x=>x.name==="Test Person");return !!lastEp(p.id).end}))fail(w+" handoff did not close");await check("handoff/saved");
    // flow 5: flags, safety, CSV, settings
    await pg.selectOption("#role","pa1");const ack=await pg.$('[data-act="ack"]');if(ack){await ack.click();await check("todo/ack");}
    const fd=await pg.$('[data-act="flagdone"]');if(fd){await fd.click();await check("todo/flag-noaction");const id=await pg.evaluate(()=>document.querySelector('[data-act="flagdone"]').dataset.id);await pg.selectOption("#fa_"+id,"Called the patient");await pg.click('[data-act="flagdone"][data-id="'+id+'"]');}
    await pg.click('[data-tab="billing"]');const [dl]=await Promise.all([pg.waitForEvent("download"),pg.click('[data-act="csv"]')]);if(w===390){const p=await dl.path();console.log("csv lines:",require("fs").readFileSync(p,"utf8").split("\r\n").length);}
    await pg.selectOption("#ym",await pg.evaluate(()=>months()[3]));await check("billing/older");
    await pg.click('[data-tab="patients"]');for(const v of ["ep","vol","cl","no","all"]){await pg.selectOption("#pf",v);await check("patients/"+v);}await pg.fill("#q","buch");await check("patients/search");
    await pg.selectOption("#role","adm");await pg.click('[data-tab="settings"]');await pg.fill('[data-cfg="rate.g19"]',"80");await pg.click('[data-tab="billing"]');await check("adm/billing-after-setting");
    if(w===820)await pg.screenshot({path:"/tmp/s820.png"});
    await pg.close();}
  await b.close();console.log(bad?bad+" problems":"all checks passed");process.exit(bad?1:0);})();
