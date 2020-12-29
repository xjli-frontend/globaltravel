import { Message } from "../../../core/event/MessageManager";
import { PopViewParams } from "../../../core/gui/Defines";
import { gui } from "../../../core/gui/GUI";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";
import { AudioMessage } from "../../AudioMessage";
import { MapControl } from "../effect/MapControl";


const { ccclass, property } = cc._decorator;

@ccclass
export default class LandmarkComonent extends ComponentExtends {


    onLoad(){
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;
        // manager.enabledDebugDraw = true;
        // manager.enabledDrawBoundingBox = true;
        cc.director.getCollisionManager().enabled = true;
        // cc.director.getCollisionManager().enabledDebugDraw = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd.bind(this), this);
    }

    onTouchEnd(touch,event) {
         // 返回世界坐标
         let touchLoc = touch.getLocation();
         let collider = this.node.getComponent(cc.PolygonCollider);
         if (cc.Intersection.pointInPolygon(touchLoc, collider.world.points)) {
             let parent = main.module.gameMainControl.node.parent;
            let mapControl = parent.getChildByName("content").getComponent(MapControl);
            if(mapControl.isMoving){
                return;
            }
            if(main.module.vm.noviceProgress.novice_7 == 0 && main.module.vm.level == 1){
                return;
            }
            Message.dispatchEvent(AudioMessage.EFFECT, "ui_2")
            main.module.gameMainControl.popup_container.active = true;
            let popViewParams:PopViewParams = {
                touchClose:true,
                modal: true,
                opacity: 160,
                onAdded: (node, params) => {
                    node.x = 0;
                    node.y = 30;
                    node.scale = 0.1;
                    node.RunAction(ezaction.scaleTo(0.3, { scale: 1 }));
                },
                // 节点删除动画
                onBeforeRemove: (node, next) => {
                    node.RunAction(ezaction.scaleTo(0.2, { scale: 0.1 })).onStoped(next);
                }
            }
            gui.customPopup.add(`popup/landmark_progress`, {}, popViewParams)
         }else {
             if (this.node._touchListener) {
                 this.node._touchListener.setSwallowTouches(false);
             }
         }
    }

    

    onDestroy(){
        super.onDestroy();
    }

}
