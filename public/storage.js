import {Capacitor} from '@capacitor/core';
import {Preferences} from '@capacitor/preferences';
import {applyMutation,emptyState,migrate} from './model.js';
const native=Capacitor.isNativePlatform(),KEY='phycalendar-state';
let dbPromise,queue=Promise.resolve();
function openDB(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open('phycalendar-local',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('state'))req.result.createObjectStore('state');};
  req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();dbPromise=null;};resolve(req.result);};
  req.onerror=()=>reject(Error('本地存储无法打开。请勿使用无痕模式，并检查磁盘空间。'));
  req.onblocked=()=>reject(Error('请关闭其他订阅日历窗口后重新打开。'));
 });return dbPromise;
}
async function browserTransaction(path,b){
 const db=await openDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('state',path?'readwrite':'readonly'),store=tx.objectStore('state');let result,problem;
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(problem||Error('本地写入失败，记录未保存。请检查剩余空间，导出备份后再试。'));tx.onerror=()=>{};
  const req=store.get('current');
  req.onsuccess=()=>{try{const previous=req.result,state=previous?migrate(previous):emptyState();
   if(path){result=applyMutation(state,path,b);if(previous)store.put(previous,'previous');store.put(result,'current');}else result=state;
  }catch(e){problem=e;tx.abort();}};
 });
}
async function nativeTransaction(path,b){
 const {value}=await Preferences.get({key:KEY});const state=value?migrate(JSON.parse(value)):emptyState();
 if(!path)return state;
 const result=applyMutation(state,path,b);
 if(value)await Preferences.set({key:KEY+'-previous',value});
 await Preferences.set({key:KEY,value:JSON.stringify(result)});return result;
}
export function localRequest(path,b){
 const run=()=>native?nativeTransaction(path,b):browserTransaction(path,b);
 if(path){const result=queue.then(run);queue=result.catch(()=>{});return result;}return queue.then(run);
}
export async function requestPersistence(){
 if(!native&&navigator.storage?.persist)try{return await navigator.storage.persist();}catch{}return false;
}
