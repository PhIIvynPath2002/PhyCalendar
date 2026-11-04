const {app,BrowserWindow,protocol,net,session}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
app.setName('PhyCalendar');
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
if(!app.requestSingleInstanceLock())app.quit();
let window;
app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
app.whenReady().then(()=>{
 const base=path.join(__dirname,'../dist');
 protocol.handle('app',request=>{
  const url=new URL(request.url),name=decodeURIComponent(url.pathname||'/index.html');
  const file=path.resolve(base,'.'+(name==='/'?'/index.html':name));
  if(url.host!=='phycalendar'||!file.startsWith(base+path.sep))return new Response('Not found',{status:404});
  return net.fetch(pathToFileURL(file).toString());
 });
 session.defaultSession.setPermissionRequestHandler((_web,_permission,callback)=>callback(false));
 function create(){
  window=new BrowserWindow({width:1320,height:950,minWidth:360,minHeight:640,title:'个人订阅日历',backgroundColor:'#f6f7f4',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('app://phycalendar/'))event.preventDefault();});
  window.loadURL('app://phycalendar/index.html');
  window.on('closed',()=>window=null);
 }
 create();app.on('activate',()=>{if(!window)create();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
