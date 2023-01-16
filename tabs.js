function save() {
  storeLocal();
}

function load() {
  loadLocal();
}

function storeLocal() {

  let tab = {
    name: "Moggy",
    tentacles: false,
    eyeCount: 2
  }

  let window = {
    name: "Kraken",
    tentacles: true,
    eyeCount: 10
  }

  browser.storage.local.set({
    tab,
    window
  });
}

function loadLocal() {
  browser.sessions.getRecentlyClosed().then((sessions) => {
    if(sessions[0].tab) {
      alert(sessions[0].tab.url);
    } else {
      alert(sessions[0].window.sessionId);
    }
  })
}

browser.windows.onCreated.addListener((window) => {
  console.log("New window: " + window.id);
});


/*
function restoreMostRecent(sessionInfos) {
  if (!sessionInfos.length) {
    console.log("No sessions found")
    return;
  }
  let sessionInfo = sessionInfos[0];
  if (sessionInfo.tab) {
    browser.sessions.restore(sessionInfo.tab.sessionId);
  } else {
    browser.sessions.restore(sessionInfo.window.sessionId);
  }
}

function onError(error) {
  console.log(error);
}

function load() {
  let gettingSessions = browser.sessions.getRecentlyClosed({
    maxResults: 1
  });
  gettingSessions.then(restoreMostRecent, onError);
}

function save() {
  browser.windows.getLastFocused().then((session) => {
    browser.sessions.setWindowValue(
      session.windowId,
      "name",
      "test"
    );

    browser.sessions.getWindowValue(
      session.windowId,
      'name'
    ).then((sessionName) => {
      alert(sessionName);
    });
    alert("test");
  });
}
*/
/*
async function save() {
  let currentWindow = await browser.windows.getLastFocused();
  await browser.sessions.setWindowValue(currentWindow.id, "my-key", "my-value");
}

async function load() {
  let currentWindow = await browser.windows.getLastFocused();
  browser.sessions.getWindowValue(currentWindow.id, "my-key").then(onGetResolved, onGetRejected);
}

function onGetResolved(r) {
  alert('success');
  //alert(`success: ${r}`);
}

function onGetRejected(e) {
  alert('error');
  //alert(`error: ${e}`);
}

function save() {

}

function listSessions() {
  browser.sessions.getRecentlyClosed().then((sessions) => {
    let sessionList = document.getElementById("session-list");
    let sessionDisplay = document.createDocumentFragment();
    sessionList.textContent = '';

    for (let session of sessions) {
      if (session.window) {
        let sessionLink = document.createElement('a');
             
        sessionLink.textContent = session.window.title;

        sessionLink.setAttribute('href', session.sessionId);
        sessionLink.classList.add('switch-tabs');
        sessionDisplay.appendChild(sessionLink);
      }
    }

    sessionList.appendChild(sessionDisplay);
  });
}

function listWindows() {
  browser.windows.getAll().then((sessions) => {
    let sessionList = document.getElementById("windows-list");
    let sessionDisplay = document.createDocumentFragment();
    sessionList.textContent = '';

    for (let session of sessions) {
      let sessionLink = document.createElement('a');
              
      browser.sessions.getWindowValue(
        session.id,
        'name'
      ).then(
        (a) => {sessionLink.textContent = session.title || "untitled window";}, 
        (b) => {sessionLink.textContent = "could not find value";}
      );

      sessionLink.setAttribute('href', session.sessionId);
      sessionLink.classList.add('switch-tabs');
      sessionDisplay.appendChild(sessionLink);
    }

    sessionList.appendChild(sessionDisplay);
  });
}

document.addEventListener("DOMContentLoaded", listWindows);
document.addEventListener("DOMContentLoaded", listSessions);
*/

// tabstabstabs

// Zoom constants. Define Max, Min, increment and default values
const ZOOM_INCREMENT = 0.2;
const MAX_ZOOM = 5;
const MIN_ZOOM = 0.3;
const DEFAULT_ZOOM = 1;


function firstUnpinnedTab(tabs) {
  for (var tab of tabs) {
    if (!tab.pinned) {
      return tab.index;
    }
  }
}

/**
 * listTabs to switch to
 */
function listTabs() {
  getCurrentWindowTabs().then((tabs) => {
    let tabsList = document.getElementById('tabs-list');
    let currentTabs = document.createDocumentFragment();
    let limit = 100;
    let counter = 0;

    tabsList.textContent = '';

    for (let tab of tabs) {
      if (!tab.active && counter <= limit) {
        let tabLink = document.createElement('a');

        tabLink.textContent = tab.title || tab.id;
        tabLink.setAttribute('href', tab.id);
        tabLink.classList.add('switch-tabs');
        currentTabs.appendChild(tabLink);
      }

      counter += 1;
    }

    tabsList.appendChild(currentTabs);
  });
}

document.addEventListener("DOMContentLoaded", listTabs);

function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}

document.addEventListener("click", (e) => {
  function callOnActiveTab(callback) {
    getCurrentWindowTabs().then((tabs) => {
      for (var tab of tabs) {
        if (tab.active) {
          callback(tab, tabs);
        }
      }
    });
}
  if (e.target.id === "save") {
    save();
  }

  if (e.target.id === "load") {
    load();
  }

  if (e.target.id === "tabs-move-beginning") {
    callOnActiveTab((tab, tabs) => {
      var index = 0;
      if (!tab.pinned) {
        index = firstUnpinnedTab(tabs);
      }
      console.log(`moving ${tab.id} to ${index}`)
      browser.tabs.move([tab.id], {index});
    });
  }

  if (e.target.id === "tabs-move-end") {
    callOnActiveTab((tab, tabs) => {
      var index = -1;
      if (tab.pinned) {
        var lastPinnedTab = Math.max(0, firstUnpinnedTab(tabs) - 1);
        index = lastPinnedTab;
      }
      browser.tabs.move([tab.id], {index});
    });
  }

  else if (e.target.id === "tabs-duplicate") {
    callOnActiveTab((tab) => {
      browser.tabs.duplicate(tab.id);
    });
  }

  else if (e.target.id === "tabs-reload") {
    callOnActiveTab((tab) => {
      browser.tabs.reload(tab.id);
    });
  }

  else if (e.target.id === "tabs-remove") {
    callOnActiveTab((tab) => {
      browser.tabs.remove(tab.id);
    });
  }

  else if (e.target.id === "tabs-create") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions"});
  }

  else if (e.target.id === "tabs-create-reader") {
    browser.tabs.create({url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions", openInReaderMode: true});
  }

  else if (e.target.id === "tabs-alertinfo") {
    callOnActiveTab((tab) => {
      let props = "";
      for (let item in tab) {
        props += `${ item } = ${ tab[item] } \n`;
      }
      alert(props);
    });
  }

  else if (e.target.id === "tabs-add-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the maximum zoomFactor is 5, it can't go higher
        if (zoomFactor >= MAX_ZOOM) {
          alert("Tab zoom factor is already at max!");
        } else {
          var newZoomFactor = zoomFactor + ZOOM_INCREMENT;
          //if the newZoomFactor is set to higher than the max accepted
          //it won't change, and will never alert that it's at maximum
          newZoomFactor = newZoomFactor > MAX_ZOOM ? MAX_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }

  else if (e.target.id === "tabs-decrease-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        //the minimum zoomFactor is 0.3, it can't go lower
        if (zoomFactor <= MIN_ZOOM) {
          alert("Tab zoom factor is already at minimum!");
        } else {
          var newZoomFactor = zoomFactor - ZOOM_INCREMENT;
          //if the newZoomFactor is set to lower than the min accepted
          //it won't change, and will never alert that it's at minimum
          newZoomFactor = newZoomFactor < MIN_ZOOM ? MIN_ZOOM : newZoomFactor;
          browser.tabs.setZoom(tab.id, newZoomFactor);
        }
      });
    });
  }

  else if (e.target.id === "tabs-default-zoom") {
    callOnActiveTab((tab) => {
      var gettingZoom = browser.tabs.getZoom(tab.id);
      gettingZoom.then((zoomFactor) => {
        if (zoomFactor == DEFAULT_ZOOM) {
          alert("Tab zoom is already at the default zoom factor");
        } else {
          browser.tabs.setZoom(tab.id, DEFAULT_ZOOM);
        }
      });
    });
  }

  else if (e.target.classList.contains('switch-tabs')) {
    var tabId = +e.target.getAttribute('href');

    browser.tabs.query({
      currentWindow: true
    }).then((tabs) => {
      for (var tab of tabs) {
        if (tab.id === tabId) {
          browser.tabs.update(tabId, {
              active: true
          });
        }
      }
    });
  }

  e.preventDefault();
});

//onRemoved listener. fired when tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`The tab with id: ${tabId}, is closing`);

  if(removeInfo.isWindowClosing) {
    console.log(`Its window is also closing.`);
  } else {
    console.log(`Its window is not closing`);
  }
});

//onMoved listener. fired when tab is moved into the same window
browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  var startIndex = moveInfo.fromIndex;
  var endIndex = moveInfo.toIndex;
  console.log(`Tab with id: ${tabId} moved from index: ${startIndex} to index: ${endIndex}`);
});