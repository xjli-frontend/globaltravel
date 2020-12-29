
export default class SelectBase extends cc.Component {

    protected _selectState: boolean = false;

    public get state(): boolean {
        return this._selectState;
    }

    public set state(value: boolean) {
        if (this._selectState === value){
            return;
        }
        this._selectState = value;
        this.refresh();
    }

    onLoad() {
        this.refresh();
    }

    protected refresh() {
        
    }
}