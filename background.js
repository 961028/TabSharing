const tabSessionManager = {

  async saveCurrentSession(name) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');
    if(currentSessionId) return;

    const newSessionId = this.generateId();
    const tabs = await tabsAPI.getTabs(currentWindow.id); // could optimize with currentwindow
    const session = {id: newSessionId, name: name, tabs: tabs};
  
    let sessions = await storageAPI.getList('sessions');
    sessions.push(session);
    await storageAPI.set('sessions', sessions);
    browser.sessions.setWindowValue(currentWindow.id, 'sessionId', newSessionId);
  },

  async restoreSession(id) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');
    if(currentSessionId === id) return;

    const session = await this.findSessionById(id);
    if (!session) return;

    const currentTabs = await tabsAPI.getTabs(currentWindow.id);

    await removeListeners();
    await tabsAPI.openTabs(session.tabs);
    await tabsAPI.closeTabs(currentTabs);
    await addListeners();

    browser.sessions.setWindowValue(currentWindow.id, 'sessionId', id);
  },

  async updateSession(windowId) {
    const sessionId = await browser.sessions.getWindowValue(windowId, 'sessionId');
    if (!sessionId) {
      console.log(`session id for window ${windowId} is ${sessionId}`);
      return;
    }

    const sessions = await storageAPI.getList('sessions');
    const session = await sessions.find(session => session.id === sessionId);
    session.tabs = await tabsAPI.getTabs(windowId);
    await storageAPI.set('sessions', sessions);
  },

  async findSessionById(id) {
    const sessions = await storageAPI.getList('sessions');
    return sessions.find(session => session.id === id);
  },

  generateId() {
    return Date.now().toString(36);
  },
}

const tabsAPI = {

  async getTabs(windowId) {
    const tabs = await browser.tabs.query({windowId: windowId});
    return tabs.map(({url, title, id}) => ({url, title, id}));
  },

  async closeTabs(tabs) {
    const tabIds = tabs.map(({id}) => id);
    await browser.tabs.remove(tabIds);
  },

  async openTabs(tabs) {
    tabs.map(({url}) => browser.tabs.create({url}));
  }
}

const storage = browser.storage.sync;
const storageAPI = {

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
}



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
    tabSessionManager.restoreSession(id);
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


async function onRemoved(tabId, removeInfo) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if(listenersActive) {
    if(removeInfo.isWindowClosing) {
      console.log('window closed: !onRemoved')
    } else {
      console.log('onRemoved');
      tabSessionManager.updateSession(removeInfo.windowId);
    }
  } else {
    console.log('listeners inactive: !onRemoved');
  }
}

async function onUrlUpdated(tabId, changeInfo, tab) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if(listenersActive) {
    console.log('onUrlUpdated');
    console.log(`Tab ${tabId} in window ${tab.windowId}: ${tab.url}`);
    tabSessionManager.updateSession(tab.windowId);
  } else {
    console.log('listeners inactive: !onUrlUpdated');
  }
}

/*
async function onUrlUpdated(details) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if(listenersActive) {
    if(details.transitionType === "auto_subframe") {
      console.log("auto_subframe");
      return;
    } else {
      console.log('onUrlUpdated');
      console.log(`Tab: ${details.tabId}, ${details.transitionType}, ${details.url}`);
      tabSessionManager.updateSession();
    }
  } else {
    console.log('listeners inactive: !onUrlUpdated');
  }
}
*/

async function onMoved() {
  console.log('onMoved');
  //tabSessionManager.updateSession();
}

async function addListeners() {
  console.log('activating listeners');
  await browser.storage.local.set({'listenersActive': true});
}

async function removeListeners() {
  console.log('deactivating listeners');
  await browser.storage.local.set({'listenersActive': false});
}

//browser.webNavigation.onCommitted.addListener(onUrlUpdated);
browser.tabs.onUpdated.addListener(onUrlUpdated, {properties: ["url"]});
browser.tabs.onMoved.addListener(onMoved);
browser.tabs.onRemoved.addListener(onRemoved);
document.addEventListener('DOMContentLoaded', addListeners);