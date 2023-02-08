function tabCreatedLocally(tab) {
    disableStorageListener();
    tab = prepareNewTabForStorage(tab);
    addTabToSession(tab);
    enableStorageListener();
}

function addTabToSession(tab) {
    
}

// A new tab has been created remotely.
// Temporarily disable the listener for creating tabs.
// Temporarily disable the listener for storage updates.
// Store the new tab in the sync storage.
// Create a copy of the new tab in the local browser.
// Reactivate the listener for storage updates.
// Reactivate the listener for creating tabs.

// A tab has been removed locally.
// Temporarily disable the listener for storage updates.
// Remove the tab from the sync storage.
// Reactivate the listener for storage updates.

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

function prepareNewTabForStorage(tab) {
    let sId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let storageReadyTab = { title: tab.title, url: tab.url, storageId: sId };
    browser.sessions.setTabValue(
        tab.id,
        'storageId',
        sId
    );
    return storageReadyTab;
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
function disableStorageListener() {storageListenerEnabled = false}
function enableStorageListener() {storageListenerEnabled = true}

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
function disableTabsUpdatedListener() {tabsUpdatedListenerEnabled = false}
function enableTabsUpdatedListener() {tabsUpdatedListenerEnabled = true}

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
function disableTabsCreatedListener() {tabsCreatedListenerEnabled = false}
function enableTabsCreatedListener() {tabsCreatedListenerEnabled = true}

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
function disableTabsRemovedListener() {tabsRemovedListenerEnabled = false}
function enableTabsRemovedListener() {tabsRemovedListenerEnabled = true}