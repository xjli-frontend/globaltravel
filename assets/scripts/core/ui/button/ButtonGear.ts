import ButtonEffect from "./ButtonEffect";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonGear extends ButtonEffect {

    _currentFrameIndex:number = 0;

    get currentFrameIndex(): number {
        return this._currentFrameIndex;
    }

    set currentFrameIndex(index:number) {
        this._currentFrameIndex = index;
        if( index > this.node.children.length-1 ){
            this._currentFrameIndex = 0;
        }
    }
    
    onLoad(){
        super.onLoad();
    }

    onEnable() {
    }

    onDisable() {
    }

    onTouchEnd(event) {
        if (this.canTouch) {
            super.onTouchEnd(event);
            this.currentFrameIndex++;
        }
    }
}