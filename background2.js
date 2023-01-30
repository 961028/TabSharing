const currentSession = 'CurrentSession';
const sessionsList = 'Sessions';

const local = {};

function set(key, value) {
  //const data = { [key]: value };
  //browser.storage.sync.set(data);
  local[key] = value;
}

async function get(key) {
  //const result = await browser.storage.sync.get(key);
  //return result[key];
  return local[key];
}

async function createSyncTab(session, title, url) {
    let tabs = await get(session) || [];
    let storageId = Date.now().toString();
    let tab = { id: storageId, title: title, url: url };
    tabs.push(tab);
    set(session, tabs);
    return storageId;
}

async function removeSyncTab(session, storageId) {
    let tabs = await get(session) || [];
    tabs = await tabs.filter(tab => tab.id !== storageId);
    set(session, filteredTabs);
}

async function updateSyncTab(session, storageId, title, url) {
    let tabs = await get(session) || [];
    let tabIndex = await tabs.findIndex(tab => tab.id === storageId);
    let tab = { id: storageId, title: title, url: url };
    if (tabIndex !== -1) {
        tabs[tabIndex] = tab;
    }
    set(session, tabs);
}
