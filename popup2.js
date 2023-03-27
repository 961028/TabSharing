const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const refreshButton = document.getElementById('refresh-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');

async function displayTabs(listOfTabs) {
  const tabList = document.createElement('ul');
  listOfTabs.forEach(tab => {
    const tabItem = document.createElement('li');
    tabItem.innerText = tab.title;
    tabList.appendChild(tabItem);
    const tabId = document.createElement('li');
    tabId.innerText = tab.id;
    tabList.appendChild(tabId);
  });
  document.getElementById('tabs').innerHTML = '';
  document.getElementById('tabs').appendChild(tabList);
}

async function displaySessions(listOfSessions, highlightedSession) {
  const sessionList = document.createElement('ul');
  listOfSessions.forEach(sessionName => {
    const sessionItem = document.createElement('li');
    if (sessionName == highlightedSession) {
      sessionItem.innerText = 'current: ' + sessionName;
    } else {
      sessionItem.innerText = sessionName;
    }
    sessionList.appendChild(sessionItem);
  });
  document.getElementById('sessions').innerHTML = '';
  document.getElementById('sessions').appendChild(sessionList);
}

browser.runtime.onMessage.addListener(data => {
  switch (data.type) {
    case 'displayTabs':
      displayTabs(data.tabs);
      break;
    case 'displaySessions':
      displaySessions(data.sessions, data.highlightedSession);
      break;
    case 'popup':
      alert(data.message);
      break;
  }
});

function refresh() {
  browser.runtime.sendMessage({type: 'refresh'});
}

function saveSession() {
  browser.runtime.sendMessage({type: 'saveSession', name: nameInput.value});
}

function openSession() {
  browser.runtime.sendMessage({type: 'openSession', name: nameInput.value});
}

saveButton.addEventListener('click', saveSession);
openButton.addEventListener('click', openSession);
refreshButton.addEventListener('click', refresh);

refresh();
