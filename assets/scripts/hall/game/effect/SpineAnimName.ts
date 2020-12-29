import engine from "../../../core/Engine";


const { ccclass, property } = cc._decorator;

@ccclass
export default class SpineAnimName extends cc.Component {

    @property
    animName:string = "";

    onLoad(){
        let skeleton = this.getComponent(sp.Skeleton);
        let animations:Array<string> = skeleton.skeletonData.skeletonJson.animations;
        if(animations[this.animName]){
            skeleton.setAnimation(0,this.animName,true);
        }else{
            engine.log.info(`${this.animName}不存在`);
        }
    }
    
}
