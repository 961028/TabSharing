import { ContextMenu, MenuItem } from './components/ContextMenu.js';
import { DragAndDropList } from './components/DragAndDropList.js';
const menu = new ContextMenu();

function init() {
  populateSessionList();
  elements.saveBtn.addEventListener('click', saveCurrentSession);
  elements.clearBtn.addEventListener('click', clearStorage);
}

const elements = {
  sessionList:  document.getElementById('sessionList'),
  saveBtn:      document.getElementById('saveBtn'),
  clearBtn:     document.getElementById('clearBtn')
}

function saveCurrentSession() {
  const sessionName = 'Unnamed Session';
  MESSAGES.saveSession(sessionName);
}

async function populateSessionList() {
  const sessionList = elements.sessionList;
  sessionList.innerHTML = '';
  const storageItems = await storage.get();
  const backgroundPage = await browser.extension.getBackgroundPage();
  const currentSessionId = await backgroundPage.getCurrentWindowSessionId();
  let isSelected = false;

  for (const item in storageItems) {
    if (item.startsWith('session-')) {
      const session = storageItems[item];
      if (currentSessionId) isSelected = session.id === currentSessionId;
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
      if (sessionName.contentEditable === 'true') {
        sessionName.contentEditable = 'false';
        item.classList.remove('hasFocus');
        let newName = sessionName.textContent.trim();
        if (newName && newName !== session.name) {
          const backgroundPage = await browser.extension.getBackgroundPage();
          await backgroundPage.renameSession(session.id, newName);
          sessionName.textContent = newName;
        } else {
          sessionName.textContent = session.name;
        }
      }
    });

    item.addEventListener('contextmenu', (event) => {
      event.preventDefault();

      const renameMenuItem = new MenuItem("Rename", async () => {
        sessionName.contentEditable = 'true';
        item.classList.add('hasFocus');
        selectText(sessionName);
        sessionName.addEventListener('keydown', (e) => {
          if (e.code === 'Enter') {
            sessionName.blur();
          }
        })
      });

      const deleteMenuItem = new MenuItem("Remove", async () => {
        const backgroundPage = await browser.extension.getBackgroundPage();
        await backgroundPage.removeSession(session.id);
        menu.hideMenu();
        populateSessionList();
      });

      const changeIcon = new MenuItem("Change Icon", async () => {
        menu.hideMenu();
      });

      /*
      const changeColor = new MenuItem("Change Color", async () => {
        await addSeparator();
        menu.hideMenu();
      });

      const addSeparatorMenuItem = new MenuItem("Add Separator", async () => {
        //await addSeparator();
        //menu.hideMenu();
      });

      const addFolderMenuItem = new MenuItem("Add Folder", async () => {
        //await addSeparator();
        //menu.hideMenu();
      });

      const changeOrderMenuItem = new MenuItem("Edit Order", async () => {
        //await addSeparator();
        //menu.hideMenu();
      });
      
      const editMenuItem = new MenuItem("Edit Session", async () => {
        const menuItems = [renameMenuItem, changeIcon, changeColor, deleteMenuItem];
        menu.showMenu(event, item, menuItems);
      });

      const menuItems = [editMenuItem, changeOrderMenuItem, addFolderMenuItem, addSeparatorMenuItem];
      */
      const menuItems = [renameMenuItem, changeIcon, deleteMenuItem];
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
    const result = await storage.get(`session-${sessionId}`);
    return result[`session-${sessionId}`];
  },

  async setSession(sessionId, session) {
    await storage.set({ [`session-${sessionId}`]: session });
  },

  async renameSession(sessionId, newName) {
    const session = await this.getSession(sessionId);
    session.name = newName;
    await this.setSession(sessionId, session);
  },

  async removeSession(sessionId) {
    await storage.remove(`session-${sessionId}`);
    const backgroundPage = await browser.extension.getBackgroundPage();
    await backgroundPage.removeAllWindowValues(sessionId);
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