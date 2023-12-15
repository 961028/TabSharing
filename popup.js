import { ContextMenu, MenuItem } from './components/ContextMenu.js';
import { DragAndDropList } from './components/DragAndDropList.js';
const menu = new ContextMenu();

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
  const storageItems = await storage.get();
  const backgroundPage = await browser.extension.getBackgroundPage();
  const currentSessionId = await backgroundPage.getCurrentWindowId();
  let isSelected = false;

  for (const item in storageItems) {
    if (item.startsWith('session-')) {
      const session = storageItems[item];
      if (currentSessionId) isSelected = session.id == currentSessionId;
      const sessionListItem = new SessionItem(session, isSelected);
      sessionList.appendChild(sessionListItem);
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

class SessionItem {
  constructor(session, isSelected) {
    const item = document.createElement('div');
    item.classList.add('item');
    if (isSelected) item.classList.add('selected');

    const sessionIcon = document.createElement('img');
    sessionIcon.src = session.icon;
    sessionIcon.classList.add('favicon');
    item.append(sessionIcon);

    const sessionName = document.createElement('div');
    sessionName.textContent = session.name;
    sessionName.contentEditable = 'false';
    sessionName.classList.add('itemText');
    item.append(sessionName);

    item.addEventListener('click', async () => {
      if (sessionName.contentEditable === 'false') {
        MESSAGES.restoreSession(session.id)
      }
    });

    sessionName.addEventListener('blur', async () => {
      console.log("test");
      if (sessionName.contentEditable === 'true') {
        sessionName.contentEditable = 'false';
        item.classList.remove('hasFocus');
        let newName = sessionName.textContent.trim();
        if (newName && newName !== session.name) {
          //await storage.editTag(tag.id, newName);
          sessionName.textContent = "newName";
        } else {
          sessionName.textContent = "session.name";
        }
      }
    });

    item.addEventListener('contextmenu', (event) => {
      event.preventDefault();

      const renameMenuItem = new MenuItem("Rename", async () => {
        sessionName.contentEditable = 'true';
        item.classList.add('hasFocus');
        selectText(sessionName);
      });

      const changeIcon = new MenuItem("Change icon", async () => {
        menu.hideMenu();
      });

      const changeColor = new MenuItem("Change color", async () => {
        await addSeparator();
        menu.hideMenu();
      });

      const addSeparatorMenuItem = new MenuItem("Add separator", async () => {
        //await addSeparator();
        //menu.hideMenu();
      });
  
      const deleteMenuItem = new MenuItem("Remove", async () => {
        await storage.deleteTag(tag.id);
        updateTagsList(await storage.getTags());
        searchBookmarks();
        menu.hideMenu();
      });

      const editMenuItem = new MenuItem("Edit", async () => {
        const menuItems = [renameMenuItem, changeIcon, changeColor, deleteMenuItem];
        menu.showMenu(event, item, menuItems);
      });
  
      const menuItems = [editMenuItem, addSeparatorMenuItem];
      menu.showMenu(event, item, menuItems);
    });
    
    return item;
  }
}

// Utils

function selectText(node) {
  if (document.body.createTextRange) {
      const range = document.body.createTextRange();
      range.moveToElementText(node);
      range.select();
  } else if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      selection.removeAllRanges();
      selection.addRange(range);
  } else {
      console.warn("Could not select text in node: Unsupported browser.");
  }
}

const storage = browser.storage.local;
const storageAPI = {

  async getSession(sessionId) {
    let result = await storage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await storage.set({ [`session-${sessionId}`]: session });
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