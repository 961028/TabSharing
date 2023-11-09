import { StorageAPI } from './utils/StorageAPI.js';
import { Mediator } from './utils/Mediator.js';
const storageAPI = new StorageAPI();
const mediator = new Mediator();

async function init() {
  populateSessionList();
  elements.saveBtn.addEventListener('click', saveCurrentSession);
  elements.clearBtn.addEventListener('click', clearStorage);
}

const elements = {
  sessionName: document.getElementById('sessionName'),
  sessionList: document.getElementById('sessionList'),
  saveBtn: document.getElementById('saveBtn'),
  restoreBtn: document.getElementById('restoreBtn'),
  deleteBtn: document.getElementById('deleteBtn'),
  clearBtn: document.getElementById('clearBtn')
};

async function saveCurrentSession() {
  const sessionName = elements.sessionName.value || 'Unnamed Session';
  elements.sessionName.value = '';
  //await storage.addToList('sessions', sessionName);
  await messagingAPI.saveCurrentSession(sessionName);
  populateSessionList();
}

async function populateSessionList() {
  const sessionList = elements.sessionList;
  sessionList.innerHTML = '';

  const sessions = await storageAPI.getList('sessions');
  for (const session of sessions) {
    const sessionListItem = document.createElement('div');
    sessionListItem.textContent = session.name;
    sessionList.appendChild(sessionListItem);
  };
}

function clearStorage() {
  messagingAPI.saveCurrentSession("testA");
  messagingAPI.restoreSession("testB");
  mediator.saveSession("testC");
  //browser.storage.sync.clear();
  //populateSessionList();
}

const messagingAPI = {
  async saveCurrentSession(sessionName) {
    try {
      await browser.runtime.sendMessage({ action: 'saveSession', sessionName });
    } catch (error) {
      console.error(`Failed to send message: ${error}`);
    }
  },
  async restoreSession(sessionName) {
      try {
        await browser.runtime.sendMessage({ action: 'restoreSession', sessionName });
      } catch (error) {
        console.error(`Failed to send message: ${error}`);
    }
  },
  // other methods...
};

document.addEventListener('DOMContentLoaded', init);


/*
async function restoreSession() {
  const sessionName = elements.sessionList.value;
  const session = await browser.runtime.sendMessage({ type: 'restoreSession', sessionName });
  if (session) {
    const currentTabs = await browser.tabs.query({ currentWindow: true });
    currentTabs.forEach((tab) => browser.tabs.remove(tab.id));

    session.tabs.forEach((tab) => browser.tabs.create({ url: tab.url }));
  }
}

async function deleteSelectedSession() {
  const sessionName = elements.sessionList.value;
  await browser.runtime.sendMessage({ type: 'deleteSession', sessionName });
  populateSessionList();
}
*/