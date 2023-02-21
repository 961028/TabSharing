/* ---------------------------------- GET & SET ---------------------------------- */

async function get(key) {
    let result = await browser.storage.local.get(key);
    return result.key;
}

async function set(key, value) {
    await browser.storage.local.set({ [key]: value });
}

async function getCurrentWindow() {
    return await browser.windows.getLastFocused();
}

async function getSessionIdByWindowId(windowId) {
    let currentSession = await browser.sessions.getWindowValue(windowId, 'session');
    return currentSession;
}

async function setSessionIdByWindowId(windowId, sessionId) {
    browser.sessions.setWindowValue(windowId, 'session', sessionId);
}

async function getCurrentWindowSessionId() {
    let currentWindow = await getCurrentWindow();
    let currentSession = await getSessionIdByWindowId(currentWindow.id)
    return currentSession;
}

async function setCurrentWindowSessionId(sessionId) {
    let currentWindow = await getCurrentWindow();
    await setSessionIdByWindowId(currentWindow.id, sessionId);
}

async function getTabStorageId(tabId) {
    return await browser.sessions.getTabValue(
        tabId,
        'storageId'
    );
}

async function setTabStorageId(tabId, tabStorageId) {
    await browser.sessions.setTabValue(
        tabId,
        'storageId',
        tabStorageId
    );
}

async function findWindowBySessionId(sessionId) {
    let windows = await browser.windows.getAll({
        windowTypes: ["normal"]
    });
    for (let window of windows) {
        let windowSessionId = getSessionIdByWindowId(window.id);
        if (windowSessionId == sessionId) {
            return window;
        }
    }
    return null;
}

async function findTabByStorageId(storageId) {
    let windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ["normal"]
    });
    for (let window of windows) {
        for (let tab of window.tabs) {
            if (getTabStorageId(tab.id) == storageId) {
                return tab;
            }
        }
    }
    return null;
}

/* ---------------------------------- TAB MODIFICATION ---------------------------------- */

async function addToSession(sessionId, storageTab) {
    currentSession = await getCurrentWindowSessionId();
    let session = await get(currentSession);
    session[storageTab.storageId] = storageTab;
    set(currentSession, tabs);
}

function prepareForStorage(newTab) {
    let sId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let storageTab = { title: newTab.title, url: newTab.url, storageId: sId };
    setTabStorageId(newTab.id, sId);
    return storageTab;
}

async function createInWindow(windowId, storageTab) {
    newTab = await browser.tabs.create({
        url: storageTab.url
    });
    setTabStorageId(newTab.id, storageTab.storageId);
}

async function removeFromStorage(windowId, storageId) {
    currentSession = await getCurrentWindowSessionId();
    let session = await get(currentSession);
    delete session[storageId];
}

/* ---------------------------------- STUFF ---------------------------------- */

// Window is saved by user.
// Check if session name is available, else stop.
// Temporarily disable the listener for storage updates.
// Save the session.
// Reactivate the listener for storage updates.

// A new tab has been created locally.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Reactivate the listener for storage updates.

function tabCreatedLocally(tab) {
    storageListenerEnabled = false;
    let storageTab = prepareForStorage(tab);
    addToSession(sessionId, storageTab);
    storageListenerEnabled = true;
}

// A new tab has been created remotely.
// Temporarily disable the listener for creating tabs.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Create the new tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for creating tabs.

function newTabCreatedRemotely(sessionId, storageTab) {
    storageListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    addToSession(sessionId, storageTab);
    createInWindow(storageTab);
    tabsCreatedListenerEnabled = true;
    storageListenerEnabled = true;
}

// A tab has been removed locally.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Reactivate the listener for storage updates.

function tabRemovedLocally(tabId) {
    storageListenerEnabled = false;
    let storageId = getTabStorageId(tabId);
    removeFromStorage(windowId, storageId);
    storageListenerEnabled = true;
}

// A tab has been removed remotely.
// Temporarily disable the listener for removing tabs.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Remove the corresponding tab from the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for removing tabs.

function tabRemovedRemotely(sessionId, storageId) {
    tabsRemovedListenerEnabled = false;
    storageListenerEnabled = false;
    let window = findWindowBySessionId(sessionId);
    let tab = findTabByStorageId(storageId);
    removeFromStorage(sessionId, storageId);
    removeFromWindow(windowId, tab.id);
    storageListenerEnabled = true;
    tabsRemovedListenerEnabled = true;
}

// A tab has been updated locally.
// Temporarily disable the listener for storage updates.
// Update the corresponding tab in the sync storage.
// Reactivate the listener for storage updates.

function tabUpdatedLocally(tabId) {
    storageListenerEnabled = false;
    storageId = getTabStorageId(tabId);
    storageTab = compressTab(tabId); //???
    updateSession(storageId, storageTab);
    storageListenerEnabled = true;
}

// A tab has been updated remotely.
// Temporarily disable the listener for updating tabs.
// Temporarily disable the listener for storage updates.
// Update the corresponding tab in the sync storage.
// Update the corresponding tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for updating tabs.

function tabUpdatedRemotely(storageId, storageTab) {
    tabsUpdatedListenerEnabled = false;
    storageListenerEnabled = false;
    updateSession(storageId, storageTab);
    let tabId = findTabByStorageId(storageId);
    updateInWindow(tabId, storageTab);
    storageListenerEnabled = true;
    tabsUpdatedListenerEnabled = true;
}

// A new session has been saved.
// Temporarily disable the listener for storage updates.
// Store the session name in the sync storage.
// Reactivate the listener for storage updates.

function sessionSaved(sessionId) {
    if (isIdTaken(sessionId)) return;
    storageListenerEnabled = false;
    storageSession = prepareForStorage(sessionId);
    setNewSession(storageSession);
    storageListenerEnabled = true;
}

// A session has been loaded.
// Temporarily disable the listener for removing tabs.
// Temporarily disable the listener for creating tabs.
// Retrieve the tabs from the sync storage.
// Create the tabs in the local browser.
// Reactivate the listener for creating tabs.
// Reactivate the listener for removing tabs.

function sessionLoaded(sessionId) {
    tabsRemovedListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    storageSession = getSession(sessionId);
    replaceWindow(storageSession);
    tabsCreatedListenerEnabled = true;
    tabsRemovedListenerEnabled = true;
}

// A session has been deleted.
// Temporarily disable the listener for storage updates.
// Remove the session from the sync storage.
// Reactivate the listener for storage updates.

function sessionDeleted(sessionId) {
    storageListenerEnabled = false;
    storageSession = prepareForStorage(sessionId);
    removeSession(storageSession);
    storageListenerEnabled = true;
}

// A session has been renamed.
// Temporarily disable the listener for storage updates.
// Rename the session in the sync storage.
// Reactivate the listener for storage updates.

function sessionRenamed(oldId, newId) {
    if (isIdTaken(newId)) return;
    storageListenerEnabled = false;
    storageSession = prepareForStorage(oldId);
    renameSession(storageSession, newId);
    storageListenerEnabled = true;
}

// User starts browser.
// Turn off all listeners.
// Check 

/* ---------------------------------- LISTENERS ---------------------------------- */

/**
 * Register storage event listener
 */
browser.storage.onChanged.addListener(storageListener);
let storageListenerEnabled = true;
function storageListener(changes) {
    if(storageListenerEnabled) {
        // Todo
    }
}

/**
 * Register tab update event listener
 */
browser.tabs.onUpdated.addListener(tabsUpdatedListener);
let tabsUpdatedListenerEnabled = true;
function tabsUpdatedListener(tabId, changeInfo, tabInfo) {
    if(tabsUpdatedListenerEnabled) {
        // Todo
    }
}

/**
 * Register tab creation event listener
 */
browser.tabs.onCreated.addListener(tabsCreatedListener);
let tabsCreatedListenerEnabled = true;
function tabsCreatedListener(tab) {
    if(tabsCreatedListenerEnabled) {
        tabCreatedLocally(tab);
    }
}

/**
 * Register tab removal event listener
 */
browser.tabs.onRemoved.addListener(tabsRemovedListener);
let tabsRemovedListenerEnabled = true;
function tabsRemovedListener(tabId, removeInfo) {
    if(tabsRemovedListenerEnabled) {
        tabRemovedLocally(tabId);
    }
}