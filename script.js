// STEP 1: Data
// id,name,attendance,marks,assignments,study_hours,placement,skills,engagement,department  (null = not recorded)
const RAW=[
["G1001","Arun",92,89,88,null,91,85,90,"EEE"],
["G1002","Bala",68,61,52,null,48,55,40,"CSE"],
["G1003","Charan",86,82,75,null,58,72,70,"ECE"],
["G1004","Dinesh",73,74,62,null,45,61,55,"MECH"],
["G1005","Ezhil",95,91,94,null,89,92,93,"IT"],
["G1006","Fahad",89,78,80,null,35,76,65,"AIDS"],
["S1001","Student 1",69,69,29,8],["S1002","Student 2",44,91,55,7],["S1003","Student 3",79,35,62,5],
["S1004","Student 4",73,64,51,6],["S1007","Student 7",72,51,61,7],["S1010","Student 10",67,36,42,5],
["S1015","Student 15",52,57,35,4],["S1016","Student 16",40,55,31,3],["S1018","Student 18",93,48,60,6],
["S1021","Student 21",69,33,38,4],["S1024","Student 24",40,82,48,5],["S1026","Student 26",44,34,25,3],
["S1038","Student 38",45,41,30,3],["S1039","Student 39",59,31,35,4]];
const mk=a=>({id:a[0],name:a[1],attendance:a[2],marks:a[3],assignments:a[4],study_hours:a[5]??null,placement:a[6]??null,skills:a[7]??null,engagement:a[8]??null,department:a[9]??null});
let students=RAW.map(mk), chart=null;
const $=id=>document.getElementById(id), has=v=>v!==null&&v!==undefined;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=n=>Math.max(0,Math.min(100,n));

// STEP 2: Scoring (API risk formula + GrowthSpark success score)
function riskScore(s){return Math.round(clamp((100-s.attendance)*.35+(100-s.marks)*.35+(100-s.assignments)*.20+(has(s.study_hours)?Math.max(0,10-s.study_hours):0)))}
function factors(s){return[["Marks",s.marks,.30],["Attendance",s.attendance,.15],["Assignments",s.assignments,.15],["Placement",s.placement,.20],["Skills",s.skills,.10],["Engagement",s.engagement,.10]].filter(f=>has(f[1]))}
function success(s){const f=factors(s);return Math.round(f.reduce((a,x)=>a+x[1]*x[2],0)/f.reduce((a,x)=>a+x[2],0))}
function weakest(s){return factors(s).slice().sort((a,b)=>a[1]-b[1])[0][0]}
function risk(s){ // more severe of the API score and GrowthSpark rules
  const r=riskScore(s),c=success(s);
  if(r>=60||c<55||s.attendance<70)return"High";
  if(r>=35||c<70||(has(s.placement)&&s.placement<50))return"Medium";
  return"Low"}
function segment(s){
  if(success(s)>=80)return"High performer";
  if(s.marks>=75&&has(s.placement)&&s.placement<60)return"Placement gap";
  if(s.marks<70||s.attendance<70)return"Academic risk";
  return"Needs monitoring"}
function advice(s){
  const a=[];
  if(risk(s)==="High")a.push("Start faculty mentoring now and follow up on attendance.");
  if(s.attendance<75)a.push("Attend classes regularly and keep attendance above 75%.");
  if(s.assignments<60)a.push("Complete pending assignments with a weekly submission plan.");
  if(s.marks<50)a.push("Use extra learning resources and schedule subject-wise revision.");
  if(has(s.study_hours)&&s.study_hours<6)a.push("Raise focused study time to at least 6 hours a week.");
  if(has(s.placement)&&s.placement<60)a.push("Join aptitude training, coding practice and mock interviews.");
  if(has(s.engagement)&&s.engagement<60)a.push("Take part in hackathons, clubs and certifications.");
  if(!a.length)a.push("Keep the current routine and offer advanced learning opportunities.");
  return a}
const ord={High:0,Medium:1,Low:2};
const view=()=>students.filter(s=>!$("fd").value||s.department===$("fd").value);
const sorted=()=>view().sort((a,b)=>ord[risk(a)]-ord[risk(b)]||riskScore(b)-riskScore(a));
function say(t,k){const m=$("msg");m.textContent=t;m.className="msg "+(k||"")}

// STEP 3: Rendering the dashboard, table and detail popup
function render(){
  loadFilters();const students=view(); // department filter applies to the whole dashboard
  const n=students.length, avg=k=>n?Math.round(students.reduce((a,s)=>a+s[k],0)/n):"–";
  const cnt={High:0,Medium:0,Low:0}; students.forEach(s=>cnt[risk(s)]++);
  $("total").textContent=n;
  $("avg").textContent=n?Math.round(students.reduce((a,s)=>a+success(s),0)/n):"–";
  $("risk").textContent=cnt.High;
  $("att").textContent=n?avg("attendance")+"%":"–";
  $("mk").textContent=n?avg("marks")+"%":"–";
  const pl=students.filter(s=>has(s.placement));$("ready").textContent=pl.length?Math.round(pl.filter(s=>s.placement>=60).length/pl.length*100)+"%":"–";
  const sg={}; students.forEach(s=>{const g=segment(s);sg[g]=(sg[g]||0)+1});
  $("segs").innerHTML=["High performer","Placement gap","Academic risk","Needs monitoring"].map(g=>`<div class="seg"><span>${g}</span><b>${sg[g]||0}</b></div>`).join("");
  const al=sorted().filter(s=>risk(s)!=="Low").slice(0,4);
  $("alerts").innerHTML=al.length?al.map(s=>`<button class="al" type="button" data-id="${esc(s.id)}"><span><b>${esc(s.name)}</b><small>${esc(advice(s)[0])}</small></span><span><span class="badge ${risk(s).toLowerCase()}">${risk(s)} · ${riskScore(s)}</span></span></button>`).join(""):"<p class='sub'>No students need attention right now.</p>";
  table();renderPages();
  if(chart)chart.destroy();
  if(typeof Chart!=="undefined"){
    const cs=getComputedStyle(document.documentElement),g=v=>cs.getPropertyValue(v).trim();
    chart=new Chart($("chart"),{type:"doughnut",data:{labels:["High","Medium","Low"],datasets:[{data:[cnt.High,cnt.Medium,cnt.Low],backgroundColor:[g("--hi"),g("--md"),g("--lo")],borderColor:g("--card"),borderWidth:3}]},options:{maintainAspectRatio:false,cutout:"62%",plugins:{legend:{position:"bottom",labels:{color:g("--mut")}}}}});
  }
}
function loadFilters(){
  const d=$("fd"),dv=d.value;
  const deps=[...new Set(students.map(s=>s.department).filter(Boolean))];
  d.innerHTML='<option value="">All departments</option>'+deps.map(x=>`<option>${esc(x)}</option>`).join("");
  d.value=deps.includes(dv)?dv:"";
}
function table(){
  const q=$("q").value.trim().toLowerCase(),f=$("f").value;
  const rows=sorted().filter(s=>(s.name.toLowerCase().includes(q)||s.id.toLowerCase().includes(q))&&(!f||risk(s)===f));
  $("tb").innerHTML=rows.length?rows.map(s=>`<tr tabindex="0" data-id="${esc(s.id)}"><td>${esc(s.id)}</td><td><b>${esc(s.name)}</b></td><td>${esc(s.department||"–")}</td><td>${riskScore(s)}</td><td><span class="badge ${risk(s).toLowerCase()}">${risk(s)}</span></td><td>${success(s)}</td><td>${segment(s)}</td><td>${weakest(s)}</td></tr>`).join(""):'<tr><td colspan="8">No students match. Clear the search or filter.</td></tr>';
}
function details(id){
  const s=students.find(x=>x.id===id); if(!s)return; const w=weakest(s);
  $("dbody").innerHTML=`<h3 style="font-size:24px">${esc(s.name)}</h3>
  <p class="sub">${esc(s.id)} · <span class="badge ${risk(s).toLowerCase()}">${risk(s)} risk</span> · risk score ${riskScore(s)} · success score ${success(s)} · ${segment(s)}</p>
  ${s.department?`<p class="sub">Department: ${esc(s.department)}</p>`:""}<div style="margin-top:12px">${factors(s).map(([n,v])=>`<div class="fac ${n===w?"weak":""}"><span>${n}</span><div class="trk"><div style="width:${clamp(v)}%"></div></div><span>${Math.round(v)}</span></div>`).join("")}</div>
  ${focus[s.id]?`<p class="sub">Focus quiz: ${focus[s.id].score}/${focus[s.id].total}, left the page ${focus[s.id].away} time(s)</p>`:""}${has(s.study_hours)?`<p class="sub">Study time: ${s.study_hours} hours a week</p>`:""}
  <div class="act"><b>Personalized advice</b><ul>${advice(s).map(a=>`<li>${esc(a)}</li>`).join("")}</ul></div>`;
  $("dlg").showModal();
}

// STEP 4: Add student (mirrors POST /students)
const FIELDS=[["id","Student ID",1],["name","Name",1],["attendance","Attendance (0–100)",1],["marks","Marks (0–100)",1],["assignments","Assignments (0–100)",1],["study_hours","Study hours a week",1],["placement","Placement (0–100, optional)",0],["skills","Skills (0–100, optional)",0],["engagement","Engagement (0–100, optional)",0],["department","Department (optional)",0]];
function addForm(){
  $("dbody").innerHTML=`<h3 style="font-size:22px;margin-bottom:12px">Add student</h3><div class="frm">${FIELDS.map(([k,l,r])=>`<label class="${k==="name"||k==="id"?"":""}">${l}<input id="n_${k}" ${["id","name","department","course"].includes(k)?"":'type="number" min="0" step="any"'} ${r?"required":""}></label>`).join("")}</div>
  <p class="msg err" id="ferr" role="alert"></p><div class="row"><button class="pri" type="button" id="save">Save student</button></div>`;
  $("save").onclick=saveStudent; $("dlg").showModal();
}
function saveStudent(){
  const v=k=>$("n_"+k).value.trim(), e=$("ferr");
  const id=v("id"),name=v("name"); if(!id||!name){e.textContent="Enter an ID and a name.";return}
  if(students.some(s=>s.id.toLowerCase()===id.toLowerCase())){e.textContent="That student ID already exists. Use a different ID.";return}
  const s={id,name};
  for(const [k,l,r] of FIELDS.slice(2)){if(k==="department"||k==="course"){s[k]=v(k)||null;continue}
    if(v(k)===""){if(r){e.textContent=l+" is required.";return}s[k]=null;continue}
    const n=Number(v(k)),max=k==="study_hours"?Infinity:100;
    if(!isFinite(n)||n<0||n>max){e.textContent=`${l.split(" (")[0]} must be a number from 0 to ${max===Infinity?"any value":max}.`;return}
    s[k]=n}
  students.push(s); $("dlg").close(); render(); say(`${name} added. Risk level: ${risk(s)}.`,"ok");
  if(risk(s)==="High")notify("New high-risk student",`${name} (${id}) needs attention.`);
}

// STEP 5: CSV import
function parseCSV(t){
  const L=t.replace(/^\uFEFF/,"").split(/\r?\n/).filter(l=>l.trim());
  if(L.length<2)throw new Error("The file needs a header row and at least one student.");
  const h=L[0].split(",").map(x=>x.trim().toLowerCase()), ix=k=>h.indexOf(k);
  if(ix("name")<0)throw new Error("Missing column: name.");
  const col=(a,b)=>ix(a)>=0?a:(ix(b)>=0?b:null), mk_=col("marks","cgpa"), as_=col("assignments","lms");
  const need=[["attendance","attendance"],["marks",mk_],["assignments",as_]].filter(x=>!x[1]||ix(x[1])<0).map(x=>x[0]);
  if(need.length)throw new Error("Missing column(s): "+need.join(", ")+".");
  const out=[],seen=new Set();
  for(let r=1;r<L.length;r++){
    const v=L[r].split(",").map(x=>x.trim()), get=k=>ix(k)>=0?v[ix(k)]:"";
    const s={id:get("id")||("R"+String(r).padStart(4,"0")),name:get("name")};
    if(!s.name)throw new Error(`Row ${r+1}: name is empty.`);
    if(seen.has(s.id.toLowerCase()))throw new Error(`Row ${r+1}: duplicate ID ${s.id}.`); seen.add(s.id.toLowerCase());
    const num=(key,src,max,opt,mult=1)=>{const raw=get(src);if(raw===""){if(opt)return null;throw new Error(`Row ${r+1}: "${src}" is empty.`)}const n=Number(raw)*mult;if(!isFinite(n)||n<0||n>max)throw new Error(`Row ${r+1}: "${src}" is out of range.`);return n};
    s.attendance=num("attendance","attendance",100);
    s.marks=mk_==="cgpa"?num("marks","cgpa",100,false,10):num("marks","marks",100);
    s.assignments=num("assignments",as_,100);
    s.study_hours=num("study_hours","study_hours",Infinity,true);
    s.placement=num("placement","placement",100,true);s.skills=num("skills","skills",100,true);s.engagement=num("engagement","engagement",100,true);s.department=get("department")||null;
    out.push(s)}
  return out}
$("csv").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f)return; const rd=new FileReader();
  rd.onload=()=>{try{students=parseCSV(rd.result);render();say(students.length+" students imported.","ok");notify("Import finished",students.length+" students imported, "+students.filter(x=>risk(x)==="High").length+" high risk.")}catch(err){say("Import failed. "+err.message,"err")}};
  rd.onerror=()=>say("Import failed. The file could not be read.","err"); rd.readAsText(f); e.target.value=""});

// STEP 6: Focus quiz with tab-away detection (from Student Focus Monitor)
const QZ=[{q:"What is the full form of CPU?",o:["Central Processing Unit","Computer Personal Unit","Central Program Utility","Control Processing User"],a:0},
{q:"Which language is used to create web page structure?",o:["Python","HTML","Java","C++"],a:1},
{q:"Which planet is known as the Red Planet?",o:["Earth","Venus","Mars","Jupiter"],a:2},
{q:"What does RAM stand for?",o:["Random Access Memory","Read Access Machine","Rapid Application Memory","Random Application Module"],a:0}];
let qs={on:false,i:0,score:0,sel:-1,away:0,sid:null,lock:false}, focus={}, actx=null;
function beep(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;g.gain.value=.15;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+.4)}catch(e){}}
function quizView(){
  const el=$("quiz"),q=QZ[qs.i];
  if(!qs.on&&qs.i===0)el.innerHTML=`<p class="sub">Pick a student and start. Stay on this page: leaving the tab shows a warning and plays a beep.</p><div class="tools" style="margin-top:10px"><select id="fs" aria-label="Student">${students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.id)})</option>`).join("")}</select><button class="pri" data-act="start" type="button">Start quiz</button></div>`;
  else if(qs.on)el.innerHTML=`<p class="sub">Question ${qs.i+1} of ${QZ.length}</p><h3 style="font-size:19px;margin:6px 0 10px">${esc(q.q)}</h3>${q.o.map((o,i)=>`<button class="opt ${qs.sel===i?"sel":""}" data-act="opt" data-i="${i}" type="button">${esc(o)}</button>`).join("")}<div class="row"><button class="pri" data-act="submit" type="button">Submit answer</button></div><p class="msg" id="qmsg"></p>`;
  else el.innerHTML=`<h3 style="font-size:22px">Quiz complete</h3><p>Score: <b>${qs.score}/${QZ.length}</b>. Left the page ${qs.away} time(s).</p><div class="row"><button class="pri" data-act="restart" type="button">Take it again</button></div>`;
}
function focusRes(){
  const r=Object.entries(focus);
  $("fres").innerHTML=r.length?`<div class="scroll"><table style="min-width:360px"><thead><tr><th>Student</th><th>Score</th><th>Left the page</th></tr></thead><tbody>${r.map(([id,f])=>{const s=students.find(x=>x.id===id);return `<tr><td>${esc(s?s.name:id)}</td><td>${f.score}/${f.total}</td><td>${f.away}</td></tr>`}).join("")}</tbody></table></div>`:"<p class='sub'>No quiz results yet. Results are kept until you close the page.</p>";
}
$("quiz").addEventListener("click",e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="start"){
    qs={on:true,i:0,score:0,sel:-1,away:0,sid:$("fs").value,lock:false};
    $("fwarn").hidden=true;$("fstat").textContent="Student is active";$("fstat").className="stat ok";
    try{actx=actx||new (window.AudioContext||window.webkitAudioContext)()}catch(x){}
    quizView();
  }else if(a==="opt"&&!qs.lock){qs.sel=+b.dataset.i;quizView()}
  else if(a==="submit"&&!qs.lock){
    const m=$("qmsg");
    if(qs.sel<0){m.textContent="Select an answer first.";m.className="msg err";return}
    const c=QZ[qs.i],ok=qs.sel===c.a;if(ok)qs.score++;qs.lock=true;
    m.textContent=ok?"Correct.":"Not quite. Correct answer: "+c.o[c.a];m.className="msg "+(ok?"ok":"err");
    setTimeout(()=>{qs.lock=false;qs.sel=-1;qs.i++;if(qs.i>=QZ.length){qs.on=false;focus[qs.sid]={score:qs.score,total:QZ.length,away:qs.away};focusRes()}quizView()},1200);
  }else if(a==="restart"){qs={on:false,i:0,score:0,sel:-1,away:0,sid:null,lock:false};quizView()}
});
document.addEventListener("visibilitychange",()=>{
  if(!qs.on)return;
  const st=$("fstat"),w=$("fwarn");
  if(document.hidden){qs.away++;notify("Student left the quiz","Away "+qs.away+" time(s) during the quiz.");st.textContent="Student is away";st.className="stat bad";w.hidden=false;w.textContent="Attention! You left the quiz ("+qs.away+" time"+(qs.away>1?"s":"")+"). Come back and answer the question.";beep()}
  else{st.textContent="Student is active";st.className="stat ok"}
});

// STEP 7: Pages, warnings, segments and event wiring
$("add").onclick=addForm;
$("reset").onclick=()=>{students=RAW.map(mk);render();say("Sample data restored.","ok")};
$("theme").onclick=()=>{const r=document.documentElement,d=getComputedStyle(r).getPropertyValue("--bg").trim()==="#10132a";r.setAttribute("data-theme",d?"light":"dark");try{localStorage.setItem("gs-theme",d?"light":"dark")}catch(e){}render()};
try{const t=localStorage.getItem("gs-theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}
$("q").oninput=table;$("f").onchange=table;$("fd").onchange=render;
const open=e=>{const r=e.target.closest("[data-id]");if(r)details(r.dataset.id)};
$("tb").addEventListener("click",open);$("alerts").addEventListener("click",open);$("alertsAll").addEventListener("click",open);$("segPage").addEventListener("click",open);
$("tb").addEventListener("keydown",e=>{if(e.key==="Enter")open(e)});
$("close").onclick=()=>$("dlg").close();
$("dlg").addEventListener("click",e=>{if(e.target===$("dlg"))$("dlg").close()});

function row(s,extra){return `<button class="al" type="button" data-id="${esc(s.id)}"><span><b>${esc(s.name)}</b> <small>${esc(s.id)}</small><small>${extra}</small></span><span class="badge ${risk(s).toLowerCase()}">${risk(s)} · ${riskScore(s)}</span></button>`}
function renderPages(){
  const dm={};students.forEach(s=>{const k=s.department||"Unassigned";(dm[k]=dm[k]||[]).push(s)});
  $("deptTb").innerHTML=Object.entries(dm).map(([k,m])=>`<tr><td><b>${esc(k)}</b></td><td>${m.length}</td><td>${Math.round(m.reduce((a,x)=>a+success(x),0)/m.length)}</td><td>${m.filter(x=>risk(x)==="High").length}</td></tr>`).join("");
  const al=sorted().filter(s=>risk(s)!=="Low");
  $("alertsAll").innerHTML=al.length?al.map(s=>row(s,advice(s).map(esc).join(" "))).join(""):"<p class='sub'>No students need attention right now.</p>";
  const G=[["High performer","Score 80 or more. Offer advanced learning."],["Placement gap","Strong marks, weak placement readiness."],["Academic risk","Marks or attendance under 70."],["Needs monitoring","No clear problem yet. Keep watching."]];
  $("segPage").innerHTML=G.map(([g,d])=>{const m=sorted().filter(s=>segment(s)===g);return `<section class="panel group"><h2>${g} (${m.length})</h2><p class="sub" style="margin:-8px 0 10px">${d}</p>${m.length?m.map(s=>row(s,"Weakest area: "+weakest(s))).join(""):"<p class='sub'>No students in this segment.</p>"}</section>`}).join("");
}
const PAGES=["dash","warn","stu","seg","focus","guide","chat","note","acct","data"];
function go(p){
  if(!PAGES.includes(p))p="dash";
  if(p==="chat"&&(!me||me.role!=="teacher"))p="dash";
  PAGES.forEach(x=>{$("p-"+x).classList.toggle("on",x===p);const b=document.querySelector('#nav [data-p="'+x+'"]');b.classList.toggle("cur",x===p);b.setAttribute("aria-current",x===p?"page":"false")});
  if(p==="dash")render();
  if(p==="focus"){quizView();focusRes()}
  if(p==="acct")renderAcct();
  if(p==="guide")renderGuide();
  if(p==="note")renderNotes();
  if(p==="chat")renderMessages();
  try{history.replaceState(null,"","#"+p)}catch(e){}
  window.scrollTo(0,0);
}
$("nav").addEventListener("click",e=>{const b=e.target.closest("[data-p]");if(b)go(b.dataset.p)});
// STEP 8: Register and login (browser demo; Firebase version is in firebase-auth.js)
const TEACHER_CODE="TEACH2026"; // change this. Anyone who reads the page source can see it.
const AUTH={
  users(){try{return JSON.parse(localStorage.getItem("gs-users")||"{}")}catch(e){return{}}},
  save(u){localStorage.setItem("gs-users",JSON.stringify(u))},
  async hash(pw,salt){if(!window.crypto||!crypto.subtle)throw new Error("Open this page over HTTPS or localhost to create accounts.");const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(salt+pw));return[...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,"0")).join("")}
};
function nextId(users,role){
  const p=role==="teacher"?"TCH":"STU",all=Object.values(users);
  let i=1001+all.filter(x=>x.userId&&x.userId.startsWith(p)).length,id;
  do{id=p+i++}while(all.some(x=>x.userId===id));
  return id;
}
async function registerUser(name,email,password,confirmPassword,department,role,code){
  const e=email.trim().toLowerCase(),users=AUTH.users();
  if(!name.trim())throw new Error("Enter your name.");
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))throw new Error("Enter a valid email address.");
  if(password.length<6)throw new Error("Password must be at least 6 characters.");
  if(password!==confirmPassword)throw new Error("Password and confirm password do not match.");
  if(users[e])throw new Error("An account with this email already exists.");
  const r=role==="teacher"?"teacher":"student";
  if(r==="teacher"&&code.trim()!==TEACHER_CODE)throw new Error("Wrong teacher access code. Ask your administrator.");
  const salt=Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");
  users[e]={name:name.trim(),email:e,department:department.trim().toUpperCase(),role:r,userId:nextId(users,r),salt,hash:await AUTH.hash(password,salt),createdAt:new Date().toISOString()};
  try{AUTH.save(users)}catch(x){throw new Error("This browser blocked saving the account.")}
  return users[e];
}
async function loginUser(login,password,role){
  const k=login.trim().toLowerCase(),users=AUTH.users();
  const u=users[k]||Object.values(users).find(x=>x.userId&&x.userId.toLowerCase()===k);
  if(!u||u.hash!==await AUTH.hash(password,u.salt))throw new Error("Incorrect email, ID or password.");
  if(role&&u.role!==role)throw new Error("This is a "+u.role+" account. Switch to "+(u.role==="teacher"?"Teacher":"Student")+" above.");
  if(!u.userId){u.userId=nextId(users,u.role);try{AUTH.save(users)}catch(x){}}
  return u;
}
let me=null;
function showApp(u){me=u;
  try{sessionStorage.setItem("gs-session",u.email)}catch(x){}
  $("auth").hidden=true;$("app").hidden=false;
  $("who").textContent=u.name+" · "+(u.department||"No department")+" · "+u.role+(u.userId?" · "+u.userId:"");
  document.querySelector('#nav [data-p="chat"]').hidden=u.role!=="teacher";
  go((location.hash||"").slice(1));
  checkInbox();
}
function showAuth(){me=null;try{sessionStorage.removeItem("gs-session")}catch(x){}$("app").hidden=true;$("auth").hidden=false;$("amsg").textContent=""}
const aerr=x=>{$("amsg").textContent=x.message;$("amsg").className="msg err"};
function pane(n){
  $("fLogin").hidden=n!=="login";$("fReg").hidden=n!=="reg";$("fForgot").hidden=n!=="forgot";$("fReset").hidden=true;$("amsg").textContent="";
  $("atabs").querySelectorAll("button").forEach(x=>x.classList.toggle("cur",x.dataset.t===n||(n==="forgot"&&x.dataset.t==="login")));
}
$("atabs").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(b)pane(b.dataset.t)});
// Forgot password (demo): a code is shown on screen. The Firebase version emails a reset link instead.
let rst={email:"",otp:"",exp:0,tries:0};
$("toForgot").onclick=()=>pane("forgot");$("toLogin2").onclick=()=>pane("login");
$("fForgot").addEventListener("submit",e=>{e.preventDefault();
  const em=$("fEmail").value.trim().toLowerCase();
  if(!AUTH.users()[em])return aerr(new Error("Account not found."));
  rst={email:em,otp:String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000),exp:Date.now()+300000,tries:0};
  $("fReset").hidden=false;
  $("amsg").textContent="Demo code: "+rst.otp+". It was not sent by email or SMS. Valid for 5 minutes.";$("amsg").className="msg ok"});
$("fReset").addEventListener("submit",async e=>{e.preventDefault();
  try{
    if(!rst.otp)throw new Error("Generate a code first.");
    if(Date.now()>rst.exp){rst.otp="";throw new Error("Code expired. Generate a new one.")}
    if(++rst.tries>5){rst.otp="";throw new Error("Too many attempts. Start again.")}
    if($("oCode").value.trim()!==rst.otp)throw new Error("Invalid code.");
    const p=$("oPass").value;
    if(p.length<6)throw new Error("Password must be at least 6 characters.");
    if(p!==$("oConf").value)throw new Error("Passwords do not match.");
    const users=AUTH.users(),u=users[rst.email];
    u.salt=Array.from(crypto.getRandomValues(new Uint32Array(4))).join("-");u.hash=await AUTH.hash(p,u.salt);AUTH.save(users);
    rst={email:"",otp:"",exp:0,tries:0};$("fReset").reset();pane("login");
    $("amsg").textContent="Password updated. Log in with the new password.";$("amsg").className="msg ok";
  }catch(x){aerr(x)}});
$("fLogin").addEventListener("submit",async e=>{e.preventDefault();try{const u=await loginUser($("lEmail").value,$("lPass").value,authRole);$("fLogin").reset();showApp(u)}catch(x){aerr(x)}});
$("fReg").addEventListener("submit",async e=>{e.preventDefault();try{const u=await registerUser($("rName").value,$("rEmail").value,$("rPass").value,$("rConf").value,$("rDept").value,authRole,$("rCode").value);$("fReg").reset();showApp(u)}catch(x){aerr(x)}});
function renderAcct(){
  if(!me){$("acct").textContent="";return}
  const r=[["Name",me.name],["Email",me.email],["ID",me.userId||"-"],["Department",me.department||"-"],["Role",me.role],["Member since",me.createdAt?new Date(me.createdAt).toLocaleDateString():"-"]];
  $("acct").innerHTML=r.map(([k,v])=>`<div class="seg"><span>${k}</span><b style="font-size:16px">${esc(v)}</b></div>`).join("")+'<p class="hint">Accounts in this demo are kept only in this browser.</p>';
}
// STEP 9: PDF report (saved through the viewer, which asks for confirmation)
async function pdfReport(share){
  const rows=sorted();
  if(!rows.length)return say("No students to include in the report.","err");
  if(!window.jspdf||!window.jspdf.jsPDF)return say("The PDF library could not load. Check your connection.","err");
  const dl=window.claude?await window.claude.use("downloads"):null;
  
  const doc=new window.jspdf.jsPDF(),H={fillColor:[61,61,245]},o=v=>has(v)?String(v):"-";
  doc.setFontSize(20);doc.text("GROWTH SPARK",14,18);doc.setFontSize(12);doc.text("Student Analytics Report",14,27);
  doc.setFontSize(10);doc.text("Department: "+($("fd").value||"All departments"),14,35);doc.text("Total students: "+rows.length,14,41);
  doc.autoTable({startY:48,head:[["ID","Name","Dept","Attend.","Marks","Risk score","Risk","Success","Segment","Weakest"]],
    body:rows.map(s=>[s.id,s.name,s.department||"-",s.attendance+"%",s.marks+"%",riskScore(s),risk(s),success(s)+"%",segment(s),weakest(s)]),styles:{fontSize:7},headStyles:H});
  rows.forEach(s=>{doc.addPage();doc.setFontSize(16);doc.text(s.name+" - performance notebook",14,20);
    doc.autoTable({startY:28,head:[["Metric","Details"]],body:[["ID",s.id],["Department",s.department||"-"],["Attendance",s.attendance+"%"],["Marks",s.marks+"%"],["Assignments",s.assignments+"%"],["Study hours",o(s.study_hours)],["Placement",o(s.placement)],["Skills",o(s.skills)],["Engagement",o(s.engagement)],["Risk score",String(riskScore(s))],["Risk level",risk(s)],["Success score",success(s)+"%"],["Segment",segment(s)],["Weakest area",weakest(s)],["Advice",advice(s).join(" ")]],styles:{fontSize:10,cellPadding:4},headStyles:H})});
  try{
    if(share){
      try{const f=new File([doc.output("blob")],"GROWTH_SPARK_Report.pdf",{type:"application/pdf"});
        if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({title:"GROWTH SPARK Report",text:"Student analytics PDF",files:[f]});say("Shared.","ok");return}
      }catch(e){if(e&&e.name==="AbortError")return}
      say("Sharing is not available here. Offering a download instead.");
    }
    if(dl)await dl.save({filename:"GROWTH_SPARK_Report.pdf",data:doc.output("blob")});else doc.save("GROWTH_SPARK_Report.pdf");
    say("Report ready.","ok")}
  catch(x){if(!x||(x.code!=="declined"&&x.name!=="AbortError"))say("Could not save the report. "+((x&&x.message)||""),"err")}
}
$("pdfBtn").onclick=()=>pdfReport(false);$("shareBtn").onclick=()=>pdfReport(true);$("waBtn").onclick=whatsappSummary;
// STEP 10: Department guidance (ported from DepartmentGuidance.java)
const GUIDE={
CSE:{courses:["M.E / M.Tech CSE (via GATE / TANCET)","MS in Computer Science (abroad)","MBA (IT / Business Analytics)","M.Sc Data Science / AI"],apps:["LeetCode","HackerRank","GeeksforGeeks","freeCodeCamp","Coursera"],companies:["TCS","Infosys","Zoho","Cognizant","Wipro","Accenture"]},
ECE:{courses:["M.E VLSI Design","M.E Embedded Systems","M.Tech Communication Systems","MS Electrical (abroad)"],apps:["Tinkercad","Proteus","MATLAB","NPTEL","Arduino IDE"],companies:["Qualcomm","Intel","Bosch","Samsung","L&T Technology Services"]},
EEE:{courses:["M.E Power Systems","M.E Power Electronics & Drives","M.Tech Renewable Energy","MBA (Energy Mgmt)"],apps:["MATLAB / Simulink","ETAP","NPTEL","Coursera"],companies:["Siemens","ABB","Schneider Electric","TNEB / TANGEDCO","L&T"]},
MECH:{courses:["M.E CAD/CAM","M.E Thermal Engineering","M.Tech Robotics","MBA (Operations)"],apps:["AutoCAD","SolidWorks","ANSYS","NPTEL"],companies:["Ashok Leyland","TVS Motor","Hyundai","Mahindra","Royal Enfield"]},
CIVIL:{courses:["M.E Structural Engineering","M.E Construction Management","M.Tech Environmental Engg"],apps:["STAAD.Pro","Revit","AutoCAD","Primavera P6"],companies:["L&T Construction","Tata Projects","Shapoorji Pallonji","Afcons"]}};
function tip(s){const w=weakest(s);
  if(w==="Skills")return"Daily 1 hour practice on skill apps; build 2 mini projects.";
  if(w==="Placement")return"Do aptitude + mock interviews; update resume; attend company drives.";
  return advice(s)[0]}
function renderGuide(){
  const sel=$("gd"),keep=sel.value;
  const deps=[...new Set([...Object.keys(GUIDE),...students.map(x=>x.department).filter(Boolean)])];
  sel.innerHTML=deps.map(d=>`<option>${esc(d)}</option>`).join("");
  sel.value=deps.includes(keep)?keep:(deps.includes($("fd").value)?$("fd").value:deps[0]);
  const d=sel.value,g=GUIDE[d],list=(t,a)=>`<div><h3 style="font-size:16px">${t}</h3><ol>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>`;
  const st=students.filter(x=>x.department===d);
  $("gbody").innerHTML=(g?`<div class="g3">${list("Higher education",g.courses)}${list("Skill improvement apps",g.apps)}${list("Placement companies",g.companies)}</div>`:`<p class="sub">No guidance data for ${esc(d)} yet. Add it to the GUIDE list in the code.</p>`)
   +(st.length?`<h3 style="font-size:16px;margin:18px 0 6px">Student suggestions</h3>`+st.map(x=>`<div class="seg"><div><b>${esc(x.name)}</b> <span class="sub">${esc(x.id)} · Weakest: ${weakest(x)}</span></div><span style="max-width:55%;text-align:right">${esc(tip(x))}</span></div>`).join(""):"");
}
$("gd").onchange=renderGuide;

// STEP 11: Show or hide password
function togglePassword(inputId,button){
  const p=$(inputId),show=p.type==="password";
  p.type=show?"text":"password";button.textContent=show?"Hide":"Show";
  button.setAttribute("aria-pressed",String(show));button.setAttribute("aria-label",(show?"Hide":"Show")+" password");
}
["lPass","rPass","rConf","oPass","oConf"].forEach(id=>{const b=document.createElement("button");b.type="button";b.className="eye";b.textContent="Show";b.setAttribute("aria-label","Show password");b.setAttribute("aria-pressed","false");b.onclick=()=>togglePassword(id,b);$(id).after(b)});
// STEP 12: Notifications and WhatsApp sharing (web versions of the Android intent and notification code)
const NOTES=[];
function notify(title,text){
  NOTES.unshift({title,text,time:new Date()});if(NOTES.length>50)NOTES.pop();
  const t=$("toast");t.textContent=title+": "+text;t.hidden=false;clearTimeout(notify.t);notify.t=setTimeout(()=>{t.hidden=true},5000);
  try{if("Notification" in window&&Notification.permission==="granted")new Notification(title,{body:text})}catch(e){}
  if($("p-note").classList.contains("on"))renderNotes();
}
function renderNotes(){
  $("nList").innerHTML=inboxHtml()+(NOTES.length?NOTES.map(n=>`<div class="seg"><div><b>${esc(n.title)}</b><span class="sub" style="display:block">${esc(n.text)}</span></div><span class="sub">${n.time.toLocaleTimeString()}</span></div>`).join(""):"<p class='sub'>No notifications yet. They appear here when a high-risk student is added, a CSV is imported or a student leaves the quiz.</p>");
}
$("nPerm").onclick=async()=>{
  if(!("Notification" in window))return say("This browser does not support device notifications.","err");
  try{const r=await Notification.requestPermission();say(r==="granted"?"Device notifications are on.":"Device notifications were not allowed. In-app alerts still work.",r==="granted"?"ok":"err")}
  catch(e){say("Device notifications are not available in this view. In-app alerts still work.","err")}
};
$("nTest").onclick=()=>notify("New Message","Hello! This is a test notification.");
function whatsappSummary(){
  const r=sorted(),hi=r.filter(x=>risk(x)==="High");
  const text="GROWTH SPARK summary"+($("fd").value?" - "+$("fd").value:"")+"\nStudents: "+r.length+"\nHigh risk: "+hi.length+(hi.length?"\n"+hi.slice(0,10).map(x=>"- "+x.name+" (risk score "+riskScore(x)+")").join("\n"):"");
  const w=window.open("https://wa.me/?text="+encodeURIComponent(text),"_blank");
  if(w){w.opener=null;return}
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(()=>say("WhatsApp could not open here. The summary is copied: paste it into WhatsApp.","ok"),()=>say("WhatsApp could not open here.","err"));
  else say("WhatsApp could not open here.","err");
}
// STEP 13: Teachers' room (messages only teacher accounts can open)
const TMSG_KEY="growthSparkTeacherMessages";
const isTeacher=()=>!!me&&me.role==="teacher";
function loadMsgs(){try{return JSON.parse(localStorage.getItem(TMSG_KEY)||"[]")}catch(e){return[]}}
function renderMessages(){
  if(!isTeacher())return;
  const box=$("messages");
  box.innerHTML=loadMsgs().map(m=>`<div class="message"><b>${m.id===me.userId?"You":esc(m.from)}</b> <span class="sub">${esc(m.id)} · ${esc(m.time)}</span><br>${esc(m.message)}</div>`).join("")||'<p class="sub">No messages yet.</p>';
  box.scrollTop=box.scrollHeight;
  fillAnnTo();renderAnn();
}
function sendMessage(){
  if(!isTeacher())return;
  const input=$("messageInput"),message=input.value.trim();
  if(!message)return say("Please type a message.","err");
  const time=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const h=loadMsgs();h.push({message,time,from:me.name,id:me.userId});
  try{localStorage.setItem(TMSG_KEY,JSON.stringify(h.slice(-200)))}catch(e){say("This browser blocked saving the message.","err")}
  input.value="";renderMessages();
  try{if("Notification" in window&&Notification.permission==="granted"&&document.hidden)new Notification("GROWTH SPARK - New Message",{body:message})}catch(e){}
}
const ANN_KEY="growthSparkAnnouncements";
function loadAnn(){try{return JSON.parse(localStorage.getItem(ANN_KEY)||"[]")}catch(e){return[]}}
const forMe=a=>!!me&&me.role==="student"&&(!a.dept||a.dept===(me.department||"").toUpperCase());
function fillAnnTo(){
  const sel=$("annTo"),keep=sel.value;
  const accts=Object.values(AUTH.users()).filter(u=>u.role==="student").map(u=>u.department);
  const deps=[...new Set([...Object.keys(GUIDE),...students.map(x=>x.department),...accts].filter(Boolean).map(d=>d.toUpperCase()))];
  sel.innerHTML='<option value="">All students</option>'+deps.map(d=>`<option>${esc(d)}</option>`).join("");
  sel.value=deps.includes(keep)?keep:"";
}
function renderAnn(){
  const mine=loadAnn().filter(a=>a.fromId===me.userId).slice(-10).reverse();
  $("annList").innerHTML=mine.length?mine.map(a=>`<div class="seg"><div><span class="sub">To ${a.dept?esc(a.dept)+" students":"all students"}</span><span style="display:block">${esc(a.text)}</span></div><span class="sub">${new Date(a.ts).toLocaleTimeString()}</span></div>`).join(""):"<p class='sub'>You have not sent any messages yet.</p>";
}
function sendToStudents(){
  if(!isTeacher())return;
  const text=$("annText").value.trim(),to=$("annTo").value,m=$("annMsg");
  const bad=t=>{m.textContent=t;m.className="msg err"};
  if(!text)return bad("Write a message first.");
  const list=loadAnn();
  list.push({id:Date.now()+"-"+Math.random().toString(36).slice(2,6),text,dept:to,from:me.name,fromId:me.userId,ts:Date.now()});
  try{localStorage.setItem(ANN_KEY,JSON.stringify(list.slice(-200)))}catch(e){return bad("This browser blocked saving the message.")}
  const n=Object.values(AUTH.users()).filter(u=>u.role==="student"&&(!to||(u.department||"").toUpperCase()===to)).length;
  $("annText").value="";m.className="msg ok";
  m.textContent="Sent to "+(to?to+" students":"all students")+" ("+n+" registered student account"+(n===1?"":"s")+" in this browser).";
  renderAnn();
}
function checkInbox(){
  if(!me||me.role!=="student")return;
  const k="growthSparkSeen:"+me.userId;let seen=new Date(me.createdAt||0).getTime();
  try{const v=localStorage.getItem(k);if(v)seen=Number(v)}catch(e){}
  const fresh=loadAnn().filter(a=>a.ts>seen&&forMe(a));
  if(!fresh.length)return;
  try{localStorage.setItem(k,String(Math.max(...fresh.map(a=>a.ts))))}catch(e){}
  fresh.forEach(a=>notify("Message from "+a.from,a.text));
  if($("p-note").classList.contains("on"))renderNotes();
}
function inboxHtml(){
  if(!me||me.role!=="student")return"";
  const a=loadAnn().filter(forMe).reverse();
  return '<h3 style="font-size:16px;margin:0 0 6px">Messages from teachers</h3>'+(a.length?a.map(x=>`<div class="seg"><div><b>${esc(x.from)}</b> <span class="sub">${esc(x.fromId)}</span><span class="sub" style="display:block">${esc(x.text)}</span></div><span class="sub">${new Date(x.ts).toLocaleString()}</span></div>`).join(""):"<p class='sub'>No messages from teachers yet.</p>")+'<h3 style="font-size:16px;margin:16px 0 6px">App alerts</h3>';
}
$("annSend").onclick=sendToStudents;
window.addEventListener("storage",e=>{if(e.key===ANN_KEY)checkInbox()});
setInterval(checkInbox,5000);
async function enableNotifications(){
  if(!("Notification" in window))return say("Notifications are not supported in this browser.","err");
  if(!window.isSecureContext)return say("Notifications require HTTPS or localhost.","err");
  try{
    const p=await Notification.requestPermission();
    if(p==="granted"){new Notification("GROWTH SPARK",{body:"Notifications enabled successfully!"});say("Notifications are on.","ok")}
    else say("Please allow notifications in the browser settings. In-app alerts still work.","err");
  }catch(e){say("Notifications are not available in this view. In-app alerts still work.","err")}
}
let authRole="student";
const syncRole=()=>{$("rCodeL").hidden=authRole!=="teacher"};
function setRole(r){
  authRole=r;syncRole();
  $("rtabs").querySelectorAll("button").forEach(b=>b.classList.toggle("cur",b.dataset.r===r));
  $("roleNote").textContent=r==="teacher"?"Teacher account: IDs look like TCH1001. Registering needs the teacher access code.":"Student account: IDs look like STU1001. Messages from your teachers reach you here.";
  $("amsg").textContent="";
}
$("rtabs").addEventListener("click",e=>{const b=e.target.closest("[data-r]");if(b)setRole(b.dataset.r)});
$("fReg").addEventListener("reset",()=>setTimeout(syncRole));
setRole("student");
$("sendMsg").onclick=sendMessage;
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter")sendMessage()});
$("nPerm").onclick=enableNotifications;$("enableNotif").onclick=enableNotifications;
$("logout").onclick=()=>{showAuth()};
render();
try{const em=sessionStorage.getItem("gs-session"),u=em&&AUTH.users()[em];if(u)showApp(u)}catch(x){}
