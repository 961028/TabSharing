const sessionNames = 'sessionNames';

const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');

function set(key, value) {
  browser.storage.local.set({ [key]: value });
}

function get(key) {
  return browser.storage.local.get(key)
}

function remove(key) {
  browser.storage.local.remove(key)
}

function getList(key) {
  return get(key).then((result) => {
      return result[key] || [];
  });
}

function push(key, value) {
  getList(key).then((list) => {
      list.push(value);
      set(key, list);
  });
}

function removeFromList(key, value) {
  
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


function saveSession() {
  if (nameInput.value) { 
    
    let currentSession = nameInput.value;
    setWindowSession(currentSession);

    
    push(sessionNames, currentSession);
    
    
    browser.tabs.query({ currentWindow: true }).then(tabs => {
      
      set(currentSession, tabs);
      
      displayTabs();
    });

    
    displaySessions();
  }
}



async function openSession() {
  
  let currentSession = await getWindowSession();

  
  getList(currentSession).then(tabs => {
    
    tabs.forEach(tab => {
      browser.tabs.create({ url: tab.url });
    });
  });
}


async function displayTabs() {
  
  let currentSession = await getWindowSession();

  
  getList(currentSession).then(list => {
    
    tabs.innerHTML = '';

    
    list.forEach(tab => {
      const li = document.createElement('li');
      li.textContent = tab.title;
      tabs.appendChild(li);
    });
  });
}


function displaySessions() {
  
  getList(sessionNames).then(list => {
    
    sessions.innerHTML = '';

    
    list.forEach(session => {
      const li = document.createElement('li');
      li.textContent = session;
      sessions.appendChild(li);
    });
  });
}


async function updateStorageTab(tabId, changeInfo, tabInfo) {
  
  let currentSession = await getWindowSession();

  
  getList(currentSession).then(tabs => {
    
    const tab = tabs.find(tab => tab.id === tabId);

    
    tab.title = tabInfo.title;
    tab.url = tabInfo.url;

    
    set(currentSession, tabs);
  });
}



async function createStorageTab(tab) {
  
  let currentSession = await getWindowSession();

  
  push(currentSession, tab);
}


async function removeStorageTab(tabId) {
  
  let currentSession = await getWindowSession();

  
  getList(currentSession).then(tabs => {

    
    const tab = tabs.find(tab => tab.id === tabId);

    
    tabs.splice(tabs.indexOf(tab), 1);

    
    set(currentSession, tabs);
  });
}



displayTabs();


displaySessions();


saveButton.addEventListener('click', saveSession);
openButton.addEventListener('click', openSession);

nameInput.addEventListener("keyup", function(event) {
  if (event.key === "Enter") {
    saveSession()
  }
});


browser.tabs.onUpdated.addListener(displayTabs);
browser.tabs.onCreated.addListener(displayTabs);
browser.tabs.onRemoved.addListener(displayTabs);


browser.tabs.onUpdated.addListener(updateStorageTab);
browser.tabs.onCreated.addListener(createStorageTab);
browser.tabs.onRemoved.addListener(removeStorageTab);