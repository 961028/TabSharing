function init() {
  populateSessionList();
  elements.saveBtn.addEventListener('click', saveCurrentSession);
  elements.restoreBtn.addEventListener('click', restoreSession);
  elements.clearBtn.addEventListener('click', clearStorage);
}

const elements = {
  sessionName:  document.getElementById('sessionName'),
  sessionList:  document.getElementById('sessionList'),
  saveBtn:      document.getElementById('saveBtn'),
  restoreBtn:   document.getElementById('restoreBtn'),
  deleteBtn:    document.getElementById('deleteBtn'),
  clearBtn:     document.getElementById('clearBtn')
}

function saveCurrentSession() {
  const sessionName = elements.sessionName.value || 'Unnamed Session';
  elements.sessionName.value = '';
  MESSAGES.saveSession(sessionName);
}

async function restoreSession(id) {
  MESSAGES.restoreSession(id);
}

async function populateSessionList() {
  const sessionList = elements.sessionList;
  sessionList.innerHTML = '';

  let sessions = await storageAPI.getList('sessions');
  for (const session of sessions) {
    sessionList.appendChild(new SessionListItem(session));
  };
}

function clearStorage() {
  browser.storage.sync.clear();
  populateSessionList();
}

// Components

class SessionListItem {
  constructor(session) {
    const sessionListItem = document.createElement('div');
    sessionListItem.textContent = session.name;
    sessionListItem.addEventListener('click', () => MESSAGES.restoreSession(session.id));
    return sessionListItem;
  }
}

// Utils

const storage = browser.storage.sync;
const storageAPI = {

  async get(key) {
    let result = await storage.get(key);
    return result[key];
  },

  async set(key, value) {
    await storage.set({ [key]: value });
  },

  async remove(key) {
    await storage.remove(key);
  },

  async getList(key) {
    let result = await this.get(key);
    return result || [];
  },

  async addToList(key, value) {
    let list = [];
    list = await this.getList(key);
    list.push(value);
    await this.set(key, list);
  },

  async removeFromList(key, value) {
    let list = await this.getList(key);
    let index = list.indexOf(value);
    if (index > -1) {
      list.splice(index, 1);
      await this.set(key, list);
    }
  }
}



const port = browser.runtime.connect({ name: "popup-port" });
port.onMessage.addListener(onMessage);

const ACTIONS = {
  saveSession() {
    populateSessionList();
  },
}

function onMessage(message) {
  try {
    ACTIONS[message.action](message.content);
  } catch(error) {
    console.error(`Failed to execute action: ${error}`);
  }
}

const MESSAGES = {
  saveSession(sessionName) {
    sendMessage('saveSession', sessionName);
  },
  restoreSession(id) {
    sendMessage('restoreSession', id);
  },
};

function sendMessage(action, content) {
  try {
    port.postMessage({ action: action, content: content });
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}

document.addEventListener('DOMContentLoaded', init);