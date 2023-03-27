async function saveCurrentSession() {
    const tabs = await browser.tabs.query({ currentWindow: true });
    const sessionName = document.getElementById('sessionName').value || generateTemporaryName();
    browser.runtime.sendMessage({ type: 'saveSession', sessionName, tabs });
    document.getElementById('sessionName').value = '';
  }
  
  async function restoreSession() {
    const sessionName = document.getElementById('sessionsList').value;
    const session = await browser.runtime.sendMessage({ type: 'getSession', sessionName });
    if (session) {
      const currentTabs = await browser.tabs.query({ currentWindow: true });
      currentTabs.forEach((tab) => browser.tabs.remove(tab.id));
  
      session.tabs.forEach((tab) => browser.tabs.create({ url: tab.url }));
    }
  }
  
  async function deleteSelectedSession() {
    const sessionName = document.getElementById('sessionsList').value;
    await browser.runtime.sendMessage({ type: 'deleteSession', sessionName });
  }

  async function populateSessionsList() {
    const sessionsList = document.getElementById('sessionsList');
    sessionsList.innerHTML = '';
  
    const sessions = await browser.runtime.sendMessage({ type: 'getSessions' });
    sessions.forEach((session) => {
      const option = document.createElement('option');
      option.value = session.name;
      option.textContent = session.name;
      sessionsList.appendChild(option);
    });
  }

  populateSessionsList();
  
  document.getElementById('sessionsList').addEventListener('change', restoreSession);  
  document.getElementById('saveBtn').addEventListener('click', saveCurrentSession);
  document.getElementById('restoreBtn').addEventListener('click', restoreSession);
  document.getElementById('deleteBtn').addEventListener('click', deleteSelectedSession);
  