const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("kittyrace", {
  // api: () => ...
});
