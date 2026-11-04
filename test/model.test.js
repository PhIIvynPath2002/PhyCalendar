import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,migrate,applyMutation} from '../public/model.js';
const sub={name:'ChatGPT（测试演示）',dueDate:'2026-01-31',amount:20,currency:'USD',cycle:'monthly',autoRenew:true};
const apply=(s,p,b)=>applyMutation(s,p,{...b,revision:s.revision});
test('免登录 CRUD、付款去重、价格修改保留历史、取消保留权益',()=>{
 let s=apply(emptyState(),'subscriptions',{subscription:sub});const saved=s.subscriptions[0];
 s=apply(s,'payments',{subscriptionId:saved.id,dueDate:'2026-02-28',paidDate:'2026-02-27',amount:18});assert.equal(s.payments[0].periodEnd,'2026-03-31');
 assert.throws(()=>apply(s,'payments',{subscriptionId:saved.id,dueDate:'2026-02-28',paidDate:'2026-02-28',amount:20}));
 s=apply(s,'subscriptions',{subscription:{...saved,amount:30,status:'canceled'}});assert.equal(s.payments[0].amount,18);assert.equal(s.subscriptions[0].autoRenew,false);assert.equal(s.subscriptions[0].scheduleId,saved.scheduleId);
 s=apply(s,'subscriptions/delete',{id:saved.id});assert.equal(s.payments.length,1);assert.equal(s.subscriptions.length,0);
});
test('version1 备份升级为2，未知版本或损坏数据不覆盖原记录',()=>{
 const a=apply(emptyState(),'subscriptions',{subscription:sub}),original=structuredClone(a),old={...a,version:1};
 assert.deepEqual(migrate(old),a);const restored=apply(emptyState(),'import',{backup:old});assert.equal(restored.subscriptions[0].name,sub.name);
 assert.throws(()=>apply(a,'import',{backup:{...a,version:99}}));assert.deepEqual(a,original);
 assert.throws(()=>apply(a,'import',{backup:{...a,subscriptions:[...a.subscriptions,...a.subscriptions]}}));assert.deepEqual(a,original);
});
test('多窗口版本冲突与非法周期均拒绝，不修改原快照',()=>{
 const a=apply(emptyState(),'subscriptions',{subscription:sub});assert.throws(()=>applyMutation(a,'subscriptions/delete',{revision:0,id:a.subscriptions[0].id}));
 assert.throws(()=>apply(a,'payments',{subscriptionId:a.subscriptions[0].id,dueDate:'2026-02-27',paidDate:'2026-02-27',amount:20}));assert.equal(a.subscriptions.length,1);assert.equal(a.payments.length,0);
});
