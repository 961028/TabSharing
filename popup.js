/*
    set(key, value): This function sets the key and value in the browser's local storage.
    get(key): This function retrieves the value stored under the specified key in the browser's local storage.
    remove(key): This function removes the key and its value from the browser's local storage.
    getList(key): This function retrieves the list stored under the specified key in the browser's local storage.
    push(key, value): This function pushes a new value to the list stored under the specified key in the browser's local storage.
    removeFromList(key, value): This function removes the specified value from the list stored under the specified key in the browser's local storage.
    saveSession(): This function saves the current session with the name specified in the name input field. It retrieves the current tabs, sets the window session to the current session name, pushes the current session name to the list of session names, and displays the tabs and sessions.
    openSession(): This function opens the current session by retrieving the tabs stored under the current session name and creating new tabs with the URLs of the stored tabs.
    displayTabs(): This function displays the tabs stored under the current session name.
    displaySessions(): This function displays the list of session names stored in the browser's local storage.
    updateStorageTab(tabId, changeInfo, tabInfo): This function updates the title and URL of the tab with the specified tabId in the current session's tab list.
    createStorageTab(tab): This function creates a new tab in the current session's tab list.
    removeStorageTab(tabId): This function removes the tab with the specified tabId from the current session's tab list.
*/

const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');

function set(key, value) {
  // Sets a key-value pair in the browser's local storage
  browser.storage.local.set({ [key]: value });
}

function get(key) {
  // Gets the value of a key from the browser's local storage
  return browser.storage.local.get(key)
}

function remove(key) {
  // Removes a key-value pair from the browser's local storage
  browser.storage.local.remove(key)
}

function getList(key) {
  // Returns a list from the browser's local storage
  return get(key).then((result) => {
      return result[key] || [];
  });
}

function push(key, value) {
  // Pushes a value onto a list in the browser's local storage
  getList(key).then((list) => {
      list.push(value);
      set(key, list);
  });
}

function removeFromList(key, value) {
  // Removes a value from a list in the browser's local storage
  getList(key).then((list) => {
      let index = list.indexOf(value);
      if (index > -1) {
          list.splice(index, 1);
          set(key, list);
      }
  });
}


function saveSession() {
  // Saves the current session with the name specified in the name input field
  let sessionName = nameInput.value;
  if (sessionName) {
      browser.tabs.query({ currentWindow: true }).then((tabs) => {
          set(sessionName, tabs);
          set('windowSession', sessionName);
          push('sessionNames', sessionName);
          displayTabs();
          displaySessions();
      });
  }
}

function openSession() {
  // Opens the current session by retrieving the tabs stored under the current session name and creating new tabs with the URLs of the stored tabs
  get('windowSession').then((result) => {
      let sessionName = result.windowSession;
      if (sessionName) {
          get(sessionName).then((result) => {
              let urls = result[sessionName].map((tab) => {
                  return tab.url;
              });
              browser.tabs.create({ url: urls });
          });
      }
  });
}

function displayTabs() {
  // Displays the tabs stored under the current session name
  tabs.innerHTML = '';
  get('windowSession').then((result) => {
      let sessionName = result.windowSession;
      if (sessionName) {
          get(sessionName).then((result) => {
              let tabList = result[sessionName];
              for (let tab of tabList) {
                  let tabElement = document.createElement('div');
                  tabElement.className = 'tab';
                  let titleElement = document.createElement('div');
                  titleElement.className = 'title';
                  titleElement.textContent = tab.title;
                  let urlElement = document.createElement('a');
                  urlElement.className = 'url';
                  urlElement.href = tab.url;
                  urlElement.textContent = tab.url;
                  tabElement.appendChild(titleElement);
                  tabElement.appendChild(urlElement);
                  tabs.appendChild(tabElement);
              }
          });
      }
  });
}

function displaySessions() {
  // Displays the list of session names stored in the browser's local storage
  sessions.innerHTML = '';
  getList('sessionNames').then((sessionNames) => {
      for (let sessionName of sessionNames) {
          let sessionElement = document.createElement('div');
          sessionElement.className = 'session';
          let nameElement = document.createElement('div');
          nameElement.className = 'name';
          nameElement.textContent = sessionName;
          let removeElement = document.createElement('button');
          removeElement.className = 'remove';
          removeElement.textContent = 'Remove';
          removeElement.addEventListener('click', () => {
              remove(sessionName);
              removeFromList('sessionNames', sessionName);
              displaySessions();
          });
          sessionElement.appendChild(nameElement);
          sessionElement.appendChild(removeElement);
          sessions.appendChild(sessionElement);
      }
  });
}

function updateStorageTab(tabId, changeInfo, tabInfo) {
  // Updates the title and URL of the tab with the specified tabId in the current session's tab list
  get('windowSession').then((result) => {
      let sessionName = result.windowSession;
      if (sessionName) {
          get(sessionName).then((result) => {
              let tabList = result[sessionName];
              for (let tab of tabList) {
                  if (tab.id === tabId) {
                      tab.title = changeInfo.title;
                      tab.url = tabInfo.url;
                      set(sessionName, tabList);
                      displayTabs();
                      break;
                  }
              }
          });
      }
  });
}

function createStorageTab(tab) {
  // Creates a new tab in the current session's tab list
  get('windowSession').then((result) => {
      let sessionName = result.windowSession;
      if (sessionName) {
          get(sessionName).then((result) => {
              let tabList = result[sessionName];
              tabList.push(tab);
              set(sessionName, tabList);
              displayTabs();
          });
      }
  });
}

function removeStorageTab(tabId) {
  // Removes the tab with the specified tabId from the current session's tab list
  get('windowSession').then((result) => {
      let sessionName = result.windowSession;
      if (sessionName) {
          get(sessionName).then((result) => {
              let tabList = result[sessionName];
              for (let i = 0; i < tabList.length; i++) {
                  if (tabList[i].id === tabId) {
                      tabList.splice(i, 1);
                      set(sessionName, tabList);
                      displayTabs();
                      break;
                  }
              }
          });
      }
  });
}

saveButton.addEventListener('click', saveSession);
openButton.addEventListener('click', openSession);
browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);
browser.tabs.onUpdated.addListener(displayTabs);
browser.tabs.onCreated.addListener(displayTabs);
browser.tabs.onRemoved.addListener(displayTabs);
displayTabs