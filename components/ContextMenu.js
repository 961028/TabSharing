export class ContextMenu {
    constructor() {
        this.createMenu();
    }

    createMenu() {
        const menu = document.createElement("ul");
        menu.classList.add("context-menu");
        document.body.appendChild(menu);
        this.menu = menu;

        document.addEventListener("click", () => {
            this.hideMenu();
        });
    }

    clearMenuItems() {
        this.menu.innerHTML = '';
    }

    addMenuItem(menuItem) {
        this.menu.appendChild(menuItem.element);
    }

    showMenu(e, targetElement, menuItems) {
        this.clearMenuItems();
        menuItems.forEach(item => this.addMenuItem(item));
        this.targetElement = targetElement;

        this.menu.style.display = "block";
        const menuWidth = this.menu.offsetWidth;
        const menuHeight = this.menu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const x = Math.min(e.clientX, windowWidth - menuWidth);
        const y = Math.min(e.clientY, windowHeight - menuHeight);

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
    }

    hideMenu() {
        this.menu.style.display = "none";
    }
}

export class MenuItem {
    constructor(label, onClick) {
        this.label = label;
        this.onClick = onClick;
        this.element = this.createMenuItemElement();
    }

    createMenuItemElement() {
        const menuItem = document.createElement("menu");
        menuItem.classList.add("context-menu-item");
        menuItem.innerText = this.label;
        menuItem.addEventListener("click", this.onClick);
        return menuItem;
    }
}
