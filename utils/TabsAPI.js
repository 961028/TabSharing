export class StorageAPI {
    
    async getCurrentTabs() {
        const tabs = await browser.tabs.query({currentWindow: true});
        return tabs.map(({url, title}) => ({url, title}));
    }
  
    async closeCurrentTabs() {
        const tabs = await this.getCurrentTabs();
        const tabIds = tabs.map(({id}) => id);
        await browser.tabs.remove(tabIds);
    }

    async openTabs(tabData) {
        const tabPromises = tabData.map(({url}) => browser.tabs.create({url}));
        return Promise.all(tabPromises);
    }
}