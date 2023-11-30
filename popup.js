function test() {
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
  const storageItems = await syncStorage.get();
  for (const item in storageItems) {
    if (item.startsWith('session-')) {
      const session = storageItems[item];
      sessionList.appendChild(new SessionListItem(session));
    }
  };
}

async function clearStorage() {
  browser.storage.sync.clear();
  browser.storage.local.clear();
  const windows = await browser.windows.getAll();
  for (const window of windows) {
    browser.sessions.removeWindowValue(window.id, 'sessionId');
  };
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
const syncStorage = browser.storage.local;
const localStorage = browser.storage.local;
const storageAPI = {

  async getSession(sessionId) {
    let result = await syncStorage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await syncStorage.set({ [`session-${sessionId}`]: session });
  },
  /*
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
  */
}


// Message passing
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

document.addEventListener('DOMContentLoaded', test);