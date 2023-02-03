async function simplifyTab(tab) {
    return { title: tab.title, url: tab.url };
}

/**
* Saves the current window session.
* @param {string} sessionName The name of the session.
*/
async function saveSession(sessionName) {

    let sessions = await browser.storage.local.get() || {};
    sessions.forEach(session => {
        if(sessionName === session) return;
    });

    let tabs = await browser.tabs.query({ currentWindow: true });
    let simpleTabs;
    tabs.forEach(tab => {
        let simpleTab = simplifyTab(tab);
        simpleTabs.push(simpleTab);
    });

    await browser.storage.local.set(sessionName, simpleTabs);
    
    let currentWindow = await browser.windows.getLastFocused();
    await browser.sessions.setWindowValue(currentWindow.id, 'currentSession', sessionName);

    browser.runtime.sendMessage({type: 'displayTabs', tabs: simpleTabs});
    browser.runtime.sendMessage({type: 'displaySessions', sessions: sessions, highlightedSession: sessionName});
  }