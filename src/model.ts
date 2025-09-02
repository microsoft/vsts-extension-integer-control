export class Model {
    private _currentValue: number;

    constructor(initialValue: number) {
        this._currentValue = initialValue || 0;
    }

    public setCurrentValue(value: number): void {
        if (value === undefined || value === null) {
            throw new Error("Value cannot be undefined or null");
        }
        this._currentValue = value;
    }

    public decrementValue(): void {
        if (this._currentValue > 0) {
            this.setCurrentValue(this._currentValue - 1);
        }
    }

    public incrementValue(): void {
        this.setCurrentValue(this._currentValue + 1);
    }

    public getCurrentValue(): number {
        return this._currentValue;
    }
}
