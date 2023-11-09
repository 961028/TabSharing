async function init() {
  populateSessionList();
  elements.saveBtn.addEventListener('click', saveCurrentSession);
  elements.clearBtn.addEventListener('click', clearStorage);
}

const elements = {
  sessionName:  document.getElementById('sessionName'),
  sessionList:  document.getElementById('sessionList'),
  saveBtn:      document.getElementById('saveBtn'),
  restoreBtn:   document.getElementById('restoreBtn'),
  deleteBtn:    document.getElementById('deleteBtn'),
  clearBtn:     document.getElementById('clearBtn')
};

async function saveCurrentSession() {
  const sessionName = elements.sessionName.value || 'Unnamed Session';
  elements.sessionName.value = '';
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
  browser.storage.sync.clear();
  //populateSessionList();
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
      return result[key] || [];
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