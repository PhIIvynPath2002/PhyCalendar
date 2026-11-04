// All schedule arithmetic uses civil dates in UTC, never elapsed local milliseconds.
export const CURRENCIES = ['CNY', 'USD'];
export function validDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T12:00:00Z');
  return s >= '1900-01-01' && s <= '2200-12-31' && !Number.isNaN(+d) && d.toISOString().slice(0, 10) === s;
}
export function addDays(s, n) {
  const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function shiftMonths(s, n) {
  const [y, m, day] = s.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).getUTCDate();
  d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10);
}
export function boundary(s, n) {
  if (s.cycle === 'monthly') return shiftMonths(s.dueDate, n);
  if (s.cycle === 'yearly') return shiftMonths(s.dueDate, n * 12);
  if (s.cycle === 'custom') return addDays(s.dueDate, n * s.customDays);
  return n === 0 ? s.dueDate : null;
}
export function nextBoundary(s, date) {
  if (s.cycle === 'once') return null;
  // Anchored at the original due date: Jan 31 → Feb 28 → Mar 31.
  for (let n = 0; n <= 110000; n++) {
    const d = boundary(s, n); if (d > date) return d;
  }
  return null;
}
export function validateSubscription(input) {
  const s = {
    id: input.id, name: String(input.name || '').trim(), account: String(input.account || '').trim(),
    description: String(input.description || '').trim(), notes: String(input.notes || '').trim(),
    startDate: input.startDate || '', dueDate: input.dueDate, dueType: input.dueType || 'charge',
    amount: Number(input.amount), currency: input.currency || 'CNY', cycle: input.cycle || 'monthly',
    customDays: Number(input.customDays ?? 30), autoRenew: input.autoRenew === true,
    category: input.category || '其他', status: input.status || 'active', trialEnd: input.trialEnd || '',
    reminders: Array.isArray(input.reminders) ? [...new Set(input.reminders)].sort((a,b) => b-a) : [7,3,1]
  };
  if (!s.name || s.name.length > 100) throw Error('服务名称必填，最多 100 个字');
  if (!validDate(s.dueDate) || (s.startDate && !validDate(s.startDate)) || (s.trialEnd && !validDate(s.trialEnd))) throw Error('请填写有效日期（1900—2200 年）');
  if (s.startDate && s.startDate > s.dueDate) throw Error('开始日期不能晚于到期/扣款日期');
  if (!Number.isFinite(s.amount) || s.amount < 0 || s.amount > 100000000 || Math.abs(s.amount * 100 - Math.round(s.amount * 100)) > 0.00001) throw Error('金额需为非负数，最多两位小数');
  if (!CURRENCIES.includes(s.currency)) throw Error('币种不支持');
  if (!['monthly','yearly','custom','once'].includes(s.cycle) || !Number.isInteger(s.customDays) || s.customDays < 1 || s.customDays > 3650) throw Error('周期不正确，自定义周期为 1—3650 天');
  if (!['charge','expiry'].includes(s.dueType) || !['active','canceled','expired'].includes(s.status)) throw Error('状态或日期类型不正确');
  if (!['AI','音乐','云存储','学习','其他'].includes(s.category)) throw Error('分类不正确');
  if ([s.account,s.description,s.notes].some(v=>v.length>3000)) throw Error('备注最多 3000 个字');
  if (s.reminders.some(v=>!Number.isInteger(v)||v<0||v>365)) throw Error('提醒天数需为 0—365 的整数');
  if (s.status !== 'active' || s.cycle === 'once') s.autoRenew = false;
  return s;
}
export function eventsFor(subscriptions, payments, from, to) {
  const events = [];
  for (const s of subscriptions) {
    const paid = new Set(payments.filter(p=>p.subscriptionId===s.id && p.scheduleId===s.scheduleId).map(p=>p.dueDate));
    const repeats = s.status === 'active' && s.autoRenew && s.cycle !== 'once';
    for (let n=0; n < (repeats ? 110000 : 1); n++) {
      const date = boundary(s,n); if (!date || date > to) break;
      if (date >= from && !paid.has(date)) events.push({id:`${s.id}:${date}`, subscriptionId:s.id, date, kind:repeats ? 'expected' : 'due', name:s.name, amount:s.amount, currency:s.currency, s});
    }
    // Canceling renewal keeps the already-paid entitlement until its saved end.
    if (!repeats && s.cycle !== 'once') {
      const paidEnd = payments.filter(p=>p.subscriptionId===s.id&&p.scheduleId===s.scheduleId).map(p=>p.periodEnd).filter(Boolean).sort().at(-1);
      if (paidEnd && paidEnd>s.dueDate && paidEnd>=from && paidEnd<=to && !paid.has(paidEnd)) events.push({id:`${s.id}:${paidEnd}`,subscriptionId:s.id,date:paidEnd,kind:'due',name:s.name,amount:s.amount,currency:s.currency,s});
    }
    if (s.trialEnd && s.trialEnd>=from && s.trialEnd<=to) events.push({id:`${s.id}:trial`,subscriptionId:s.id,date:s.trialEnd,kind:'trial',name:s.name,amount:0,currency:s.currency,s});
  }
  for (const p of payments) if (p.paidDate >= from && p.paidDate <= to) events.push({id:p.id,subscriptionId:p.subscriptionId,date:p.paidDate,kind:'paid',name:p.name,amount:p.amount,currency:p.currency,p});
  return events.sort((a,b)=>a.date.localeCompare(b.date)||a.name.localeCompare(b.name));
}
export function statistics(subs,payments,today) {
  const first=today.slice(0,7)+'-01', last=addDays(shiftMonths(first,1),-1), end30=addDays(today,29);
  const yearEnd=addDays(shiftMonths(today,12),-1);
  const expected=eventsFor(subs,payments,today,yearEnd).filter(e=>e.kind==='expected');
  const total = xs => Object.fromEntries(CURRENCIES.map(c=>[c,xs.filter(x=>x.currency===c).reduce((n,x)=>n+Math.round(x.amount*100),0)/100]));
  return {actual:total(payments.filter(p=>p.paidDate>=first&&p.paidDate<=last)),remaining:total(expected.filter(e=>e.date<=last)),next30:total(expected.filter(e=>e.date<=end30)),annual:total(expected),active:subs.filter(s=>s.status==='active').length};
}
function icsText(s) { return String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,'); }
function fold(line) {
  const chunks=[]; let part='', bytes=0;
  for (const c of line) { const size=new TextEncoder().encode(c).length; if(bytes+size>73){chunks.push(part);part=' ';bytes=1;} part+=c;bytes+=size; }
  chunks.push(part); return chunks.join('\r\n');
}
export function makeICS(subs,payments,from,to) {
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PhyCalendar//Personal Calendar//ZH','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:个人订阅日历（静态备份）'];
  for (const e of eventsFor(subs,payments,from,to).filter(e=>e.kind!=='paid')) {
    lines.push('BEGIN:VEVENT',`UID:${icsText(e.id)}@phycalendar.local`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDays(e.date,1).replaceAll('-','')}`,`SUMMARY:${icsText(`${e.kind==='expected'?'[预计] ':e.kind==='trial'?'[试用结束] ':'[到期] '}${e.name}`)}`,`DESCRIPTION:${icsText(`${e.currency} ${e.amount.toFixed(2)}；静态导出，不表示已付款。请以应用内记录为准。`)}`);
    for(const days of e.s.reminders) lines.push('BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:订阅提醒',`TRIGGER:-P${days}D`,'END:VALARM');
    lines.push('END:VEVENT');
  }
  return lines.concat('END:VCALENDAR').map(fold).join('\r\n')+'\r\n';
}
