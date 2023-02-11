/* ---------------------------------- GET & SET ---------------------------------- */

async function get(key) {
    let result = await browser.storage.local.get(key);
    return result.key;
}

async function set(key, value) {
    await browser.storage.local.set({ [key]: value });
}

async function getCurrentWindowSessionName() {
    let currentWindow = await browser.windows.getLastFocused();
    let currentSession =  await browser.sessions.getWindowValue(currentWindow.id, 'session');
    return currentSession;
}

async function setCurrentWindowSessionName(sessionName) {
    let currentWindow = await browser.windows.getLastFocused();
    await browser.sessions.setWindowValue(currentWindow.id, 'session', sessionName);
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

async function findByStorageId(storageId) {
    let windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ["normal"],
    });
    for (let window of windows) {
        for (let tab of window.tabs) {
            if (getTabStorageId(tab.id) == storageId) {
                return tab.id;
            }
        }
    }
    return null;
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

function newTabCreatedLocally(tab) {
    storageListenerEnabled = false;
    let storageTab = prepareForStorage(tab);
    addToSession(storageTab);
    storageListenerEnabled = true;
}

// A new tab has been created remotely.
// Temporarily disable the listener for creating tabs.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Create the new tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for creating tabs.

function newTabCreatedRemotely(storageTab) {
    storageListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    addToSession(storageTab);
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
    removeFromStorage(storageId);
    storageListenerEnabled = true;
}

// A tab has been removed remotely.
// Temporarily disable the listener for removing tabs.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Remove the corresponding tab from the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for removing tabs.

function tabRemovedRemotely(storageId) {
    tabsRemovedListenerEnabled = false;
    storageListenerEnabled = false;
    removeFromStorage(storageId);
    let tabId = findByStorageId(storageId);
    removeFromWindow(tabId);
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
    let tabId = findByStorageId(storageId);
    updateInWindow(tabId, storageTab);
    storageListenerEnabled = true;
    tabsUpdatedListenerEnabled = true;
}

// A new session has been saved.
// Temporarily disable the listener for storage updates.
// Store the session name in the sync storage.
// Reactivate the listener for storage updates.

function sessionSaved(sessionName) {
    if (isNameTaken(sessionName)) return;
    storageListenerEnabled = false;
    storageSession = prepareForStorage(sessionName);
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

function sessionLoaded(sessionName) {
    tabsRemovedListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    storageSession = getSession(sessionName);
    replaceWindow(storageSession);
    tabsCreatedListenerEnabled = true;
    tabsRemovedListenerEnabled = true;
}

// A session has been deleted.
// Temporarily disable the listener for storage updates.
// Remove the session from the sync storage.
// Reactivate the listener for storage updates.

function sessionDeleted(sessionName) {
    storageListenerEnabled = false;
    storageSession = prepareForStorage(sessionName);
    removeSession(storageSession);
    storageListenerEnabled = true;
}

// A session has been renamed.
// Temporarily disable the listener for storage updates.
// Rename the session in the sync storage.
// Reactivate the listener for storage updates.

function sessionRenamed(oldName, newName) {
    if (isNameTaken(newName)) return;
    storageListenerEnabled = false;
    storageSession = prepareForStorage(oldName);
    renameSession(storageSession, newName);
    storageListenerEnabled = true;
}

// User starts browser.
// Turn off all listeners.
// Check 

/* ---------------------------------- TAB MODIFICATION ---------------------------------- */

async function addToSession(storageTab) {
    currentSession = await getCurrentWindowSessionName();
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

async function createInWindow(storageTab) {
    newTab = await browser.tabs.create({
        url: storageTab.url
    });
    setTabStorageId(newTab.id, storageTab.storageId);
}

async function removeFromStorage(storageId) {
    currentSession = await getCurrentWindowSessionName();
    let session = await get(currentSession);
    delete session[storageId];
}

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
        newTabCreatedLocally(tab);
    }
}

/**
 * Register tab removal event listener
 */
browser.tabs.onRemoved.addListener(tabsRemovedListener);
let tabsRemovedListenerEnabled = true;
function tabsRemovedListener(tabId, removeInfo) {
    if(tabsRemovedListenerEnabled) {
        // Todo
    }
}