let activeSessionId = null;

const tabSessionManager = {

  async saveCurrentSession(name) {
    const tabs = await tabsAPI.getCurrentTabs();
    const id = this.generateId();
    const session = {id, name, tabs};
  
    let sessions = await storageAPI.getList('sessions');
    sessions.push(session);
    await storageAPI.set('sessions', sessions);
    activeSessionId = id;
  },

  async restoreSession(id) {
    if(activeSessionId === id) {
      return;
    } 
    const session = await this.findSessionById(id);
    if (!session) {
      return;
    }

    const currentTabs = await tabsAPI.getCurrentTabs();

    removeListeners();
    await tabsAPI.openTabs(session.tabs);
    await tabsAPI.closeTabs(currentTabs);
    addListeners();

    activeSessionId = id;
  },

  async updateActiveSession() {
    if (!activeSessionId) {
      return;
    }

    const sessions = await storageAPI.getList('sessions');
    const session = await sessions.find(session => session.id === activeSessionId);
    console.log(sessions);
    session.tabs = await tabsAPI.getCurrentTabs();
    console.log(sessions);
    await storageAPI.set('sessions', sessions);
  },

  async findSessionById(id) {
    const sessions = await storageAPI.getList('sessions');
    return sessions.find(session => session.id === id);
  },

  generateId() {
    return Date.now().toString(36);
  },
}

const tabsAPI = {

  async getCurrentTabs() {
    const tabs = await browser.tabs.query({currentWindow: true});
    return tabs.map(({url, title, id}) => ({url, title, id}));
  },

  async closeTabs(tabs) {
    const tabIds = tabs.map(({id}) => id);
    await browser.tabs.remove(tabIds);
  },

  async openTabs(tabs) {
    tabs.map(({url}) => browser.tabs.create({url}));
  }
}

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



let port;
browser.runtime.onConnect.addListener(connected);
function connected(p) {
  port = p;
  port.onMessage.addListener(onMessage);
}

const ACTIONS = {
  async saveSession(sessionName) {
    await tabSessionManager.saveCurrentSession(sessionName);
    CALLBACKS.saveSession(sessionName);
  },
  restoreSession(id) {
    tabSessionManager.restoreSession(id);
  },
};

function onMessage(message) {
  try {
    ACTIONS[message.action](message.content);
  } catch(error) {
    console.error(`Failed to execute action: ${error}`);
  }
}

const CALLBACKS = {
  saveSession() {
    sendCallback('saveSession');
  },
};

function sendCallback(action, content) {
  try {
    port.postMessage({ action: action, content: content });
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}


function addListeners() {
  browser.tabs.onCreated.addListener(() => tabSessionManager.updateActiveSession());
  browser.tabs.onRemoved.addListener(() => tabSessionManager.updateActiveSession());
  browser.tabs.onUpdated.addListener(() => tabSessionManager.updateActiveSession());
}

function removeListeners() {
  browser.tabs.onCreated.removeListener(() => tabSessionManager.updateActiveSession());
  browser.tabs.onRemoved.removeListener(() => tabSessionManager.updateActiveSession());
  browser.tabs.onUpdated.removeListener(() => tabSessionManager.updateActiveSession());
}

addListeners();