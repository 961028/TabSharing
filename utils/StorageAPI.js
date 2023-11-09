export class StorageAPI {
    
    async get(key) {
        let result = await browser.storage.sync.get(key);
        return result[key];
    }
  
    async set(key, value) {
        let obj = {};
        obj[key] = value;
        await browser.storage.sync.set(obj);
    }
  
    async remove(key) {
        await browser.storage.sync.remove(key);
    }
  
    async getList(key) {
        let result = await browser.storage.sync.get(key);
        return result[key] || [];
    }
  
    async addToList(key, value) {
        let list = await this.getList(key);
        list.push(value);
        await this.set(key, list);
    }
  
    async removeFromList(key, value) {
        let list = await this.getList(key);
        let index = list.indexOf(value);
        if (index > -1) {
            list.splice(index, 1);
            await this.set(key, list);
        }
    }
}