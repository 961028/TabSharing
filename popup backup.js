const sessionNames = 'sessionNames';

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

async function setWindowSession(name) {
  let currentWindow = await browser.windows.getLastFocused();
  await browser.sessions.setWindowValue(currentWindow.id, 'session', name);
}

async function getWindowSession() {
  let currentWindow = await browser.windows.getLastFocused();
  return browser.sessions.getWindowValue(currentWindow.id, 'session');
}

// Save new session
function saveSession() {
  if (nameInput.value) { //todo: if user input isn't taken
    // Set the current session
    let currentSession = nameInput.value;
    setWindowSession(currentSession);

    // Save the session name to storage
    push(sessionNames, currentSession);
    
    // Get all tabs in the current window
    browser.tabs.query({ currentWindow: true }).then(tabs => {
      // Save the tabs to storage
      set(currentSession, tabs);
      // Update tabs in popup
      displayTabs();
    });

    // Update sessions in popup
    displaySessions();
  }
}


// Open all tabs saved in storage
async function openSession() {
  // Get the current session
  let currentSession = await getWindowSession();

  // Get the tabs from storage
  getList(currentSession).then(tabs => {
    // Open all the tabs
    tabs.forEach(tab => {
      browser.tabs.create({ url: tab.url });
    });
  });
}

// Display all tabs saved in storage in the popup
async function displayTabs() {
  // Get the current session
  let currentSession = await getWindowSession();

  // Get the tabs from storage
  getList(currentSession).then(list => {
    // Clear the popup
    tabs.innerHTML = '';

    // Display all the tabs
    list.forEach(tab => {
      const li = document.createElement('li');
      li.textContent = tab.title;
      tabs.appendChild(li);
    });
  });
}

// Display all tabs saved in sessions in the popup
function displaySessions() {
  // Get the sessions from storage
  getList(sessionNames).then(list => {
    // Clear the popup
    sessions.innerHTML = '';

    // Display all sessions
    list.forEach(session => {
      const li = document.createElement('li');
      li.textContent = session;
      sessions.appendChild(li);
    });
  });
}

// Update a tab in storage
async function updateStorageTab(tabId, changeInfo, tabInfo) {
  // Get the current session
  let currentSession = await getWindowSession();

  // Get the tabs from storage
  getList(currentSession).then(tabs => {
    // Find the tab to update
    const tab = tabs.find(tab => tab.id === tabId);

    // Update the tab
    tab.title = tabInfo.title;
    tab.url = tabInfo.url;

    // Save the tabs to storage
    set(currentSession, tabs);
  });
}


// Create a tab in storage
async function createStorageTab(tab) {
  // Get the current session
  let currentSession = await getWindowSession();

  // Get the tabs from storage
  push(currentSession, tab);
}

// Remove a tab from storage
async function removeStorageTab(tabId) {
  // Get the current session
  let currentSession = await getWindowSession();

  // Get the tabs from storage
  getList(currentSession).then(tabs => {

    // Find the tab to remove
    const tab = tabs.find(tab => tab.id === tabId);

    // Remove the tab from the array
    tabs.splice(tabs.indexOf(tab), 1);

    // Save the tabs to storage
    set(currentSession, tabs);
  });
}


// Display the tabs when the popup loads
displayTabs();

// Display the sessions when the popup loads
displaySessions();

// Add event listeners to save and open
saveButton.addEventListener('click', saveSession);
openButton.addEventListener('click', openSession);

nameInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    saveSession()
  }
});

// Add event listeners to update the tabs in the popup when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(displayTabs);
browser.tabs.onCreated.addListener(displayTabs);
browser.tabs.onRemoved.addListener(displayTabs);

// Add event listeners to update the tabs in the storage when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);