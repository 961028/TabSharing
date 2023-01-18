function set(key, value) {
    // Sets a key-value pair in the browser's local storage
    browser.storage.local.set({ [key]: value });
}

function get(key) {
    // Gets the value of a key from the browser's local storage
    return browser.storage.local.get(key)
}

function remove(key) {
    // Removes a key-value pair from the browser's local storage
    browser.storage.local.remove(key)
}


function listGet(key) {
    // Gets the list stored under key in the browser's local storage
    return get(key).then(result => {
        if (result[key] === undefined) {
            return [];
        } else {
            return result[key];
        }
    });
}

function listAdd(key, value) {
    // Adds value to the list stored under key in the browser's local storage
    return listGet(key).then(list => {
        if (list.indexOf(value) === -1) {
            list.push(value);
            set(key, list);
        }
    });
}

function listRemove(key, value) {
    // Removes value from the list stored under key in the browser's local storage
    return listGet(key).then(list => {
        let index = list.indexOf(value);
        if (index !== -1) {
            list.splice(index, 1);
            set(key, list);
        }
    });
}