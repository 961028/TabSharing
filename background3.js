/**
* Saves the current window session.
* @param {string} sessionName The name of the session.
*/
async function saveSession(sessionName) {

    let sessions = await browser.storage.sync.get() || [];
    sessions.forEach(session => {
        if (sessionName === session) return;
    });

    let tabs = await browser.tabs.query({ currentWindow: true });
    let storageTabs;
    tabs.forEach(tab => {
        let storageTab = generateStorageTab(tab);
        storageTabs.push(storageTab);
    });

    await browser.storage.sync.set(sessionName, storageTabs);
    
    let currentWindow = await browser.windows.getLastFocused();
    await browser.sessions.setWindowValue(currentWindow.id, 'currentSession', sessionName);

    browser.runtime.sendMessage({type: 'displayTabs', tabs: storageTabs});
    browser.runtime.sendMessage({type: 'displaySessions', sessions: sessions, highlightedSession: sessionName});
}

async function storageUpdate(changes) {
    let changedItems = Object.keys(changes);

    for (const key of changedItems) {
        let currentValue = await browser.storage.sync.get(key);
        let newValue = changes[key].newValue;
        if (currentValue !== newValue) {
            await browser.storage.sync.set(key, newValue);
                    
            const newTabs = newValue.filter(tab => {
                return !(browser.storage.sync.get(tab.storageId));
            });
            
            if (newTabs.length > 0) {
                newTabs.forEach(tab => {
                    browser.tabs.create({
                        title: tab.title,
                        url: tab.url
                    });
                });
            }
        }
    }
}
browser.storage.onChanged.addListener(testingStorageUpdate);

function compareTabs(oldTabs, newTabs) {
    const created = [];
    const removed = [];
    const updated = [];
  
    for (const newTab of newTabs) {
      const oldTab = oldTabs.find(tab => tab.storageId === newTab.storageId);
      if (!oldTab) {
        created.push(newTab);
      } else if (oldTab.url !== newTab.url) {
        updated.push(newTab);
      }
    }
  
    for (const oldTab of oldTabs) {
      const newTab = newTabs.find(tab => tab.storageId === oldTab.storageId);
      if (!newTab) {
        removed.push(oldTab);
      }
    }
  
    return { created, removed, updated };
  }

async function createTabFromStorage(tab) {
    createdTab = await browser.tabs.create({
        url: tab.url
    });
    // wrong place
    browser.sessions.setTabValue(
        createdTab.id,
        'storageId',
        tab.storageId
    );      
}

async function generateStorageTab(tab) {
    let storageTab = { title: tab.title, url: tab.url };
    storageTab.storageId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return storageTab;
}