const saveButton = document.getElementById('save-button');
const openButton = document.getElementById('open-button');
const nameInput = document.getElementById('name-input');
const tabs = document.getElementById('tabs');
const sessions = document.getElementById('sessions');

function saveSession() {
  browser.runtime.sendMessage({type: 'saveSession', name: nameInput});
}

function openSession() {
  browser.runtime.sendMessage({type: 'openSession', name: nameInput});
}

saveButton.addEventListener('click', saveSession);
openButton.addEventListener('click', openSession);