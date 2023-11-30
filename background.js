class Server {
  constructor() {
    this.observers = [];
  }

  subscribe(fn) {
    this.observers.push(fn);
  }

  unsubscribe(fn) {
    this.observers = this.observers.filter(observer => observer !== fn);
  }

  notify(data) {
    this.observers.forEach(observer => observer(data));
  }
}


class System {
  constructor(server) {
    this.server = server;
    this.data = {};

    this.server.subscribe(this.handleUpdate.bind(this));
  }

  handleUpdate(changeObject) {
    const { action, key, value } = changeObject;

    if (action === 'add' || action === 'update') {
      this.data[key] = value;
    }

    if (action === 'delete') {
      delete this.data[key];
    }
  }

  setItem(key, value) {
    this.server.notify({
      action: 'add',
      key: key,
      value: value,
    });
  }

  getItem(key) {
    return this.data[key];
  }

  removeItem(key) {
    this.server.notify({
      action: 'delete',
      key: key,
    });
  }
}

function test() {
  const server = new Server();
  const browser1 = new System(server);
  const browser2 = new System(server);

  browser1.setItem('key-1', 1);
  console.log(browser2.getItem('key-1')); // returns nothing
  browser2.syncNow();
  console.log(browser2.getItem('key-1')); // returns 1
}


document.addEventListener('DOMContentLoaded', test);











class Tab {
  constructor(id, url) {
    this.id = id;
    this.tabCloudId = generateId();
    this.url = url;
    this.lastEdited = new Date().getTime();
    this.index = null;
  }
}

class Session {
  constructor(id) {
    this.id = id;
    this.sessionCloudId = generateId();
    this.tabs = [];
  }

  // Method to add a tab to this session.
  addTab(id, url) {
    let tab = new Tab(id, url);
    tab.index = this.tabs.length;
    this.tabs.push(tab);
  }

  // Method to remove a tab from this session.
  removeTab(tabId) {
    let tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1) {
      this.tabs.splice(tabIndex, 1);
      this.updateIndex();
    }
  }

  // Method to update the URL of a tab in this session.
  updateTab(tabId, newUrl) {
    let tab = this.tabs.find(tab => tab.id === tabId);
    if (tab) {
      tab.url = newUrl;
      tab.lastEdited = new Date().getTime();
    }
  }

  // Method to change the index of a tab in this session.
  changeTabIndex(tabId, newIndex) {
    let tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex !== -1 && newIndex >= 0 && newIndex < this.tabs.length) {
      let tab = this.tabs[tabIndex];
      this.tabs.splice(tabIndex, 1); 
      this.tabs.splice(newIndex, 0, tab); 
      this.updateIndex();
    }
  }
 
  // Helper method to update index of all tabs after a remove or change index operation.
  updateIndex() {
    for(let i=0; i < this.tabs.length; i++){
      this.tabs[i].index = i;
    }
  }
}











const tabSessionManager = {

  async saveCurrentSession(name) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');
    if (currentSessionId) return;

    const newSessionId = generateId();
    const tabs = await tabsAPI.getTabs(currentWindow.id);
    const session = { id: newSessionId, name: name, tabs: tabs };
  
    await storageAPI.setSession(newSessionId, session);
    browser.sessions.setWindowValue(currentWindow.id, 'sessionId', newSessionId);  
  },

  async restoreSessionAsNewWindow(sessionId) {
    const session = await storageAPI.getSession(sessionId);
    if (!session) return;

    await removeListeners();
    const newWindow = await tabsAPI.openTabsInNewWindow(session.tabs);
    await browser.sessions.setWindowValue(newWindow.id, 'sessionId', sessionId);
    await addListeners();
  },

  async updateSession(windowId) {
    const sessionId = await browser.sessions.getWindowValue(windowId, 'sessionId');
    if (!sessionId) {
      console.log(`Window ${windowId} is not a saved session`);
      return;
    }

    const session = await storageAPI.getSession(sessionId);
    if(!session){
      console.log(`No session found with id: ${sessionId}`);
      return;
    }
    
    session.tabs = await tabsAPI.getTabs(windowId);
    await storageAPI.setSession(sessionId, session);
    console.log(`Set tabs in ${session.name} too: ${session.tabs.map(({ url }) => url )}`)
  }
}

const tabsAPI = {

  async getTabs(windowId) {
    const tabs = await browser.tabs.query({ windowId: windowId });
    return tabs.map(({ url, title }) => ({ url, title }));
  },

  async closeTabs(tabs) {
    const tabIds = tabs.map(({ id }) => id);
    await browser.tabs.remove(tabIds);
  },

  async openTabs(tabs, windowId) {
    await tabs.map(({ url }) => browser.tabs.create({ url: url, windowId: windowId }));
  },

  async openTabsInNewWindow(tabs) {
    return await browser.windows.create({ url: tabs.map(({ url }) => url) });
  }
}

// Utils
const syncStorage = browser.storage.local;
const localStorage = browser.storage.local;
const storageAPI = {

  async getSession(sessionId) {
    let result = await syncStorage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await syncStorage.set({ [`session-${sessionId}`]: session });
  },

  async getDeviceId() {
    let result = await localStorage.get('deviceId');
    let deviceId = result['deviceId'];
    if (deviceId) {
      return deviceId;
    } else {
      deviceId = generateId();
      localStorage.set({ 'deviceId': session });
    }
  }
  /*
  async get(key) {
    let result = await storage.get(key);
    return result[key];
  },

  async set(key, value) {
    await storage.set({ [key]: value });
  },

  async remove(key) {
    await storage.remove(key);
  },

  async getList(key) {
    let result = await this.get(key);
    return result || [];
  },

  async addToList(key, value) {
    let list = [];
    list = await this.getList(key);
    list.push(value);
    await this.set(key, list);
  },

  async removeFromList(key, value) {
    let list = await this.getList(key);
    let index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
      await this.set(key, list);
    }
  }
  */
}

function generateId() {
  return new Date().getTime();
}

async function onUrlUpdated(details) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if(!listenersActive) {
    console.log('!onUrlUpdated: listeners inactive');
    return;
  }
  if(details.transitionType === 'auto_subframe') {
    //console.log('!onUrlUpdated: auto_subframe');
    return;
  }
  if(details.transitionType === 'reload') {
    //console.log('!onUrlUpdated: reload');
    //return;
  }
  if(details.frameId !== 0) {
    //console.log('!onUrlUpdated: details.frameId !== 0');
    return;
  }
  const tabInfo = await browser.tabs.get(details.tabId);
  console.log(`onUrlUpdated: Tab ${details.tabId} in window ${tabInfo.windowId}: ${tabInfo.url}`);
  tabSessionManager.updateSession(tabInfo.windowId);
}

async function onRemoved(tabId, removeInfo) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if(listenersActive) {
    if(removeInfo.isWindowClosing) {
      console.log('window closed: !onRemoved');
    } else {
      console.log('onRemoved');
      setTimeout(() => {tabSessionManager.updateSession(removeInfo.windowId);}, 110);
    }
  } else {
    console.log('listeners inactive: !onRemoved');
  }
}

async function onMoved(tabId, moveInfo) {
  console.log('onMoved');
  tabSessionManager.updateSession(moveInfo.windowId);
}

async function onAttached(tabId, attachInfo) {
  console.log('onAttached');
  tabSessionManager.updateSession(attachInfo.newWindowId);
}

async function onDetached(tabId, detachInfo) {
  console.log('onDetached');
  tabSessionManager.updateSession(detachInfo.oldWindowId);
}

async function addListeners() {
  //console.log('activating listeners');
  await browser.storage.local.set({'listenersActive': true});
}

async function removeListeners() {
  //console.log('deactivating listeners');
  await browser.storage.local.set({'listenersActive': false});
}

browser.webNavigation.onCommitted.addListener(onUrlUpdated);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onMoved.addListener(onMoved);
browser.tabs.onAttached.addListener(onAttached);
browser.tabs.onDetached.addListener(onDetached);
document.addEventListener('DOMContentLoaded', addListeners);





function logStorageChange(changes, area) {
  const changedItems = Object.keys(changes);

  for (const item of changedItems) {
    console.log(`${item} has changed:`);
    console.log("Old value: ", changes[item].oldValue);
    console.log("New value: ", changes[item].newValue);
  }
}

//browser.storage.onChanged.addListener(logStorageChange);






// Message passing
let port;
browser.runtime.onConnect.addListener(connected);

function connected(p) {
  port = p;
  port.onMessage.addListener(onMessage);
}

const ACTIONS = {
  async saveSession(sessionName) {
    await tabSessionManager.saveCurrentSession(sessionName);
    CALLBACKS.saveSession(sessionName);
  },
  restoreSession(id) {
    tabSessionManager.restoreSessionAsNewWindow(id);
  },
};

function onMessage(message) {
  try {
    ACTIONS[message.action](message.content);
  } catch(error) {
    console.error(`Failed to execute action: ${error}`);
  }
}

const CALLBACKS = {
  saveSession() {
    sendCallback('saveSession');
  },
};

function sendCallback(action, content) {
  try {
    port.postMessage({ action: action, content: content });
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}


/*

Step 1: Handle Changes on a Device

    Listen for any changes on the device (like the user updates, deletes, or adds new data).
    Once a change is detected on the device (Device A), convert these changes into a format that can be stored and implemented by other devices (like a list of changed objects/fields, and the new data).
    Store these changes in the sync storage area using Mozilla's sync storage API, essentially pushing the changes to the cloud.

Step 2: Sync Changes to Other Devices

    On each other device (Device B, C, ...), listen for any changes to the sync storage area.
    When a change is detected in the storage, apply these changes to the local data on these devices.

Step 3: Ensure All Devices are Synced

    Each device needs some way of indicating that it has successfully synced the changes. This can be done in a few ways:
        Design the system so each device checks in with the sync storage when it starts up and after implementing changes, indicating that it's up to date. This might involve storing some kind of 'last synced' timestamp or change ID.
        Alternatively, changes could be kept in the storage area and removed automatically after some period of time, under the assumption that all devices will have had a chance to sync by this time. However, this is more risky as some devices might miss changes.

Step 4: Clearing Synced Changes

    Before clearing any changes from the sync storage, you must make sure all devices have implemented these changes.
    You can determine this by checking the 'last synced' timestamps or change IDs we stored earlier. If all devices have a 'last synced' value that's later than the time a change was made, you're safe to remove that change from the storage.
    If a device hasn't synced yet, you must keep the change in the storage until that device is updated.

*/