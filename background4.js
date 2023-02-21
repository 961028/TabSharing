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

async function getWindowSessionId(windowId) {
    let currentSession = await browser.sessions.getWindowValue(windowId, 'session');
    return currentSession;
}

async function setWindowSessionId(windowId, sessionId) {
    await browser.sessions.setWindowValue(windowId, 'session', sessionId);
}

async function getTabStorageId(tabId) {
    return await browser.sessions.getTabValue(tabId, 'storageTabId'
    );
}

async function setTabStorageId(tabId, tabStorageId) {
    await browser.sessions.setTabValue(tabId, 'storageTabId', tabStorageId
    );
}

async function findWindowBySessionId(sessionId) {
    let windows = await browser.windows.getAll({
        windowTypes: ["normal"]
    });
    for (let window of windows) {
        let windowSessionId = getWindowSessionId(window.id);
        if (windowSessionId == sessionId) {
            return window;
        }
    }
    return null;
}

async function findTabByStorageId(storageTabId) {
    let windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ["normal"]
    });
    for (let window of windows) {
        for (let tab of window.tabs) {
            if (getTabStorageId(tab.id) == storageTabId) {
                return tab;
            }
        }
    }
    return null;
}

/* ---------------------------------- TAB MODIFICATION ---------------------------------- */

function prepareNewTabForStorage(newTab) {
    let sId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let storageTab = { title: newTab.title, url: newTab.url, storageTabId: sId };
    setTabStorageId(newTab.id, sId);
    return storageTab;
}

async function addStorageTabToSessionStorage(sessionId, storageTab) {
    let session = await get(sessionId);
    session[storageTab.storageTabId] = storageTab;
    set(sessionId, tabs);
}

async function removeStorageTabFromSessionStorage(sessionId, storageTabId) {
    let session = await get(sessionId);
    delete session[storageTabId];
}

async function createStorageTabInWindow(windowId, storageTab) {
    newTab = await browser.tabs.create({
        url: storageTab.url
    });
    setTabStorageId(newTab.id, storageTab.storageTabId);
}

/* ---------------------------------- STUFF ---------------------------------- */

// A new tab has been created locally.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Reactivate the listener for storage updates.

function tabCreatedLocally(tab) {
    storageListenerEnabled = false;
    let storageTab = prepareNewTabForStorage(tab);
    addStorageTabToSessionStorage(sessionId, storageTab);
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
    addStorageTabToSessionStorage(sessionId, storageTab);
    createStorageTabInWindow(storageTab);
    tabsCreatedListenerEnabled = true;
    storageListenerEnabled = true;
}

// A tab has been removed locally.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Reactivate the listener for storage updates.

function tabRemovedLocally(tabId) {
    storageListenerEnabled = false;
    let storageTabId = getTabStorageId(tabId);
    removeStorageTabFromSessionStorage(windowId, storageTabId);
    storageListenerEnabled = true;
}

// A tab has been removed remotely.
// Temporarily disable the listener for removing tabs.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Remove the corresponding tab from the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for removing tabs.

function tabRemovedRemotely(sessionId, storageTabId) {
    tabsRemovedListenerEnabled = false;
    storageListenerEnabled = false;
    let window = findWindowBySessionId(sessionId);
    let tab = findTabByStorageId(storageTabId);
    removeStorageTabFromSessionStorage(sessionId, storageTabId);
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
    storageTabId = getTabStorageId(tabId);
    storageTab = compressTab(tabId); //???
    updateSession(storageTabId, storageTab);
    storageListenerEnabled = true;
}

// A tab has been updated remotely.
// Temporarily disable the listener for updating tabs.
// Temporarily disable the listener for storage updates.
// Update the corresponding tab in the sync storage.
// Update the corresponding tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for updating tabs.

function tabUpdatedRemotely(storageTabId, storageTab) {
    tabsUpdatedListenerEnabled = false;
    storageListenerEnabled = false;
    updateSession(storageTabId, storageTab);
    let tabId = findTabByStorageId(storageTabId);
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
    storageSession = prepareNewTabForStorage(sessionId);
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
    storageSession = prepareNewTabForStorage(sessionId);
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
    storageSession = prepareNewTabForStorage(oldId);
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