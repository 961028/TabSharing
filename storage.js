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

function listFind(key, value) {
    return listGet(key).then(list => {
        return list.indexOf(value) !== -1;
    });
}

function listUpdate(key, value, newValue) {
    return listGet(key).then(list => {
        list[list.indexOf(value)] = newValue;
        set(key, list);
    });
}

function listClear(key) {
    return set(key, []);
}

export default { set, get, remove, listInsert, listRemove, listFind, listUpdate, listClear }