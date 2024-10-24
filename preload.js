// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  onClickThroughChanged: (callback) => {
    ipcRenderer.on('click-through-changed', (event, isClickThrough) => {
      callback(isClickThrough)
    })
  }
})