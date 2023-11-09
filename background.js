class TabSession {
  constructor(id, name, tabs) {
    this.id = id;
    this.name = name;
    this.tabs = tabs;
  }
}

//const sessions = [];
let activeSessionId = null;

const tabSessionManager = {

  async saveCurrentSession(name) {
    const tabs = await tabsAPI.getCurrentTabs();
    const id = this.generateId();
    const session = new TabSession(id, name, tabs);

    //sessions.push(session);
    activeSessionId = id;
    this.storeSessions(session);
  },

  async restoreSession(id) {
    const session = this.findSessionById(id);
    if (!session) {
      return;
    }

    await tabsAPI.closeCurrentTabs();
    await tabsAPI.openTabs(session.tabs);

    activeSessionId = id;
  },

  async updateActiveSession() {
    if (!activeSessionId) {
      return;
    }

    const session = this.findSessionById(activeSessionId);
    if (!session) {
      return;
    }

    session.tabs = await tabsAPI.getCurrentTabs();
    this.storeSessions();
  },

  findSessionById(id) {
    const sessions = storageAPI.getList();
    return sessions.find(session => session.id === id);
  },

  generateId() {
    return Date.now().toString(36);
  },

  async storeSessions(session) {
    await storageAPI.addToList('sessions', session);
  },

  async getSessions() {
    const sessions = await storageAPI.getList('sessions');
    if (sessions) {
      return data.sessions.map(session => new TabSession(session.id, session.name, session.tabs));
    }
  }
}

const tabsAPI = {

  async getCurrentTabs() {
    const tabs = await browser.tabs.query({currentWindow: true});
    return tabs.map(({url, title}) => ({url, title}));
  },

  async closeCurrentTabs() {
    const tabs = await this.getCurrentTabs();
    const tabIds = tabs.map(({id}) => id);
    await browser.tabs.remove(tabIds);
  },

  async openTabs(tabData) {
    tabData.map(({url}) => browser.tabs.create({url}));
  }
}

const storageAPI = {

  async get(key) {
    let result = await browser.storage.sync.get(key);
    return result[key];
  },

  async set(key, value) {
    let obj = {};
    obj[key] = value;
    await browser.storage.sync.set(obj);
  },

  async remove(key) {
    await browser.storage.sync.remove(key);
  },

  async getList(key) {
    let result = await browser.storage.sync.get(key);
    return result || [];
  },

  async addToList(key, value) {
    let list = await this.getList(key);
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

const messagingAPI = {
  async saveSession({ sessionName }) {
    try {
      //console.log('test1: ' + sessionName);
      await tabSessionManager.saveCurrentSession(sessionName);
    } catch (error) {
      console.error(`Failed to save session: ${error}`);
    }
  },
  async restoreSession({ sessionName }) {
    try {
      console.log('test2: ' + sessionName);
      //wait tabSessionManager.restoreSession(sessionName);
    } catch (error) {
      console.error(`Failed to restore session: ${error}`);
    }
  },
  // other methods...
};

browser.runtime.onMessage.addListener((message) => {
  if (messagingAPI[message.action]) {
    messagingAPI[message.action](message);
  }
});

browser.tabs.onCreated.addListener(() => tabSessionManager.updateActiveSession());
browser.tabs.onRemoved.addListener(() => tabSessionManager.updateActiveSession());
browser.tabs.onUpdated.addListener(() => tabSessionManager.updateActiveSession());
