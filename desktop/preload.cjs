const {contextBridge}=require('electron');
contextBridge.exposeInMainWorld('electronApp',true);
