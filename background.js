const tabSessionManager = {

  async saveCurrentSession(name) {
    const currentWindow = await getCurrentWindow();
    const currentSessionId = await getWindowSessionId(currentWindow);
    if (currentSessionId) return;

    const newSessionId = Date.now().toString(36);
    const tabs = await tabsAPI.getTabs(currentWindow.id);
    const favicon = 'session.png';
    const session = { id: newSessionId, name: name, tabs: tabs, icon: favicon };
  
    await storageAPI.setSession(newSessionId, session);
    setWindowSessionId(currentWindow, newSessionId);  
  },

  async restoreSession(sessionId) {
    const currentWindow = await getCurrentWindow();
    const currentSessionId = await getWindowSessionId(currentWindow);

    if (currentSessionId === sessionId) return;

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
    if (!session){
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
    const result = await storage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await storage.set({ [`session-${sessionId}`]: session });
  },
}

async function renameSession(sessionId, newName) {
  const session = await storageAPI.getSession(sessionId);
  session.name = newName;
  await storageAPI.setSession(sessionId, session);
}

async function removeSession(sessionId) {
  await storage.remove(`session-${sessionId}`);
  const allWindows = await browser.windows.getAll();
  for (const window of allWindows) {
    const windowSessionId = await getWindowSessionId(window);
    if (windowSessionId === sessionId) removeWindowSessionId(window);
  }
}

// Window SessionId Storage

function getWindowSessionId(window) {
  return browser.sessions.getWindowValue(window.id, 'sessionId');
}

function setWindowSessionId(window, newSessionId) {
  browser.sessions.setWindowValue(window.id, 'sessionId', newSessionId);
}

function removeWindowSessionId(window) {
  browser.sessions.removeWindowValue(window.id, 'sessionId');
}

async function getCurrentWindow() {
  const currentWindow = await browser.windows.getLastFocused();
  return currentWindow;
}

async function getCurrentWindowSessionId() {
  const currentWindow = await getCurrentWindow();
  return await getWindowSessionId(currentWindow);
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
  let {listenersActive} = await browser.storage.session.get('listenersActive');
  if (!listenersActive) {
    console.log('!onUrlUpdated: listeners inactive');
    return;
  }
  if (details.transitionType === 'auto_subframe') {
    //console.log('!onUrlUpdated: auto_subframe');
    return;
  }
  if (details.transitionType === 'reload') {
    //console.log('!onUrlUpdated: reload');
    return;
  }
  if (details.frameId !== 0) {
    //console.log('!onUrlUpdated: details.frameId !== 0');
    return;
  }
  const tabInfo = await browser.tabs.get(details.tabId);
  console.log(`onUrlUpdated: Tab ${details.tabId} in window ${tabInfo.windowId}: ${tabInfo.url}`);
  tabSessionManager.updateSession(tabInfo.windowId);
}

async function onRemoved(tabId, removeInfo) {
  let {listenersActive} = await browser.storage.local.get('listenersActive');
  if (!listenersActive) {
    console.log('listeners inactive: !onRemoved');
    return;
  }
  if (removeInfo.isWindowClosing) {
    console.log('window closed: !onRemoved');
    return;
  }
  console.log('onRemoved');
  setTimeout( () => {
    tabSessionManager.updateSession(removeInfo.windowId);
  }, 120);
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
  await browser.storage.session.set({'listenersActive': true});
}

async function removeListeners() {
  //console.log('deactivating listeners');
  await browser.storage.session.set({'listenersActive': false});
}

browser.webNavigation.onCommitted.addListener(onUrlUpdated);
browser.tabs.onRemoved.addListener(onRemoved);
browser.tabs.onMoved.addListener(onMoved);
browser.tabs.onAttached.addListener(onAttached);
browser.tabs.onDetached.addListener(onDetached);
document.addEventListener('DOMContentLoaded', addListeners);

/*
function logStorageChange(changes, area) {
  const changedItems = Object.keys(changes);

  for (const item of changedItems) {
    console.log(`${item} has changed:`);
    console.log("Old value: ", changes[item].oldValue);
    console.log("New value: ", changes[item].newValue);
  }
}
*/

//browser.storage.onChanged.addListener(logStorageChange);