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

export { set, get, remove };