function set(key, value) {
    browser.storage.local.set({ [key]: value });
}

function get(key) {
    return browser.storage.local.get(key)
}

function remove(key) {
    browser.storage.local.remove(key)
}

function listGet(key) {
    return get(key).then(list => {
        if (list[key] === undefined) {
            list[key] = [];
        }
        return list[key];
    });
}

function listInsert(key, value) {
    return listGet(key).then(list => {
        list.push(value);
        set(key, list);
    });
}

function listRemove(key, value) {
    return listGet(key).then(list => {
        list.splice(list.indexOf(value), 1);
        set(key, list);
    });
}

function listContains(key, value) {
    return listGet(key).then(list => {
        return list.includes(value);
    });
}

export default { set, get, remove, listInsert, listRemove, listContains }