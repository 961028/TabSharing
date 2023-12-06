const keys = {
  changeStorage:  'changeStorage',
  addedItems:     'addedItems',
}

class Server {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key);
  }

  setItem(key, value) {
    this.data.set(key, value);
  }
}

class System {
  constructor(server, device) {
    this.server = server;
    this.device = device;
    this.data = new Map();
  }

  setItem(key, newValue) {
    const oldValue = this.data.get(key);
    console.log(`Set ${key} on ${this.device}:`);
    let changes = {};
    changes[key] = { oldValue, newValue };
    logObject("oldValue", oldValue);
    logObject("newValue", newValue);
    this.data.set(key, newValue);
    this.notifyListeners(changes);
  }

  getItem(key) {
    if (this.data.has(key)) return this.data.get(key);
    return null;
  }
  
  syncNow() {
    console.log(`Sync: ${this.device}`);

    // Sync from server to browser
    for (let [key, value] of this.server.data.entries()) {
      logObject("Syncing from server", value);
      this.setItem(key, value);
    }

    // Sync from browser to server
    for (let [key, value] of this.data.entries()) {
      logObject("Syncing from browser", value);
      this.server.setItem(key, value);
    }
  }

  notifyListeners(changes) {
    this.logStorageChange(changes);
  }


  addItem(key, value) {
    const deviceCloudStorage = this.getItem(this.device);
    let addedItems = {};
    if (deviceCloudStorage) {
      addedItems = Object.assign({}, deviceCloudStorage[keys.addedItems]);
    }
    addedItems[key] = value;
    this.setItem(this.device, { [keys.addedItems]: addedItems });
  }

  logStorageChange(changes, area) {
    const changedItems = Object.keys(changes);
  
    for (const item of changedItems) {
      if (item === this.device) {
        console.log(`Local change on ${this.device}, do nothing.`);
      } else {
        console.log(`Logging change in ${item}, on ${this.device}`)
        const changedItem = changes[item];

        const newItems = changedItem.newValue;
        const oldItems = changedItem.oldValue;

        if (newItems && oldItems) {
          if (newItems[keys.addedItems]) {
            const newAddedItems = newItems[keys.addedItems];
            const oldAddedItems = oldItems[keys.addedItems];
            const actualAddedItems = this.getDifferences(newAddedItems, oldAddedItems);
            logObject(`ActualAddedItems`, actualAddedItems);
          }

        } else if (newItems) {
          if (newItems[keys.addedItems]) {
            const actualAddedItems = newItems[keys.addedItems]
            logObject(`ActualAddedItems`, actualAddedItems);
          }

        } else if (oldItems) {
          if (oldItems[keys.addedItems]) {
            const actualAddedItems = oldItems[keys.addedItems];
            logObject(`ActualAddedItems`, actualAddedItems);
          }
        }
      }
    }
  }

  getDifferences(newObject, oldObject) {
    var changes = {};
    Object.keys(newObject).forEach(function(key) {
      if (!oldObject.hasOwnProperty(key) || newObject[key] !== oldObject[key]) {
        changes[key] = newObject[key];
      }
    });
    return changes;
  }
}

// Test additions 
function testAddChangeSystem() {
  const env = createTestEnvironment();
  console.log('____Adding key1 on c1____');
  env.c1.addItem(env.key1, env.value1);
  env.c1.syncNow();
  //env.c1.syncNow();
  //env.c2.syncNow();
  //console.log('____Adding key2 on c1____');
  env.c1.addItem(env.key2, env.value2);
  env.c1.syncNow();
  //env.c2.syncNow();
}

// Test additions
function testAdd() {
  const env = createTestEnvironment();
  env.c1.setItem(env.key1, env.value1);
  env.c1.syncNow();
  env.c2.syncNow();
  const result = env.c2.getItem(env.key1);
  env.verify('testAdd', result, env.value1);
}

function runTests() {
  //testAdd();
  testAddChangeSystem();
  
  //console.log('Tests performed.');
}

function createTestEnvironment() {
  const server = new Server();
  const c1 = new System(server, 'c1');
  const c2 = new System(server, 'c2');

  return {
    key1: 'key-1',
    key2: 'key-2',
    value1: 1,
    value2: 2,
    c1: c1,
    c2: c2,
    verify: function(testCase, result, expectedValue) {
      if (result !== expectedValue) {
        throw new Error(`Test failed in: ${testCase} - Expected value: ${expectedValue}, but got ${result}`);
      }
    },
  };
}

runTests();











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


function logObject(description, object) {
  if(object) {
    console.log(description, JSON.parse(JSON.stringify(object)));
  } else {
    console.log(description, object);
  }
}

function logSpace() {
  console.log("__________")
}