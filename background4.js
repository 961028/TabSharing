/* ---------------------------------- GET & SET ---------------------------------- */

async function get(key) {
    const result = await browser.storage.local.get(key);
    return result.key;
  }

function set(key, value) {
    browser.storage.local.set({ [key]: value });
}

async function getCurrentSession() {
    let currentWindow = await browser.windows.getLastFocused();
    let currentSession =  await browser.sessions.getWindowValue(currentWindow.id, 'session');
    return currentSession;
}

async function setCurrentSession(sessionName) {
    let currentWindow = await browser.windows.getLastFocused();
    await browser.sessions.setWindowValue(currentWindow.id, 'session', sessionName);
}

/* ---------------------------------- STUFF ---------------------------------- */

function tabCreatedLocally(tab) {
    storageListenerEnabled = false;
    storageTab = prepareNewTabForStorage(tab);
    addTabToCurrentSessionStorage(storageTab);
    storageListenerEnabled = true;
}

function addTabToCurrentSessionStorage(storageTab) {
    currentSession = getCurrentSession();
    set(currentSession, storageTab);
}

// A new tab has been created remotely.
// Temporarily disable the listener for creating tabs.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Create a copy of the new tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for creating tabs.

function tabCreatedRemotely(storageTab) {
    storageListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    addTabToCurrentSessionStorage(storageTab);
    createTabFromStorage(storageTab);
    tabsCreatedListenerEnabled = true;
    storageListenerEnabled = true;
}

// A tab has been removed locally.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Reactivate the listener for storage updates.

function tabRemovedLocally(tabId) {
    storageListenerEnabled = false;
    tabsCreatedListenerEnabled = false;
    addTabToCurrentSessionStorage(storageTab);
    createTabFromStorage(storageTab);
    tabsCreatedListenerEnabled = true;
    storageListenerEnabled = true;
}

// A tab has been removed remotely.
// Temporarily disable the listener for removing tabs.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Remove the corresponding tab from the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for removing tabs.

// A tab has been updated locally.
// Temporarily disable the listener for storage updates.
// Update the corresponding tab in the sync storage.
// Reactivate the listener for storage updates.

// A tab has been updated remotely.
// Temporarily disable the listener for updating tabs.
// Temporarily disable the listener for storage updates.
// Update the corresponding tab in the sync storage.
// Update the corresponding tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for updating tabs.

// User starts browser.
// Turn off all listeners.
// Check 

/* ---------------------------------- TAB MODIFICATION ---------------------------------- */

function prepareNewTabForStorage(tab) {
    let sId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let storageTab = { title: tab.title, url: tab.url, storageId: sId };
    setTabStorageId(tab.id, sId);
    return storageTab;
}

async function createTabFromStorage(storageTab) {
    tab = await browser.tabs.create({
        url: storageTab.url
    });
    setTabStorageId(tab.id, storageTab.storageId);
}

function setTabStorageId(tabId, tabStorageId) {
    browser.sessions.setTabValue(
        tabId,
        'storageId',
        tabStorageId
    );
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
        // Todo
    }
}