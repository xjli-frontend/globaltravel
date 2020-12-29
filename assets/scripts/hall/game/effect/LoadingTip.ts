
import { LanguageLabel } from "../../../core/language/LanguageLabel";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingTip extends ComponentExtends {

    /** 获取begin到length的随机数 整数 */
    public getRandomNum = function (begin: number, length: number) {
        return Math.round(Math.random() * (length - begin) + begin);
    };
    
    onLoad(){
        let comp = this.node.getComponent(LanguageLabel);
        comp.dataID = `tips_${this.getRandomNum(1,10)}`;
        this.schedule(()=>{
            comp.dataID = `tips_${this.getRandomNum(1,10)}`;
        },5)
    }

   
    onDestroy(){
        this.unscheduleAllCallbacks();
        super.onDestroy();
    }

}
