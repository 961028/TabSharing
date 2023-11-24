const tabSessionManager = {

  async saveCurrentSession(name) {
    const currentWindow = await browser.windows.getLastFocused();
    const currentSessionId = await browser.sessions.getWindowValue(currentWindow.id, 'sessionId');
    if(currentSessionId) return;

    const newSessionId = this.generateId();
    const tabs = await tabsAPI.getTabs(currentWindow.id);
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

  async restoreSessionAsNewWindow(id) {
    const session = await this.findSessionById(id);
    if (!session) return;

    await removeListeners();
    const newWindow = await tabsAPI.openTabsInNewWindow(session.tabs);
    await browser.sessions.setWindowValue(newWindow.id, 'sessionId', id);
    await addListeners();
  },

  async updateSession(windowId) {
    const sessionId = await browser.sessions.getWindowValue(windowId, 'sessionId');
    if (!sessionId) {
      console.log(`session id for window ${windowId} is undefined`);
      return;
    }
    
    const sessions = await storageAPI.getList('sessions');
    const session = await sessions.find(session => session.id === sessionId);
    session.tabs = await tabsAPI.getTabs(windowId);
    await storageAPI.set('sessions', sessions);
    console.log(`set tabs in ${session.name} too: ${session.tabs.map(({ url }) => url )}`)
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
    const tabs = await browser.tabs.query({ windowId: windowId });
    console.log(tabs)
    return tabs.map(({ url, title, id }) => ({ url, title, id }));
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

const storage = browser.storage.local;
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
      setTimeout(() => {tabSessionManager.updateSession(removeInfo.windowId);}, 100);
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