export class DragAndDropList {
    constructor(container, onStop = null) {
        this.container = container;
        this.onStop = onStop;
        this.dragTarget = null;
        this.originalIndex = null;
        this.canSwap = true;
        this.swapDelay = 100; // in milliseconds
        this.previousTarget = null; // Add a property to track the previous target

        this.addEventListeners();
    }

    addEventListeners() {
        this.container.addEventListener('dragstart', (event) => this.dragStart(event));
        this.container.addEventListener('dragover', (event) => this.dragOver(event));
        this.container.addEventListener('dragend', (event) => this.dragEnd(event));
        this.container.addEventListener('dragleave', (event) => this.dragLeave(event));
    }

    dragStart(event) {
        this.dragTarget = event.target;
        this.originalIndex = [...this.container.children].indexOf(this.dragTarget);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/html', this.dragTarget.outerHTML);
    }

    dragOver(event) {
        event.preventDefault();

        event.dataTransfer.dropEffect = 'move';
        const target = event.target;

        if (this.canSwap && target && target !== this.dragTarget && target.parentNode === this.container && target !== this.previousTarget && target.draggable) {
            this.previousTarget = target;
            this.canSwap = false;
            setTimeout(() => { this.canSwap = true; }, this.swapDelay);

            const targetIndex = [...this.container.children].indexOf(target);
            const dragTargetIndex = [...this.container.children].indexOf(this.dragTarget);

            const elements = getAffectedElements(this.container, dragTargetIndex, targetIndex);

            // First: get the current bounds for all elements
            const firstBounds = [];
            for (let i = 0; i < elements.length; i++) {
                firstBounds.push(elements[i].getBoundingClientRect());
            }

            // Execute the scripts that cause layout changes
            switchElements(this.container, target, this.dragTarget, dragTargetIndex, targetIndex);

            // Last: get the final bounds for all elements
            const lastBounds = [];
            for (let i = 0; i < elements.length; i++) {
                lastBounds.push(elements[i].getBoundingClientRect());
            }

            // Loop through each element and animate
            for (let i = 0; i < elements.length; i++) {
                // Invert: determine the delta between the
                // first and last bounds to invert the element
                const first = firstBounds[i];
                const last = lastBounds[i];
                const deltaX = first.left - last.left;
                const deltaY = first.top - last.top;
                const deltaW = first.width / last.width;
                const deltaH = first.height / last.height;

                // Play: animate the final element from its first bounds
                // to its last bounds (which is no transform)
                elements[i].animate([
                    {
                        transformOrigin: 'top left',
                        transform: `
                            translate(${deltaX}px, ${deltaY}px)
                            scale(${deltaW}, ${deltaH})
                        `
                    },
                    {
                        transformOrigin: 'top left',
                        transform: 'none'
                    }
                ], {
                    duration: 120,
                    easing: 'ease-in-out',
                    fill: 'both'
                });
            }
        }

        function switchElements(container, target, dragTarget, dragTargetIndex, targetIndex) {
            if (dragTargetIndex < targetIndex) {
                container.insertBefore(dragTarget, target.nextSibling);
            } else {
                container.insertBefore(dragTarget, target);
            }
        }

        function getAffectedElements(container, dragTargetIndex, targetIndex) {
            const minIndex = Math.min(dragTargetIndex, targetIndex);
            const maxIndex = Math.max(dragTargetIndex, targetIndex);
            const affectedElements = [];

            for (let i = minIndex; i <= maxIndex; i++) {
                affectedElements.push(container.children[i]);
            }

            return affectedElements;
        }
    }

    dragLeave(event) {
        const target = event.target;

        if (target && target.parentNode === this.container && target === this.dragTarget) {
            this.previousTarget = null; // Reset the previous target when the drag leaves an element
        }
    }

    dragEnd(event) {
        event.preventDefault();

        if (this.onStop) {
            const newIndex = [...this.container.children].indexOf(this.dragTarget);
            this.onStop(this.originalIndex, newIndex);
        }
    }

    addItem(item) {
        item.setAttribute('draggable', 'true');
        this.container.appendChild(item);
    }

    removeItem(index) {
        const item = this.container.children[index];
        if (item) {
            this.container.removeChild(item);
        }
    }
}
