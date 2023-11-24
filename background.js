const tabSessionManager = {

  async saveCurrentSession(name) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');
    if(currentSessionId) return;

    const newSessionId = Date.now().toString(36);
    const tabs = await tabsAPI.getTabs(currentWindow.id);
    const session = { id: newSessionId, name: name, tabs: tabs };
  
    await storageAPI.setSession(newSessionId, session);
    browser.sessions.setWindowValue(currentWindow.id, 'sessionId', newSessionId);  
  },

  async restoreSession(sessionId) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');

    if(currentSessionId === sessionId) return;

    const session = await storageAPI.getSession(sessionId);
    if (!session) return;
    
    const currentTabs = await tabsAPI.getTabs(currentWindow.id);

    await removeListeners();
    await tabsAPI.openTabs(session.tabs);
    await tabsAPI.closeTabs(currentTabs);
    await addListeners();

    browser.sessions.setWindowValue(currentWindow.id, 'sessionId', sessionId);
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
const storage = browser.storage.local;
const storageAPI = {

  async getSession(sessionId) {
    let result = await storage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await storage.set({ [`session-${sessionId}`]: session });
  },
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