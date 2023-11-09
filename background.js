//import { StorageAPI } from './utils/StorageAPI.js';
//import { TabsAPI } from './utils/TabsAPI.js';
//const storageAPI = new StorageAPI();
//const tabsAPI = new TabsAPI();

class TabSession {
  constructor(id, name, tabs) {
    this.id = id;
    this.name = name;
    this.tabs = tabs;
  }
}

class TabSessionManager {
  constructor() {
    this.sessions = [];
    this.activeSessionId = null;
  }

  async saveCurrentSession(name) {
    const tabs = await this.getCurrentTabs();
    const id = this.generateId();
    const session = new TabSession(id, name, tabs);

    this.sessions.push(session);
    this.activeSessionId = id;
    this.storeSessions();
  }

  async restoreSession(id) {
    const session = this.findSessionById(id);
    if (!session) {
      return;
    }

    await this.closeCurrentTabs();
    await this.openTabs(session.tabs);

    this.activeSessionId = id;
  }

  async updateActiveSession() {
    if (!this.activeSessionId) {
      return;
    }

    const session = this.findSessionById(this.activeSessionId);
    if (!session) {
      return;
    }

    session.tabs = await this.getCurrentTabs();
    this.storeSessions();
  }

  findSessionById(id) {
    return this.sessions.find(session => session.id === id);
  }

  generateId() {
    return Date.now().toString(36);
  }

  async storeSessions() {
    await browser.storage.local.set({sessions: this.sessions});
  }

  async loadSessions() {
    const data = await browser.storage.local.get('sessions');
    if (data.sessions) {
      this.sessions = data.sessions.map(session => new TabSession(session.id, session.name, session.tabs));
    }
  }
}

const tabSessionManager = new TabSessionManager();
tabSessionManager.loadSessions();

const messagingAPI = {
  async saveSession({ sessionName }) {
    try {
      console.log('test1: ' + sessionName);
      //await tabSessionManager.saveCurrentSession(sessionName);
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
