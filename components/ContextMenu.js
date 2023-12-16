'use strict';

export class ContextMenu {
    constructor() {
        const menu = document.createElement('ul');
        menu.classList.add('context-menu');
        document.body.appendChild(menu);
        this.menu = menu;
        this.boundHideMenu = this.hideMenu.bind(this);
    }

    clearMenuItems() {
        this.menu.innerHTML = '';
    }

    addMenuItem(menuItem) {
        this.menu.appendChild(menuItem.element);
    }

    renderMenu(e) {
        this.menu.style.display = 'block';
        const menuWidth = this.menu.offsetWidth;
        const menuHeight = this.menu.offsetHeight;
        const windowWidth = window.innerWidth - 8;
        const windowHeight = window.innerHeight - 8;

        const x = Math.min(e.clientX, windowWidth - menuWidth);
        const y = Math.min(e.clientY, windowHeight - menuHeight);

        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
    }

    hideMenu() {
        this.menu.style.display = 'none';
    }

    showMenu(e, targetElement, menuItems) {
        this.clearMenuItems();
        menuItems.forEach(item => this.addMenuItem(item));
        this.targetElement = targetElement;

        this.renderMenu(e);

        //this.setupKeyboardControl(this.menu);

        this.menu.setAttribute('tabindex', '-1'); // Makes the ul focusable
        this.menu.focus();
        this.menu.addEventListener('focusout', this.boundHideMenu, true);

        /*
        const children = Array.from(this.menu.children);
        let focusedChildIndex = -1;
        this.menu.addEventListener('keydown', (e) => {
            if (!['ArrowUp', 'ArrowDown'].includes(e.code)) return;
            this.menu.removeEventListener("focusout", this.boundHideMenu, true);
            if (focusedChildIndex !== -1) {
                children[focusedChildIndex].removeEventListener("focusout", this.boundHideMenu, true);
            }
            // Determine the new child to focus
            if (e.code === 'ArrowDown') {
                focusedChildIndex = (focusedChildIndex + 1) % children.length;
            } else if (e.code === 'ArrowUp') {
                focusedChildIndex = (focusedChildIndex - 1 + children.length) % children.length;
            }

            // Set focus on the new child
            children[focusedChildIndex].setAttribute('tabindex', -1);
            children[focusedChildIndex].focus();
            children[focusedChildIndex].addEventListener("focusout", this.boundHideMenu, true);
        });
        */
    }

    setupKeyboardControl(menu) { // from https://blog.srij.dev/roving-tabindex-from-scratch
        const children = Array.from(menu.children);
        let current = 0;
        const handleKeyDown = (e) => {
            console.log('handlekeydown');
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
            } else if ((e.code === 'ArrowUp')) {
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
            console.log('focus');
            if (children.length > 0) {
                children[current].setAttribute('tabindex', 0);
                children[current].focus();
            }

            menu.addEventListener('keydown', handleKeyDown);
        });
        
        menu.addEventListener('blur', (e) => {
            console.log('blur');
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
        const menuItem = document.createElement('menu');
        menuItem.classList.add('context-menu-item');
        menuItem.innerText = this.label;
        menuItem.addEventListener('click', this.onClick);
        return menuItem;
    }
}
