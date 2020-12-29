import engine from "../../../core/Engine";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";


const { ccclass, property } = cc._decorator;

@ccclass
export default class LabStepText extends ComponentExtends {

    _dataId:string = "";

    set dataId(val){
        this.labString = "";
        let str = engine.i18n.getLangByID(val);
        this.endStr = str;
    }
    callback:Function = null;

    speed:number = 0;

    isBegin:boolean = false;
    
    duration:number = 0;

    set labString(str){
        let lab = this.node.getComponent(cc.Label);
        lab.string = str;
        // this.countStr = str;
    }

    get labString(){
        let lab = this.node.getComponent(cc.Label);
        return lab.string;
    }

    onLoad(){
        this.labString = "";
    }

    endStr:string = "";
    // countStr:string = "";
    public changeTo(duration: number, callback?: Function) {
        if (duration == 0) {
            if (callback) callback();
            return;
        }
        this.playAnim(duration, callback);
    }

    /** 播放动画 */
    private playAnim(duration: number, callback?: Function) {
        this.duration = duration;
        this.callback = callback;
        this.speed = this.endStr.split("").length/duration;
        this.isBegin = true;
    }
    
    /** 是否已经结束 */
    private isEnd(str: string): boolean {
        return str == this.endStr;
    }
   
    onDestroy(){
        super.onDestroy();
    }

    fomat(index:number){
        let resultStr = "";
        for(let i=0;i<index;i++){
            if(this.endStr.split("")[i]){
                resultStr += this.endStr.split("")[i];
            }
        }
        return resultStr;
    }

    currentIndex:number = -1;
    countTime:number = 0;
    update(dt) {
        if (this.isBegin) {
            if (this.labString == this.endStr){
                this.isBegin = false;
                this.countTime = 0;
                // this.countStr = "";
                if (this.callback) this.callback();
                return;
            }
            this.countTime += dt;
            let index = this.currentIndex + Math.ceil(this.countTime * this.speed)
            let str = this.fomat( index ) ;
            /** 变化完成 */
            if (this.isEnd(str)) {
                str = this.endStr;
                this.isBegin = false;
                this.countTime = 0;
                // this.countStr = "";
                if (this.callback) this.callback();
            }
            if(str){
                this.labString = str;
            }
        }
    }
    
}
