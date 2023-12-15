'use strict';

export class ContextMenu {
    constructor() {
        const menu = document.createElement("ul");
        menu.classList.add("context-menu");
        document.body.appendChild(menu);
        this.menu = menu;
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
        const windowWidth = window.innerWidth - 8;
        const windowHeight = window.innerHeight - 8;

        const x = Math.min(e.clientX, windowWidth - menuWidth);
        const y = Math.min(e.clientY, windowHeight - menuHeight);

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;

        this.menu.setAttribute("tabindex", "-1"); // Makes the ul focusable
        this.menu.focus();
        this.menu.addEventListener("blur", this.hideMenu.bind(this), true);
        //this.handleFocus(this.menu);
    }

    hideMenu() {
        this.menu.style.display = "none";
    }

    handleFocus(menu) { // from https://blog.srij.dev/roving-tabindex-from-scratch
            const children = Array.from(menu.children);
            let current = 0;
            const handleKeyDown = (e) => {
              if (!['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) return;
              if (e.code === 'Space') {
                children[current].click();
                return;
              }
              const selected = children[current];
              selected.setAttribute('tabindex', -1);
              let next;
              if (e.code === 'ArrowDown') {
                next = current + 1;
                if (current == children.length - 1) {
                  next = 0;
                }
              } else if ((e.code = 'ArrowUp')) {
                next = current - 1;
                if (current == 0) {
                  next = children.length - 1;
                }
              }
              children[next].setAttribute('tabindex', 0);
              children[next].focus();
              current = next;
            };
          
            menu.addEventListener('focus', (e) => {
              if (children.length > 0) {
                menu.setAttribute('tabindex', -1);
                children[current].setAttribute('tabindex', 0);
                children[current].focus();
              }
          
              menu.addEventListener('keydown', handleKeyDown);
            });
          
            menu.addEventListener('blur', (e) => {
              menu.removeEventListener('keydown', handleKeyDown);
            });
          };
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
