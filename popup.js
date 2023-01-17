const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');
let currentSession;

// Add event listeners to save and open
saveButton.addEventListener('click', save);
openButton.addEventListener('click', open);

nameInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    save()
  }
});

// Save session
function save() {
  // Check user input
  var userInput = nameInput.value;
  if (userInput) { //todo: if user input isn't taken
    // Set the current session
    currentSession = userInput;

    // Save the session name to storage
    browser.storage.local.set({ 'savedSessions' : currentSession });
    browser.storage.local.get('savedSessions').then(result => {
  
      // Display all the tabs
      result.forEach(session => {
        alert("session")
      });
    });

    // Update sessions in popup
    displaySessions();

    // Get all tabs in the current window
    browser.tabs.query({ currentWindow: true }).then(tabs => {
      // Save the tabs to storage
      browser.storage.local.set({ currentSession: tabs })
    });
  }
}

// Open all tabs saved in storage
function open() {
  // Get the tabs from storage
  browser.storage.local.get(currentSession).then(result => {
    // Open all the tabs
    result.tabs.forEach(tab => {
      browser.tabs.create({ url: tab.url });
    });
  });
}

// Display all tabs saved in storage in the popup
function displayTabs() {
  // Get the tabs from storage
  browser.storage.local.get(currentSession).then(result => {
    // Clear the popup
    tabs.innerHTML = '';

    // Display all the tabs
    result.tabs.forEach(tab => {
      const li = document.createElement('li');
      li.textContent = tab.title;
      tabs.appendChild(li);
    });
  });
}

// Display all tabs saved in sessions in the popup
function displaySessions() {
  // Get the sessions from storage
  browser.storage.local.get('savedSessions').then(result => {
    // Clear the popup
    sessions.innerHTML = '';

    // Display all the tabs
    result.forEach(session => {
      const li = document.createElement('li');
      li.textContent = "session";
      sessions.appendChild(li);
    });
  });
}

// Update a tab in storage
function updateStorageTab(tabId, changeInfo, tabInfo) {
  // Get the tabs from storage
  browser.storage.local.get(currentSession).then(result => {
    // Find the tab to update
    const tab = result.tabs.find(tab => tab.id === tabId);

    // Update the tab
    tab.title = tabInfo.title;
    tab.url = tabInfo.url;

    // Save the tabs to storage
    browser.storage.local.set({ currentSession: result.tabs });
  });
}

// Create a tab in storage
function createStorageTab(tab) {
  // Get the tabs from storage
  browser.storage.local.get(currentSession).then(result => {
    // Add the tab to the array
    result.tabs.push(tab);

    // Save the tabs to storage
    browser.storage.local.set({ currentSession: result.tabs });
  });
}

// Remove a tab from storage
function removeStorageTab(tabId) {
  // Get the tabs from storage
  browser.storage.local.get(currentSession).then(result => {
    // Find the tab to remove
    const tab = result.tabs.find(tab => tab.id === tabId);

    // Remove the tab from the array
    result.tabs.splice(result.tabs.indexOf(tab), 1);

    // Save the tabs to storage
    browser.storage.local.set({ currentSession: result.tabs });
  });
}


function deleteSession(session) {
  browser.storage.local.remove(session);
  browser.storage.get('savedSessions').then(result => {

    // Remove the sessions from the array
    result.splice(result.indexOf(session), 1);

    // Save the sessions to storage
    browser.storage.local.set({ 'savedSessions': result });
  });
}

// Display the tabs when the popup loads
displayTabs();
displaySessions();

// Add event listeners to update the tabs in the popup when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(displayTabs);
browser.tabs.onCreated.addListener(displayTabs);
browser.tabs.onRemoved.addListener(displayTabs);

// Add event listeners to update the tabs in the storage when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);