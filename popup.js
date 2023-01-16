const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const tabs = document.getElementById('tabs');

// Add event listeners to save and open
saveButton.addEventListener('click', save);
openButton.addEventListener('click', open);

// Save all tabs in the current window to storage
function save() {
  // Get all tabs in the current window
  browser.tabs.query({ currentWindow: true }).then(tabs => {
    // Save the tabs to storage
    browser.storage.local.set({ 'tabs': tabs });
  });
}

// Open all tabs saved in storage
function open() {
  // Get the tabs from storage
  browser.storage.local.get('tabs').then(result => {
    // Open all the tabs
    result.tabs.forEach(tab => {
      browser.tabs.create({ url: tab.url });
    });
  });
}

// Display all tabs saved in storage in the popup
function displayTabs() {
  // Get the tabs from storage
  browser.storage.local.get('tabs').then(result => {
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

// Add event listeners to update the tabs in the popup when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(displayTabs);
browser.tabs.onCreated.addListener(displayTabs);
browser.tabs.onRemoved.addListener(displayTabs);

// Add event listeners to update the tabs in the storage when a tab is updated, created, or removed
browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);

// Update a tab in storage
function updateStorageTab(tabId, changeInfo, tabInfo) {
  // Get the tabs from storage
  browser.storage.local.get('tabs').then(result => {
    // Find the tab to update
    const tab = result.tabs.find(tab => tab.id === tabId);

    // Update the tab
    tab.title = tabInfo.title;
    tab.url = tabInfo.url;

    // Save the tabs to storage
    browser.storage.local.set({ 'tabs': result.tabs });
  });
}

// Create a tab in storage
function createStorageTab(tab) {
  // Get the tabs from storage
  browser.storage.local.get('tabs').then(result => {
    // Add the tab to the array
    result.tabs.push(tab);

    // Save the tabs to storage
    browser.storage.local.set({ 'tabs': result.tabs });
  });
}

// Remove a tab from storage
function removeStorageTab(tabId) {
  // Get the tabs from storage
  browser.storage.local.get('tabs').then(result => {
    // Find the tab to remove
    const tab = result.tabs.find(tab => tab.id === tabId);

    // Remove the tab from the array
    result.tabs.splice(result.tabs.indexOf(tab), 1);

    // Save the tabs to storage
    browser.storage.local.set({ 'tabs': result.tabs });
  });
}

// Display the tabs when the popup loads
displayTabs();