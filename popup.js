//const backgroundMessager = new PopupController();

async function init() {
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
  populateSessionList();
}

async function restoreSession() {
  populateSessionList();
}

async function populateSessionList() {
  const sessionList = elements.sessionList;
  sessionList.innerHTML = '';

  let sessions = [];
  await storageAPI.get('sessions').then((value) => {
    if (value) sessions = value;
  });
  for (const session of sessions) {
    const sessionListItem = document.createElement('div');
    sessionListItem.textContent = session.name;
    sessionList.appendChild(sessionListItem);
  };
}

function clearStorage() {
  browser.storage.sync.clear();
  populateSessionList();
}

const storage = browser.storage.sync;
const storageAPI = {
  async get(key) {
    let result = await storage.get(key);
    return result[key];
  }
}



const port = browser.runtime.connect({ name: "popup-port" });
port.onMessage.addListener(onMessage);

const ACTIONS = {
  saveSession(sessionName) {
    console.log('success!');
    console.log(sessionName);
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
};

function sendMessage(action, content) {
  try {
    port.postMessage({ action: action, content: content });
  } catch (error) {
    console.error(`Failed to send message: ${error}`);
  }
}

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






let portToBackground = browser.runtime.connect({ name: "port-from-popup" });

const performAction = {
  saveSession(sessionName) {
    portToBackground.postMessage({ action: 'saveSession', sessionName: sessionName });
  },
};

const handleResponse = {
  saveSessionStatus(message) {
    if (message.status === 'success') {
      console.log('Session saved successfully');
    } else {
      console.error(message.message);
    }
  },
};

portToBackground.onMessage.addListener((message) => {
  const handler = handleResponse[message.action];
  if (handler) {
    handler(message);
  } else {
   console.warn(`No handler for action ${message.action}`);
  }
});





const ACTION_NAMES = {
  SAVE_SESSION: "saveSession",
};

class PopupController {
  constructor() {
    this.portToBackground = browser.runtime.connect({ name: 'port-from-popup' });
    this.portToBackground.onMessage.addListener(this.handleResponse.bind(this));
  }

  postMessage(action, payload) {
    this.portToBackground.postMessage({ action: action, ...payload });
  }

  handleResponse(message) {
    switch (message.action) {
      case ACTION_NAMES.SAVE_SESSION:
        this.handleSaveSessionResponse(message);
        break;
      default:
        console.warn(`No handler for action ${message.action}`);
        break;
    }
  }

  handleSaveSessionResponse(message) {
    if (message.status === 'success') {
      console.log('Session saved successfully');
    } else {
      console.error(message.error);
    }
  }
}

new PopupController();






const ACTION_NAMES = {
  SAVE_SESSION: "saveSession",
};

class PopupController {
  constructor() {
    this.createConnection();
    this.setMessageListener();
  }

  createConnection() {
    this.portToBackground = browser.runtime.connect({ name: 'port-from-popup' });
  }
  
  setMessageListener() {
    this.portToBackground.onMessage.addListener(this.handleResponse.bind(this));
  }

  postMessage(action, payload = {}) {
    this.portToBackground.postMessage({ action, ...payload });
  }

  handleResponse(message) {
    if (this.isActionHandlerExists(message.action)) {
      this.handleAction(message);
    } else {
      this.warnNoHandlerForAction(message.action);
    }
  }

  isActionHandlerExists(action) {
    return Object.values(ACTION_NAMES).includes(action);
  }

  handleAction(message) {
    switch (message.action) {
      case ACTION_NAMES.SAVE_SESSION:
        this.handleSaveSessionResponse(message);
        break;
      default:
        break;
    }
  }

  warnNoHandlerForAction(action){
    console.warn(`No handler for action ${action}`);
  }

  handleSaveSessionResponse(message) {
    message.status === 'success' 
      ? this.logSuccess() 
      : this.logError(message.error);
  }

  logSuccess() {
    console.log('Session saved successfully');
  }

  logError(error) {
    console.error(error);
  }
}

new PopupController();




const ACTIONS = {
  SAVE_SESSION: {
    action_name: "saveSession",
    action_response: function(message) {
        if (message.status === 'success') {
          console.log('Session saved successfully');
        } else {
          console.error(message.error);
        }
      }
    }
};

class PopupController {
  constructor() {
    this.createConnection();
    this.setMessageListener();
  }

  createConnection() {
    this.portToBackground = browser.runtime.connect({ name: 'port-from-popup' });
  }
  
  setMessageListener() {
    this.portToBackground.onMessage.addListener(this.handleResponse.bind(this));
  }

  postMessage(action, payload = {}) {
    this.portToBackground.postMessage({ action: ACTIONS[action].action_name, ...payload });
  }

  handleResponse(message) {
    if (this.isActionHandlerExists(message.action)) {
      ACTIONS[message.action].action_response(message);
    } else {
      console.warn(`No response handler for action ${message.action}`);
    }
  }

  isActionHandlerExists(action) {
    return !!ACTIONS[action];
  }
}

*/