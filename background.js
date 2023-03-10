const currentSession = 'CurrentSession';
const sessionsList = 'Sessions';

/**
* Sets a key/value pair in the storage.
* @param {string} key The key to set.
* @param {any} value The value to set.
*/
function set(key, value) {
  const data = { [key]: value };
  browser.storage.local.set(data);
  //local[key] = value;
}

/**
* Gets a value from the storage.
* @param {string} key The key to get.
* @returns {Promise<any>} The value.
*/
async function get(key) {
  const result = await browser.storage.local.get(key);
  return result[key];
  //return local[key];
}

/**
* Gets a list from the storage.
* @param {string} key The key to get.
* @returns {Promise<any[]>} The list.
*/
async function getList(key) {
  const value = await get(key);
  return value || [];
}

/**
* Pushes a value to a list in the storage.
* @param {string} key The key of the list.
* @param {any} value The value to push.
*/
async function push(key, value) {
  const list = await getList(key);
  list.push(value);
  set(key, list);
}

/**
* Pushes multiple values to a list in the storage.
* @param {string} key The key of the list.
* @param {any} value The values to push.
*/
async function pushMultiple(key, values) {
  const list = await getList(key);
  values.forEach(value => {
    list.push(value);
  });
  set(key, list);
}

/**
* Removes a value from a list in the storage.
* @param {string} key The key of the list.
* @param {any} value The value to remove.
*/
async function removeFromList(key, value) {
  const list = await getList(key);
  const index = list.indexOf(value);
  if (index > -1) {
    list.splice(index, 1);
    set(key, list);
  }
}

/**
* Sets the current window session.
* @param {string} name The name of the session.
*/
async function setWindowSession(name) {
  await set(currentSession, name);
}

/**
* Gets the current window session.
* @returns {Promise<string>} The name of the session.
*/
async function getCurrentSession() {
  let session = await get(currentSession);
  if (!session) {
    setWindowSession('Unnamed Session');
  }
  return session;
}

/**
* Saves the current window session.
* @param {string} sessionName The name of the session.
*/
async function saveSession(sessionName) {
  const sessions = await getList(sessionsList);
  if(sessions.includes(sessionName)) return;
  const tabs = await browser.tabs.query({ currentWindow: true });
  await set(sessionName, tabs);
  await setWindowSession(sessionName);
  //await push(sessionsList, sessionName);
  displayTabs();
  displaySessions();
}

/**
* Opens a saved session.
* @param {string} sessionName The name of the session.
*/
let isUpdating = false;
async function openSession(sessionName) {
  if (isUpdating) return;
  isUpdating = true;
  /*
  const windowSession = await getCurrentSession();
  if (!windowSession) {
    const result = confirm (
      'You are about to open a saved session. This will overwrite the current unsaved session. Do you want to proceed?'
    );
    if (!result) {
      return;
    }
  }
*/
  const tabs = await browser.tabs.query({ currentWindow: true });
  let newTabs = await getList(sessionName);
  await openTabs(newTabs);
  await closeTabs(tabs);

  await setWindowSession(sessionName);
  displayTabs();

  isUpdating = false;
}

/**
* Closes a list of tabs.
* @param {browser.tabs.Tab[]} tabs The tabs to close.
*/
async function closeTabs(tabs) {
  for (const tab of tabs) {
    await browser.tabs.remove(tab.id);
  }
}

/**
* Opens a list of tabs.
* @param {browser.tabs.Tab[]} tabs The tabs to open.
*/
async function openTabs(tabs) {
  for (const tab of tabs) {
    browser.tabs.create({
        url: tab.url
    });
  }
}

/* ---- LISTENER FUNCTIONS ---- */

/**
* Updates a tab in the storage.
* @param {number} tabId The id of the tab.
*/
async function updateStorageTab(tabId) {
  if (isUpdating) return;
  const sessionName = await getCurrentSession();
  const [tabs, updatedTab] = await Promise.all([
    getList(sessionName), 
    browser.tabs.get(tabId)
  ]);
  const tabIndex = tabs.findIndex(tab => tab.id === tabId);
  if (tabIndex !== -1) {
    tabs[tabIndex] = updatedTab;
  }
  set(sessionName, tabs);
  displayTabs();
}

/**
* Creates a tab in the storage.
* @param {browser.tabs.Tab} tab The tab to create.
*/
async function createStorageTab(tab) {
  if (isUpdating) return;
  const sessionName = await getCurrentSession();
  push(sessionName, tab);
  displayTabs();
}

/**
* Removes a tab from the storage.
* @param {number} tabId The id of the tab.
*/
async function removeStorageTab(tabId) {
  if (isUpdating) return;
  const sessionName = await getCurrentSession();
  const tabs = await getList(sessionName);
  const filteredTabs = tabs.filter(tab => tab.id !== tabId);
  set(sessionName, filteredTabs);
  displayTabs();
}

/* ---- LISTENERS AND MESSAGING ---- */

browser.runtime.onMessage.addListener(data => {
  switch (data.type) {
    case 'saveSession':
      saveSession(data.name);
      break;
    case 'openSession':
      openSession(data.name);
      break;
    case 'refresh':
      displayTabs();
      displaySessions();
      break;
  }
});

/**
* Displays the tabs in the popup.
*/
async function displayTabs() {
  const sessionName = await getCurrentSession();
  if (!sessionName) return;
  const tabs = await getList(sessionName);
  browser.runtime.sendMessage({type: 'displayTabs', tabs: tabs});
}

/**
* Displays the sessions in the popup.
*/
async function displaySessions() {
  const allSessionNames = await getList(sessionsList);
  if(allSessionNames === []) return;
  const currentSessionName = await getCurrentSession();
  browser.runtime.sendMessage({type: 'displaySessions', sessions: allSessionNames, highlightedSession: currentSessionName});
}

/**
* Displays a message in the popup using alert.
* @param {string} message The message to display.
*/
function popup(message) {
  browser.runtime.sendMessage({type: 'popup', message: message});
}

browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);

displayTabs();
displaySessions();