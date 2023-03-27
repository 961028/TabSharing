const sessions = new Map();

function generateTemporaryName() {
  const timestamp = new Date().toISOString();
  return `Session_${timestamp}`;
}

async function saveSession(sessionName, tabs) {
  const session = { name: sessionName, tabs: tabs };
  sessions.set(sessionName, session);
  return session;
}

async function getSession(sessionName) {
  return sessions.get(sessionName);
}

async function getSessions() {
  return Array.from(sessions.values());
}

async function deleteSession(sessionName) {
  return sessions.delete(sessionName);
}

function updateTabInSession(sessionName, tabId, updatedProperties) {
  const session = sessions.get(sessionName);
  if (session) {
    const tabIndex = session.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex !== -1) {
      session.tabs[tabIndex] = { ...session.tabs[tabIndex], ...updatedProperties };
    }
  }
}

function removeTabFromSession(sessionName, tabId) {
  const session = sessions.get(sessionName);
  if (session) {
    session.tabs = session.tabs.filter((tab) => tab.id !== tabId);
  }
}

browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'saveSession') {
    const { sessionName, tabs } = message;
    return saveSession(sessionName, tabs);
  } else if (message.type === 'getSession') {
    return getSession(message.sessionName);
  } else if (message.type === 'deleteSession') {
    return deleteSession(message.sessionName);
  } else if (message.type === 'getSessions') {
    return getSessions();
  }
});

browser.tabs.onCreated.addListener(async (tab) => {
  const currentSession = await getSession("current");
  currentSession.tabs.push(tab);
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const currentSession = await getSession("current");
  updateTabInSession(currentSession.name, tabId, changeInfo);
});

browser.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const currentSession = await getSession("current");
  removeTabFromSession(currentSession.name, tabId);
});