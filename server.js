const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname,'data','db.json');
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
const defaults={members:[{id:'m1',name:'DHARSHINI'},{id:'m2',name:'SUBETHA'},{id:'m3',name:'JANA'},{id:'m4',name:'MADHU'}],tasks:[
{id:'groceries',name:'Groceries',weight:15,slots:1,emoji:'🛒'},
{id:'cutting',name:'Vegetable Cutting',weight:15,slots:1,emoji:'🥕'},
{id:'cooking',name:'Cooking',weight:40,slots:1,emoji:'🍳'},
{id:'washing',name:'Vessel Washing',weight:15,slots:1,emoji:'🍽️'},
{id:'cleaning',name:'Cleaning House',weight:30,slots:1,emoji:'🧹'}],assignments:[]};
function load(){if(!fs.existsSync(DB)) fs.writeFileSync(DB,JSON.stringify(defaults,null,2)); return JSON.parse(fs.readFileSync(DB));}
function save(db){fs.writeFileSync(DB,JSON.stringify(db,null,2));}
function normalizedSlots(db){let sum=db.tasks.reduce((a,t)=>a+t.weight,0);return db.tasks.map(t=>({...t,slotWeight:t.weight/t.slots,normalizedWeight:(t.weight/t.slots)/sum*100}));}
function allocate(db,meal,date){const members=db.members; const tasks=normalizedSlots(db); const history={}; members.forEach(m=>history[m.id]=0);
  const sameDay=db.assignments.filter(a=>a.date===date && a.meal!==meal);
  sameDay.forEach(a=>a.items.forEach(i=>{history[i.memberId]+=i.normalizedWeight}));
  const previousDate=db.assignments.filter(a=>a.date<date).sort((a,b)=>b.date.localeCompare(a.date))[0]?.date;
  const previousAssignments=db.assignments.filter(a=>a.date===previousDate);
  const used={}; members.forEach(m=>used[m.id]=new Set());
  sameDay.forEach(a=>a.items.forEach(i=>used[i.memberId].add(i.taskId)));
  const slots=tasks.flatMap(t=>Array.from({length:t.slots},()=>t));
  let best=null;
  function variance(load){const vals=members.map(m=>load[m.id]); const mean=vals.reduce((a,b)=>a+b,0)/members.length; return vals.reduce((a,v)=>a+(v-mean)**2,0);}
  function search(index,mealLoad,items,repeatCount){
    if(index===slots.length){
      const mealScore=variance(mealLoad); const totalLoad={};
      members.forEach(m=>{totalLoad[m.id]=history[m.id]+mealLoad[m.id]});
      const totalScore=variance(totalLoad);
      const score=[Math.round(mealScore*1e8),Math.round(totalScore*1e8),repeatCount];
      if(!best||score.some((value,i)=>value<best.score[i]&&score.slice(0,i).every((v,j)=>v===best.score[j])))best={score,items};
      return;
    }
    const task=slots[index];
    const available=members.filter(member=>!used[member.id].has(task.id));
    (available.length?available:members).forEach(member=>{
      const repeated=previousAssignments.some(a=>a.items.some(item=>item.taskId===task.id&&item.memberId===member.id))?1:0;
      const nextLoad={...mealLoad}; nextLoad[member.id]+=task.normalizedWeight;
      used[member.id].add(task.id);
      search(index+1,nextLoad,[...items,{taskId:task.id,taskName:task.name,emoji:task.emoji,memberId:member.id,memberName:member.name,normalizedWeight:task.normalizedWeight,status:'pending'}],repeatCount+repeated);
      used[member.id].delete(task.id);
    });
  }
  const emptyLoad={}; members.forEach(member=>emptyLoad[member.id]=0);
  search(0,emptyLoad,[],0);
  return best.items;
}
app.get('/api/state',(req,res)=>res.json(load()));
app.post('/api/members',(req,res)=>{const db=load();const name=String(req.body.name||'').trim().toUpperCase();if(!name)return res.status(400).json({error:'Name required'});if(db.members.some(m=>m.name===name))return res.status(400).json({error:'Member already exists'});db.members.push({id:'m'+Date.now(),name});save(db);res.json(db);});
app.delete('/api/members/:id',(req,res)=>{const db=load();if(!db.members.some(m=>m.id===req.params.id))return res.status(404).json({error:'Member not found'});if(db.members.length<=1)return res.status(400).json({error:'At least one member is required'});db.members=db.members.filter(m=>m.id!==req.params.id);save(db);res.json(db);});
app.post('/api/tasks',(req,res)=>{const db=load();const name=String(req.body.name||'').trim();const weight=Number(req.body.weight);const slots=Math.min(db.members.length,Math.max(1,Number(req.body.slots)||1));if(!name||!weight)return res.status(400).json({error:'Task name and weight required'});db.tasks.push({id:'t'+Date.now(),name,weight,slots,emoji:'✨'});save(db);res.json(db);});
app.patch('/api/tasks/:id',(req,res)=>{const db=load();const task=db.tasks.find(t=>t.id===req.params.id);const name=String(req.body.name||'').trim();const weight=Number(req.body.weight);const slots=Math.min(db.members.length,Math.max(1,Number(req.body.slots)||1));if(!task)return res.status(404).json({error:'Task not found'});if(!name||!weight)return res.status(400).json({error:'Task name and weight required'});task.name=name;task.weight=weight;task.slots=slots;save(db);res.json(db);});
app.delete('/api/tasks/:id',(req,res)=>{const db=load();if(!db.tasks.some(t=>t.id===req.params.id))return res.status(404).json({error:'Task not found'});db.tasks=db.tasks.filter(t=>t.id!==req.params.id);save(db);res.json(db);});
app.post('/api/assign',(req,res)=>{const db=load();const meal=req.body.meal,date=req.body.date||new Date().toISOString().slice(0,10);if(!['breakfast','lunch','dinner'].includes(meal))return res.status(400).json({error:'Invalid meal'});if(db.members.length<4)return res.status(400).json({error:'At least 4 members are required'});db.assignments=db.assignments.filter(a=>!(a.date===date&&a.meal===meal));const items=allocate(db,meal,date);db.assignments.push({id:'a'+Date.now(),date,meal,items,createdAt:new Date().toISOString()});save(db);res.json(db);});
app.patch('/api/assignment/:id/item/:index',(req,res)=>{const db=load();const a=db.assignments.find(x=>x.id===req.params.id);if(!a)return res.status(404).json({error:'Assignment not found'});const i=a.items[Number(req.params.index)];if(!i)return res.status(404).json({error:'Item not found'});i.status=req.body.status==='completed'?'completed':'pending';i.completedAt=i.status==='completed'?new Date().toISOString():null;save(db);res.json(db);});
app.delete('/api/reset',(req,res)=>{save(JSON.parse(JSON.stringify(defaults)));res.json(load());});
app.listen(PORT,()=>console.log(`AI Bachelor Chore Manager running at http://localhost:${PORT}`));
