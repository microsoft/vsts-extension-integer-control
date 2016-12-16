import { Model } from "./model";

/**
 * Class view returns the view of a the control rendered to allow
 * the user to change the value.
 */

export class View {

    private currentValue: string = "";

    constructor(private model: Model, private onInputChanged: Function, private onUpTick: Function, private onDownTick: Function) {
        this._init();
    }

    private _init(): void {

        var container = $("<div />");
        container.addClass("container");

        var wrap = $("<div />");
        wrap.addClass("wrap combo emptyBorder");

        var hitcount = $("<input />").attr("type", "number");
        wrap.append(hitcount);

        this.currentValue = String(this.model.getCurrentValue());

        hitcount.val(this.currentValue);
        hitcount.attr("aria-valuenow", this.currentValue);
        hitcount.change(() => {
            this._inputChanged();
        }).on("keydown", (evt: JQueryKeyEventObject) => {
            if (evt.keyCode === 38) {
                if (this.onUpTick) {
                    this.onUpTick();
                    evt.preventDefault();
                }
            } else if (evt.keyCode === 40) {
                if (this.onDownTick) {
                    this.onDownTick();
                    evt.preventDefault();
                }
            }
        });

        var uptick = $("<div />");
        uptick.addClass("bowtie-icon bowtie-math-plus-box");
        uptick.hide();
        uptick.click(() => {
            this.onUpTick();
        });

        var downtick = $("<div />");
        downtick.addClass("bowtie-icon bowtie-math-minus-box");
        downtick.hide();
        downtick.click(() => {
            this.onDownTick();
        });

        container.append(wrap);
        container.append(downtick);
        container.append(uptick);

        container.hover(() => {
            wrap.addClass("border");
            downtick.show();
            uptick.show();
        }, () => {
            if (!hitcount.is(":focus")) {
                wrap.removeClass("border");
                downtick.hide();
                uptick.hide();
            }
        });

        $("body").append(container);
    }

    private _inputChanged(): void {
        let newValue = Number($("input").val());
        if (this.onInputChanged) {
            this.onInputChanged(newValue);
        }
    }

    public update(value: number) {
        this.currentValue = String(value);
        $("input").val(this.currentValue);
    }
}

