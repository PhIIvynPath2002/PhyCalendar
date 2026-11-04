import {validateSubscription,validDate,addDays,nextBoundary} from './core.js';
function validId(x){return typeof x==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(x);}
export function validateBackup(b){
 if(![1,2].includes(b.version)||!Array.isArray(b.subscriptions)||!Array.isArray(b.payments)||b.subscriptions.length>2000||b.payments.length>50000)throw Error('备份格式无效或记录过多');
 const ids=new Set(),pids=new Set();
 const subscriptions=b.subscriptions.map(x=>{if(!validId(x.id)||!validId(x.scheduleId)||ids.has(x.id))throw Error('订阅编号无效或重复');ids.add(x.id);return {...validateSubscription(x),scheduleId:x.scheduleId};});
 const keys=new Set();
 const payments=b.payments.map(p=>{
  if(!validId(p.id)||pids.has(p.id)||!validId(p.subscriptionId)||!validId(p.scheduleId)||!validDate(p.dueDate)||!validDate(p.paidDate)||!validDate(p.periodStart)||!validDate(p.periodEnd)||p.periodEnd<p.periodStart||!['CNY','USD'].includes(p.currency)||typeof p.name!=='string'||!p.name.trim()||p.name.length>100||typeof p.amount!=='number'||!Number.isFinite(p.amount)||p.amount<0||p.amount>100000000||Math.abs(p.amount*100-Math.round(p.amount*100))>0.00001)throw Error('付款记录格式无效');
  const key=`${p.subscriptionId}:${p.scheduleId}:${p.dueDate}`;if(keys.has(key))throw Error('备份包含重复周期付款');keys.add(key);pids.add(p.id);
  return {id:p.id,subscriptionId:p.subscriptionId,scheduleId:p.scheduleId,name:p.name,dueDate:p.dueDate,paidDate:p.paidDate,periodStart:p.periodStart,periodEnd:p.periodEnd,amount:p.amount,currency:p.currency};
 });return {subscriptions,payments};
}

export const SCHEMA_VERSION=2;
export function migrate(input) {
 if(!input || ![1,2].includes(input.version)) throw Error('数据格式来自更新版本或格式损坏。原数据未改动，请更新应用或恢复 JSON 备份。');
 const valid=validateBackup(input);
 return {...valid,version:SCHEMA_VERSION,revision:Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0};
}
export const emptyState=()=>({version:SCHEMA_VERSION,revision:0,subscriptions:[],payments:[]});
export function applyMutation(state,path,b,id=()=>globalThis.crypto.randomUUID()) {
 state=migrate(structuredClone(state));
 if(b.revision!==state.revision)throw Error('另一个窗口已修改数据。请关闭编辑窗口并刷新后重试，避免覆盖。');
 if(path==='subscriptions') {
  const s=validateSubscription(b.subscription),old=state.subscriptions.find(x=>x.id===s.id);
  if(s.id&&!old)throw Error('订阅不存在');
  const changed=old&&(old.dueDate!==s.dueDate||old.cycle!==s.cycle||(s.cycle==='custom'&&old.customDays!==s.customDays));
  const item={...s,id:old?.id||id(),scheduleId:!old||changed?id():old.scheduleId};
  if(old)state.subscriptions=state.subscriptions.map(x=>x.id===item.id?item:x);
  else {if(state.subscriptions.length>=2000)throw Error('最多 2000 个订阅');state.subscriptions.push(item);}
 } else if(path==='subscriptions/delete')state.subscriptions=state.subscriptions.filter(s=>s.id!==b.id);
 else if(path==='payments') {
  const s=state.subscriptions.find(s=>s.id===b.subscriptionId);if(!s)throw Error('订阅不存在');
  if(!validDate(b.dueDate)||!validDate(b.paidDate)||!Number.isFinite(b.amount)||b.amount<0||b.amount>1e8||Math.abs(b.amount*100-Math.round(b.amount*100))>0.00001)throw Error('付款日期或金额无效');
  if(b.dueDate<s.dueDate||(s.cycle==='once'?b.dueDate!==s.dueDate:nextBoundary(s,addDays(b.dueDate,-1))!==b.dueDate))throw Error('请选择计划中的周期日期');
  if(state.payments.some(p=>p.subscriptionId===s.id&&p.scheduleId===s.scheduleId&&p.dueDate===b.dueDate))throw Error('此周期已确认付款');
  if(state.payments.length>=50000)throw Error('最多 50000 条付款记录');
  state.payments.push({id:id(),subscriptionId:s.id,scheduleId:s.scheduleId,name:s.name,dueDate:b.dueDate,paidDate:b.paidDate,amount:b.amount,currency:s.currency,periodStart:b.dueDate,periodEnd:nextBoundary(s,b.dueDate)||b.dueDate});
 } else if(path==='payments/delete')state.payments=state.payments.filter(p=>p.id!==b.id);
 else if(path==='import') {const imported=migrate(b.backup);state.subscriptions=imported.subscriptions;state.payments=imported.payments;}
 else throw Error('不支持的操作');
 state.revision++;return state;
}
