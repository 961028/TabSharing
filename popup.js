const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const refreshButton = document.getElementById('refresh-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');

async function displayTabs(listOfTabs) {
  //alert("started displaying tabs");
  const tabList = document.createElement('ul');
  listOfTabs.forEach(tab => {
    const tabItem = document.createElement('li');
    tabItem.innerText = tab.title;
    tabList.appendChild(tabItem);
    const id = document.createElement('li');
    id.innerText = tab.id;
    tabList.appendChild(id);
  });
  document.getElementById('tabs').innerHTML = '';
  document.getElementById('tabs').appendChild(tabList);
}

async function displaySessions(listOfSessions) {
  //alert("started displaying sessions");
  const sessionList = document.createElement('ul');
  listOfSessions.forEach(sessionName => {
    const sessionItem = document.createElement('li');
    sessionItem.innerText = sessionName;
    sessionList.appendChild(sessionItem);
  });
  document.getElementById('sessions').innerHTML = '';
  document.getElementById('sessions').appendChild(sessionList);
}

browser.runtime.onMessage.addListener(data => {
  if (data.type === 'displayTabs') {
    displayTabs(data.tabs);
  }
  else if (data.type === 'displaySessions') {
    displaySessions(data.sessions);
  }
  else if(data.type === 'popup') {
    alert(data.message);
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
