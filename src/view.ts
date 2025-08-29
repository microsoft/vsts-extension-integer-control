import { Model } from "./model";

export class View {
    private currentValue: string = "";
    private container!: HTMLElement;
    private saveTimeout: number | null = null;

    constructor(
        private model: Model,
        private onInputChanged?: (value: number) => void,
        private onUpTick?: () => void,
        private onDownTick?: () => void
    ) {
        this.init();
    }

    private init(): void {
        // Use the existing control-container from HTML
        const existingContainer = document.getElementById('control-container');
        if (existingContainer) {
            this.container = existingContainer;
            // Clear any existing content
            this.container.innerHTML = '';
        } else {
            // Fallback: create container if it doesn't exist
            this.container = document.createElement('div');
            this.container.className = 'container';
            document.body.appendChild(this.container);
        }

        // Create input wrapper
        const wrap = document.createElement('div');
        wrap.className = 'wrap combo emptyBorder';

        // Create number input
        const input = document.createElement('input');
        input.type = 'number';
        this.currentValue = String(this.model.getCurrentValue());
        input.value = this.currentValue;
        input.setAttribute('aria-valuenow', this.currentValue);

        // Add event listeners
        input.addEventListener('change', () => this.inputChanged());
        input.addEventListener('input', () => this.inputChangedWithDebounce());
        input.addEventListener('blur', () => this.inputChanged());
        input.addEventListener('keydown', (evt) => this.handleKeyDown(evt));

        wrap.appendChild(input);

        // Create increment button
        const uptick = document.createElement('div');
        uptick.className = 'bowtie-icon bowtie-math-plus-box';
        uptick.style.display = 'block';
        uptick.style.cursor = 'pointer';
        uptick.title = 'Increment value';
        uptick.addEventListener('click', () => {
            if (this.onUpTick) {
                this.onUpTick();
            }
        });

        // Create decrement button
        const downtick = document.createElement('div');
        downtick.className = 'bowtie-icon bowtie-math-minus-box';
        downtick.style.display = 'block';
        downtick.style.cursor = 'pointer';
        downtick.title = 'Decrement value';
        downtick.addEventListener('click', () => {
            if (this.onDownTick) {
                this.onDownTick();
            }
        });

        // Add hover effects
        this.container.addEventListener('mouseenter', () => {
            wrap.classList.add('border');
        });

        this.container.addEventListener('mouseleave', () => {
            if (document.activeElement !== input) {
                wrap.classList.remove('border');
            }
        });

        // Add hover effects for buttons
        uptick.addEventListener('mouseenter', () => {
            uptick.style.opacity = '0.7';
        });
        uptick.addEventListener('mouseleave', () => {
            uptick.style.opacity = '1';
        });

        downtick.addEventListener('mouseenter', () => {
            downtick.style.opacity = '0.7';
        });
        downtick.addEventListener('mouseleave', () => {
            downtick.style.opacity = '1';
        });

        // Assemble the UI
        this.container.appendChild(wrap);
        this.container.appendChild(downtick);
        this.container.appendChild(uptick);
    }

    private handleKeyDown(evt: KeyboardEvent): void {
        if (evt.key === 'ArrowUp') {
            if (this.onUpTick) {
                this.onUpTick();
                evt.preventDefault();
            }
        } else if (evt.key === 'ArrowDown') {
            if (this.onDownTick) {
                this.onDownTick();
                evt.preventDefault();
            }
        }
    }

    private inputChanged(): void {
        const input = this.container.querySelector('input') as HTMLInputElement;
        const newValue = Number(input.value);
        if (this.onInputChanged && !isNaN(newValue)) {
            this.onInputChanged(newValue);
        }
    }

    private inputChangedWithDebounce(): void {
        // Clear any existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Set a new timeout to save after 500ms of no typing
        this.saveTimeout = setTimeout(() => {
            this.inputChanged();
            this.saveTimeout = null;
        }, 500);
    }

    public update(value: number): void {
        this.currentValue = String(value);
        const input = this.container.querySelector('input') as HTMLInputElement;
        if (input) {
            input.value = this.currentValue;
        }
    }

    public cleanup(): void {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
    }
}
