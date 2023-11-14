let activeSessionId = null;

const tabSessionManager = {

  async saveCurrentSession(name) {
    const tabs = await tabsAPI.getCurrentTabs();
    const id = this.generateId();
    const session = {id, name, tabs};

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
    this.storeSessions(session);
  },

  findSessionById(id) {
    const sessions = storageAPI.getList();
    return sessions.find(session => session.id === id);
  },

  generateId() {
    return Date.now().toString(36);
  },

  async storeSessions(session) {
    console.log(session);
    let sessions = await storageAPI.getList('sessions');
    /*
    await storageAPI.get('sessions').then((value) => {
      console.log(value);
      if (value) {
        console.log("yes value");
        sessions = value;
      } else {
        console.log("no value");
        sessions = [];
      }
    });
    */
    console.log(sessions);
    sessions.push(session);
    console.log(sessions);
    await storageAPI.set('sessions', sessions);
    sessions = await storageAPI.getList('sessions');
    console.log(sessions);
  },
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
      await tabSessionManager.restoreSession(sessionName);
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





let portFromPopup;

const performAction = {
  async saveSession({ sessionName }) {
    await tabSessionManager.saveCurrentSession(sessionName);
    return { status: 'success' };
  },
  
  noResponseAction({someData}) {
    // Do something...
    return null;
  }
};

function connected(port) {
  portFromPopup = port;
  portFromPopup.onMessage.addListener(async function(m) {
    if (performAction[m.action]) {
      try {
        const response = await performAction[m.action](m);
        portFromPopup.postMessage({ action: `${m.action}Status`, ...response });
      } catch (error) {
        console.error(`Failed to process action ${m.action}: ${error}`);
        portFromPopup.postMessage({ action: `${m.action}Status`, status: 'error', message: `Failed to process action ${m.action}: ${error}` });
      }
    }
  });
}

browser.runtime.onConnect.addListener(connected);



/*

const ACTION_NAMES = {
  SAVE_SESSION: "saveSession",
};

class BackgroundController {
  constructor() {
    browser.runtime.onConnect.addListener(this.connected.bind(this));
  }

  connected(port) {
    this.portFromPopup = port;
    this.portFromPopup.onMessage.addListener(this.handleRequest.bind(this));
  }

  async handleRequest(request) {
    try {
      let response;
      switch (request.action) {
        case ACTION_NAMES.SAVE_SESSION:
        response = await this.saveSession(request);
        break;
        // Other cases...
      }

      if (response) {
        this.portFromPopup.postMessage({action: `${request.action}Status`, ...response});
      }
    } catch (error) {
      this.portFromPopup.postMessage({action: `${request.action}Status`, status: 'error', error: error.toString()});
    }
  }

  async saveSession(request) {
    await tabSessionManager.saveCurrentSession(request.sessionName);
    return { status: 'success' };
  }

  // Other actions...
}

new BackgroundController();

*/






/*
const ACTION_NAMES = {
  SAVE_SESSION: "saveSession",
};

class BackgroundController {
  constructor() {
    this.addActionListeners();
  }

  addActionListeners() {
    browser.runtime.onConnect.addListener(this.connected.bind(this));
  }

  connected(port) {
    this.setPortFromPopup(port);
    this.addMessageListener();
  }

  setPortFromPopup(port) {
    this.portFromPopup = port;
  }

  addMessageListener() {
    this.portFromPopup.onMessage.addListener(this.handleRequest.bind(this));
  }

  async handleRequest(request) {
    try {
      let response = await this.processRequest(request);
      this.sendResponse(request, response);
    } catch (error) {
      this.sendError(request, error);
    }
  }

  async processRequest(request) {
    let response;
    switch (request.action) {
      case ACTION_NAMES.SAVE_SESSION:
        response = await this.saveSession(request);
        break;
      // Other cases...
    }
    return response;
  }

  sendResponse(request, response){
    if (response) {
      this.portFromPopup.postMessage({action: `${request.action}Status`, ...response});
    }
  }

  sendError(request, error){
    this.portFromPopup.postMessage({action: `${request.action}Status`, status: 'error', error: error.toString()});
  }

  async saveSession(request) {
    await tabSessionManager.saveCurrentSession(request.sessionName);
    return { status: 'success' };
  }

  // Other actions...
}

new BackgroundController();

*/




const ACTIONS = {
  SAVE_SESSION: {
    action_name: "saveSession",
    action_response: async function(request) {
        await tabSessionManager.saveCurrentSession(request.sessionName);
        return { status: 'success' };
      }
    }
};

class BackgroundController {
  constructor() {
    this.addActionListeners();
  }

  addActionListeners() {
    browser.runtime.onConnect.addListener(this.connected.bind(this));
  }

  connected(port) {
    this.setPortFromPopup(port);
    this.addMessageListener();
  }

  setPortFromPopup(port) {
    this.portFromPopup = port;
  }

  addMessageListener() {
    this.portFromPopup.onMessage.addListener(this.handleRequest.bind(this));
  }

  async handleRequest(request) {
      try {
        let response = await ACTIONS[request.action].action_response(request);
        this.sendResponse(request, response);
      } catch (error) {
        this.sendError(request, error);
      }
  }

  sendResponse(request, response){
    if (response) {
      this.portFromPopup.postMessage({action: `${ACTIONS[request.action].action_name}Status`, ...response});
    }
  }

  sendError(request, error){
    this.portFromPopup.postMessage({action: `${ACTIONS[request.action].action_name}Status`, status: 'error', error: error.toString()});
  }
}

new BackgroundController();