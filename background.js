const storage = browser.storage.local;

async function saveCurrentSession(name) {
  const currentWindow = await getCurrentWindow();
  const currentSessionId = await getWindowSessionId(currentWindow);
  if (currentSessionId) return;

  const newSessionId = Date.now().toString(36);
  const tabs = await getTabs(currentWindow.id);
  const favicon = await getFirstFavicon(tabs);
  const session = { id: newSessionId, name: name, tabs: tabs, icon: favicon };

  await setSession(newSessionId, session);
  setWindowSessionId(currentWindow, newSessionId);
}

async function restoreSession(sessionId) {
  const currentWindow = await getCurrentWindow();
  const currentSessionId = await getWindowSessionId(currentWindow);

  if (currentSessionId === sessionId) return;

  const session = await getSession(sessionId);
  if (!session) return;
  
  const currentTabs = await getTabs(currentWindow.id);

  await removeListeners();
  await openTabs(session.tabs);
  await closeTabs(currentTabs);
  await addListeners();

  setWindowSessionId(currentWindow, sessionId);
}

async function restoreSessionAsNewWindow(sessionId) {
  const session = await getSession(sessionId);
  if (!session) return;

  await removeListeners();
  const newWindow = await openTabsInNewWindow(session.tabs);
  await browser.sessions.setWindowValue(newWindow.id, 'sessionId', sessionId);
  await addListeners();
}

async function updateSession(windowId) {
  const sessionId = await browser.sessions.getWindowValue(windowId, 'sessionId');
  if (!sessionId) {
    console.log(`Window ${windowId} is not a saved session`);
    return;
  }

  const session = await getSession(sessionId);
  if (!session){
    console.log(`No session found with id: ${sessionId}`);
    return;
  }
  
  session.tabs = await getTabs(windowId);
  await setSession(sessionId, session);
  console.log(`Set tabs in ${session.name} too: ${session.tabs.map(({ url }) => url )}`)
}

// --------------------------------------------
//                  Storage
// --------------------------------------------

async function getSession(sessionId) {
  const result = await storage.get(`session-${sessionId}`);
  return result[`session-${sessionId}`];
}

async function setSession(sessionId, session) {
  await storage.set({ [`session-${sessionId}`]: session });
}

async function renameSession(sessionId, newName) {
  const session = await getSession(sessionId);
  session.name = newName;
  await setSession(sessionId, session);
}

async function removeSession(sessionId) {
  await storage.remove(`session-${sessionId}`);
  const allWindows = await browser.windows.getAll();
  for (const window of allWindows) {
    const windowSessionId = await getWindowSessionId(window);
    if (windowSessionId === sessionId) removeWindowSessionId(window);
  }
}

// --------------------------------------------
//                    Tabs
// --------------------------------------------
async function getTabs(windowId) {
  const tabs = await browser.tabs.query({ windowId: windowId });
  return tabs.map(({ id, url, title, favIconUrl }) => ({ id, url, title, favIconUrl }));
}

async function closeTabs(tabs) {
  console.log(tabs)
  const tabIds = tabs.map(({ id }) => id);
  await browser.tabs.remove(tabIds);
}

async function openTabs(tabs, windowId) {
  await tabs.map(({ url }) => browser.tabs.create({ url: url, windowId: windowId }));
}

async function openTabsInNewWindow(tabs) {
  return await browser.windows.create({ url: tabs.map(({ url }) => url) });
}

async function getAllFavicons(sessionId) {
  const window = getSession(sessionId);
  const tabs = getTabs(window.id);
  let favicons = [];
  for (const tab of tabs) {
    const favIconUrl = await tab.favIconUrl;
    if (favIconUrl) {
      if (favIconUrl !== '') {
        favicons.push(favIconUrl);
      }
    }
  }
  return favicons;
}

async function getFirstFavicon(tabs) {
  for (const tab of tabs) {
    const favIconUrl = await tab.favIconUrl;
    if (favIconUrl) {
      if (favIconUrl !== '') {
        return favIconUrl;
      }
    }
  }
  return 'session.png';
}

// --------------------------------------------
//                  Windows
// --------------------------------------------
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

// --------------------------------------------
//                 Listeners
// --------------------------------------------
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
  updateSession(tabInfo.windowId);
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
    updateSession(removeInfo.windowId);
  }, 120);
}

async function onMoved(tabId, moveInfo) {
  console.log('onMoved');
  updateSession(moveInfo.windowId);
}

async function onAttached(tabId, attachInfo) {
  console.log('onAttached');
  updateSession(attachInfo.newWindowId);
}

async function onDetached(tabId, detachInfo) {
  console.log('onDetached');
  updateSession(detachInfo.oldWindowId);
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