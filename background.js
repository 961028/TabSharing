/*
set(key, value): This function is used to set key-value pairs in the browser's storage. The function takes in two parameters, the key (a string) and the value (a string, number, or object) to be stored. The key-value pair is stored in the browser's storage and can be retrieved using the get() function.

get(key): This function is used to retrieve the value stored under a specified key in the browser's storage. The function takes in one parameter, the key (a string) of the desired value. The function returns the value stored under the specified key, or null if the key does not exist in the storage.

remove(key): This function is used to remove a key and its associated value from the browser's storage. The function takes in one parameter, the key (a string) of the key-value pair to be removed. The function removes the key-value pair from the storage, and the key will no longer exist in the storage.

getList(key): This function is used to retrieve a list stored under a specified key in the browser's storage. The function takes in one parameter, the key (a string) of the desired list. The function returns the list stored under the specified key, or null if the key does not exist in the storage.

push(key, value): This function is used to add a new value to an existing list stored under a specified key in the browser's storage. The function takes in two parameters, the key (a string) of the list and the value (a string, number, or object) to be added. The value is added to the end of the existing list, and the modified list is stored back in the storage.

removeFromList(key, value): This function is used to remove a specified value from a list stored under a specified key in the browser's storage. The function takes in two parameters, the key (a string) of the list and the value (a string, number, or object) to be removed. The value is removed from the list, and the modified list is stored back in the storage.

setWindowSession(name): This function is used to set the name of the current window session in the browser's storage. The function takes in one parameter, the name (a string) of the current session. The function stores the name in the browser's storage and the session can be retrieved using the getWindowSession() function.

getWindowSession(): This function is used to retrieve the name of the current window session from the browser's storage. The function takes no parameters. The function returns the name of the current session, or null if a session name is not set.

saveSession(): This function is used to save the current session with a specified name. The function takes in no parameters. It retrieves the current open tabs from the browser, sets the window session to the current session name, pushes the current session name to the list of session names stored in the browser's storage, and displays the tabs and sessions.

openSession(): This function is used to open a saved session by retrieving the tabs stored under the current session name, clearing whatever tabs are currently open in the window, and creating new tabs with the URLs of the stored tabs. The function takes in no parameters. Before opening the session, the function checks if the current window is saved as a session and if not, it will prompt the user if they want to proceed and overwrite the current unsaved window. If the user confirms, the current unsaved tabs will be lost.

displayTabs(): This function is used to display the tabs stored under the current session name. The function takes in no parameters.

displaySessions(): This function is used to display the list of session names stored in the browser's storage. The function takes in no parameters. It retrieves the list of session names from the storage and displays them to the user.

updateStorageTab(id, changeInfo, tabInfo): This function is used to update the title and URL of a tab in the current session's tab list. The function takes in three parameters, the id (a string) of the tab to be updated, the changeInfo (an object) containing information about the changes made to the tab, and the tabInfo (an object) containing information about the tab. The function updates the tab's title and URL in the current session's tab list stored in the browser's storage.

createStorageTab(tab): This function is used to create a new tab in the current session's tab list. The function takes in one parameter, the tab (an object) containing information about the new tab. The function creates a new tab with the provided information and stores it in the current session's tab list in the browser's storage.

removeStorageTab(id): This function is used to remove a tab from the current session's tab list. The function takes in one parameter, the id (a string) of the tab to be removed. The function removes the tab with the specified id from the current session's tab list stored in the browser's storage.
*/


function set(key, value) {
  const data = { [key]: value };
  browser.storage.local.set(data);
}

async function get(key) {
  const result = await browser.storage.local.get(key);
  return result[key];
}

function remove(key) {
  browser.storage.local.remove(key);
}

async function getList(key) {
  const value = await get(key);
  return value || [];
}

async function push(key, value) {
  const list = await getList(key);
  list.push(value);
  set(key, list);
}

async function removeFromList(key, value) {
  const list = await getList(key);
  const index = list.indexOf(value);
  if (index > -1) {
    list.splice(index, 1);
    set(key, list);
  }
}

async function setWindowSession(name) {
  await set('currentWindowSession', name);
}

async function getWindowSession() {
  return await get('currentWindowSession');
}

async function saveSession(sessionName) {
  setWindowSession(sessionName);
  push('sessionNames', sessionName);
  const tabs = await browser.tabs.query({ currentWindow: true });
  set(sessionName, tabs);
  displayTabs();
  displaySessions();
}

async function openSession(sessionName) {
  const windowSession = await getWindowSession();
  if (!windowSession) {
    const result = confirm(
      'You are about to open a saved session. This will overwrite the current unsaved session. Do you want to proceed?'
    );
    if (!result) {
      return;
    }
  }
  const tabs = await getList(sessionName);
  browser.tabs.query({ currentWindow: true }).then(tabs => {
    tabs.forEach(tab => {
      browser.tabs.remove(tab.id);
    });
  });
  tabs.forEach(tab => {
    browser.tabs.create({
      url: tab.url,
      active: false
    });
  });
  setWindowSession(sessionName);
  displayTabs();
}

async function updateStorageTab(id, changeInfo, tabInfo) {
  const sessionName = await getWindowSession();
  const tabs = getList(sessionName);
  tabs.forEach(tab => {
    if (tab.id === id) {
      tab.title = changeInfo.title;
      tab.url = tabInfo.url;
    }
  });
  set(sessionName, tabs);
  displayTabs();
}

async function createStorageTab(tab) {
  const sessionName = await getWindowSession();
  push(sessionName, tab);
  displayTabs();
}

async function removeStorageTab(id) {
  const sessionName = await getWindowSession();
  const tabs = await getList(sessionName);
  const filteredTabs = tabs.filter(tab => tab.id !== id);
  set(sessionName, filteredTabs);
  displayTabs();
}

browser.runtime.onMessage.addListener(data => {
  if (data.type === 'saveSession') {
    //popup("received save session");
    saveSession(data.name);
  }
  else if (data.type === 'openSession') {
    //popup("received open session");
    openSession(data.name);
  }
  else if (data.type === 'refresh') {
    //popup("received refresh");
    displayTabs();
    displaySessions();
  }
});

async function displayTabs() {
  const sessionName = await getWindowSession();
  const tabs = await getList(sessionName);
  browser.runtime.sendMessage({type: 'displayTabs', tabs: tabs});
}

async function displaySessions() {
  const sessionNames = await getList('sessionNames');
  browser.runtime.sendMessage({type: 'displaySessions', sessions: sessionNames});
}

function popup(message) {
  browser.runtime.sendMessage({type: 'popup', message: message});
}

browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);