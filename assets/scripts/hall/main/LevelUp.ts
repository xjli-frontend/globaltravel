import { gui } from "../../core/gui/GUI";
import { LabelChange } from "../../core/ui/label/LabelChange";
import { ViewUtils } from "../../core/ui/ViewUtils";


const { ccclass, property } = cc._decorator;
@ccclass
export default class LevelUp extends cc.Component {
    

    @property(cc.Node)
    btn_ok:cc.Node = null;

    @property(sp.Skeleton)
    back_spine:sp.Skeleton = null;

    // @property(sp.Skeleton)
    // btn_spine:sp.Skeleton = null;

    onLoad(){
        this.btn_ok.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        
        let anim = this.back_spine.getComponent(sp.Skeleton);
        anim.setAnimation(0, "reward_fadein", false);
        anim.setCompleteListener((func)=>{
            if(func.animation.name === "reward_fadein"){
                anim.setAnimation(0, "reward_loop", true);
            }
        });
    }
    onDestroy(){
        this.back_spine.setCompleteListener(null);
        this.btn_ok.off(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);

    }
    onAdded(params){
        let viewobj = ViewUtils.nodeTreeInfoLite(this.node);
        viewobj.get("lab_level").getComponent(cc.Label).string = params.level || 99;
        viewobj.get("lab_levelReward").getComponent(LabelChange).changeTo(1,params["reward"] || 16000);

        let calpos = ()=>{
            let labscale = viewobj.get("lab_levelReward").scale;
            let labwidth = viewobj.get("lab_levelReward").width;
            if (labwidth * labscale > 450){
                labscale = 450/labwidth;
                viewobj.get("lab_levelReward").scale = labscale;
            }
            viewobj.get("icon_gold").x = viewobj.get("lab_levelReward").x - (labwidth * labscale/2) - 5;
            // viewobj.get("icon_gold").y = viewobj.get("lab_levelReward").y;
        }
        viewobj.get("lab_levelReward").getComponent(LabelChange).numChange = calpos;
    }

    onTouchHandler(){
        gui.delete(this.node);
    }
}