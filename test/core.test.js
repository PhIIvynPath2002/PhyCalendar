import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundary,eventsFor,statistics,validateSubscription,makeICS,validDate} from '../public/core.js';
const plan=(overrides={})=>({...validateSubscription({name:'ChatGPT（演示值）',dueDate:'2026-01-31',amount:20,currency:'USD',autoRenew:true,cycle:'monthly',...overrides}),id:'sub-1',scheduleId:'schedule-1'});
test('月付以原始日期锚定，月底不漂移',()=>{
 const s=plan();assert.equal(boundary(s,1),'2026-02-28');assert.equal(boundary(s,2),'2026-03-31');assert.equal(boundary(s,3),'2026-04-30');
 for(const day of [29,30,31]){const p=plan({dueDate:`2024-01-${day}`});assert.equal(boundary(p,1),'2024-02-29');assert.equal(boundary(p,2),`2024-03-${day}`);}
});
test('年付处理闰年并恢复 2 月 29 日，自定义按日历天',()=>{
 const s=plan({dueDate:'2024-02-29',cycle:'yearly'});assert.equal(boundary(s,1),'2025-02-28');assert.equal(boundary(s,4),'2028-02-29');
 assert.equal(boundary(plan({dueDate:'2026-12-31',cycle:'custom',customDays:3}),1),'2027-01-03');
});
test('预计付款与实际付款分开，付款后去重、价格变化保留历史',()=>{
 const s=plan(), p={id:'p1',subscriptionId:s.id,scheduleId:s.scheduleId,dueDate:'2026-01-31',paidDate:'2026-02-01',amount:18,currency:'USD',name:s.name};
 const ev=eventsFor([{...s,amount:25}],[p],'2026-01-01','2026-03-31');assert.equal(ev.filter(e=>e.kind==='expected').length,2);assert.equal(ev.find(e=>e.kind==='paid').amount,18);assert.equal(ev.find(e=>e.kind==='expected').amount,25);
 const st=statistics([{...s,amount:25}],[p],'2026-02-01');assert.equal(st.actual.USD,18);assert.equal(st.actual.CNY,0);assert.equal(st.remaining.USD,25);assert.equal(st.next30.USD,25);
});
test('取消续费、非自动和一次性不生成未来预计；试用独立提醒',()=>{
 for(const o of [{status:'canceled'},{autoRenew:false},{cycle:'once'},{status:'expired'}]){const e=eventsFor([plan(o)],[],'2026-01-01','2027-01-01');assert.equal(e.filter(x=>x.kind==='expected').length,0);assert.equal(e.filter(x=>x.kind==='due').length,1);}
 assert.equal(eventsFor([plan({trialEnd:'2026-01-20'})],[],'2026-01-01','2026-02-01').filter(e=>e.kind==='trial').length,1);
});
test('已付款后取消仍在期末保留权益到期提示',()=>{
 const s=plan({status:'canceled'}),p={id:'p',subscriptionId:s.id,scheduleId:s.scheduleId,dueDate:'2026-01-31',paidDate:'2026-01-31',periodStart:'2026-01-31',periodEnd:'2026-02-28',name:s.name,amount:20,currency:'USD'};
 const ev=eventsFor([s],[p],'2026-01-01','2026-12-31');assert.equal(ev.filter(x=>x.kind==='expected').length,0);assert.deepEqual(ev.filter(x=>x.kind==='due').map(x=>x.date),['2026-02-28']);
});
test('跨币种、30天和年度边界，以分为单位累计',()=>{
 const subs=[plan({dueDate:'2026-11-04',amount:10}),{...plan({dueDate:'2026-11-04',amount:20,currency:'CNY'}),id:'sub-2'}];const st=statistics(subs,[],'2026-11-04');assert.deepEqual(st.next30,{CNY:20,USD:10});assert.deepEqual(st.annual,{CNY:240,USD:120});assert.equal(st.active,2);
 const decimal=statistics([],Array.from({length:3},()=>({name:'测试',paidDate:'2026-11-04',currency:'CNY',amount:.1})),'2026-11-04');assert.equal(decimal.actual.CNY,.3);
});
test('日期及金额校验拒绝不存在日期与三位小数',()=>{assert.equal(validDate('2025-02-29'),false);assert.equal(validDate('2024-02-29'),true);assert.throws(()=>plan({amount:1.234}));assert.throws(()=>plan({customDays:0,cycle:'custom'}));assert.throws(()=>plan({startDate:'2026-02-01'}));});
test('ICS 为全天静态事件，转义、折行及提前提醒，不包含账号',()=>{
 const s=plan({name:'测试,;\\\n'+'订阅'.repeat(40),account:'private@example.com',reminders:[7,3,1,0]});const text=makeICS([s],[],'2026-01-01','2026-03-01');assert.ok(text.includes('TRIGGER:-P7D'));assert.ok(text.includes('DTEND;VALUE=DATE:20260201'));assert.ok(!text.includes(s.account));assert.ok(text.includes('\\,\\;\\\\\\n'));for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
});
