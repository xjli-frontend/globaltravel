import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import { ComponentExtends } from "../../core/ui/ComponentExtends";

const { ccclass, property } = cc._decorator;

const clerk12_pos = new cc.Vec2(255, -230);
const clerk11_pos = new cc.Vec2(870, -570)
@ccclass
export default class ClerkComponent extends ComponentExtends {

    @property(sp.Skeleton)
    skeleton: sp.Skeleton = null;

    dataIds: Array<string> = [];

    storePos: cc.Vec2 = null;
    leftPos: cc.Vec2 = null;
    rightPos: cc.Vec2 = null;
    onLoad() {
        let str = this.node.name.split("_")[1];
        // let skd = cc.loader.getRes(`main/clerk_skeleton/clerk_${str}/clerk_${str}`, sp.SkeletonData);
        cc.loader.loadRes(`animator/clerk_skeleton/clerk_${str}/clerk_${str}`, sp.SkeletonData, (err, skd) => {
            if (err) {
                cc.error(err);
                return;
            }
            this.skeleton.skeletonData = skd;
            if(str == "2"){
                this.skeleton.premultipliedAlpha = true;
            }
            this.ObverseReverseSpecial();
        })
        if (str == "11") {
            this.storePos = clerk11_pos;
            this.rightPos = new cc.Vec2(2250, 1455);
            this.leftPos = new cc.Vec2(2040, 1350);
        } else if (str == "12") {
            this.storePos = clerk12_pos;
            this.rightPos = new cc.Vec2(2760, 1080);
            this.leftPos = new cc.Vec2(2520, 960);
        }  else if (parseInt(str)<5) {
            this.storePos = this.node.parent.getChildByName(`store_${str}`).getPosition();
            this.rightPos = new cc.Vec2(this.storePos.x + 140, this.storePos.y);
            this.leftPos = new cc.Vec2(this.storePos.x - 20, this.storePos.y - 60);
        } else {
            this.storePos = this.node.parent.getChildByName(`store_${str}`).getPosition();
            this.rightPos = new cc.Vec2(this.storePos.x + 200, this.storePos.y + 0);
            this.leftPos = new cc.Vec2(this.storePos.x - 20, this.storePos.y - 80);
        }
        this.node.setPosition(this.rightPos);
        this.initX = this.node.x;
        this.loopPlayLabStr(str);
    }



    loopPlayLabStr(clerkId) {
        let str = this.node.name.split("_")[1];
        this.schedule(() => {
            let skeleton = this.node.getChildByName("emoticon").getComponent(sp.Skeleton);
            skeleton.setSkin(`clerk_${str}`);
            skeleton.setAnimation(0,"reward",false);
        }, 10 + 8 * clerkId);
    }





    initX: number = 610;
    /** 正面反面特殊动作组合 */
    ObverseReverseSpecial() {
        this.moveAction(4, 400);
    }

    getRandomNum(begin: number, end: number) {
        let result = Math.random() * (end - begin) + begin;
        return result;
    }

    moveAction(duration: number, distance: number,) {
        let direction = 1;
        let centerPos = new cc.Vec2((this.leftPos.x + this.rightPos.x) / 2, (this.leftPos.y + this.rightPos.y) / 2)
        this.skeleton.setAnimation(0, `reward_move_1`, true);
        let callback = () => {
            this.node.RunAction(ezaction.moveTo(2, { x: this.leftPos.x, y: this.leftPos.y })).onStoped(() => {
                this.skeleton.setAnimation(0, `reward_move_2`, true);
                this.node.RunAction(ezaction.moveTo(duration, { x: this.rightPos.x, y: this.rightPos.y })).onStoped(() => {
                    this.moveAction(4, 400);
                })
            })
        }
        this.skeleton.setCompleteListener((func) => {
            if (func.animation.name == "reward_show_1") {
                this.skeleton.setAnimation(0, `reward_move_1`, true);
                callback();
            }
        })
        this.node.RunAction(ezaction.moveTo(2, { x: centerPos.x, y: centerPos.y })).onStoped(() => {
            if (direction > 0) {
                this.skeleton.setAnimation(0, "reward_show_1", false);
            } else {
                callback();
            }
        })
    }

    update() {
        let str = this.node.name.split("_")[1]
        if (str == "11" || str == "12") {
            this.node.zIndex = 0;
        } else {
            this.node.zIndex = 9999 - this.node.y;
        }
        if(!this.skeleton.node.active){
            cc.warn(`店员动画active变成false或者动画Data加载异常`+this.skeleton.node.active);
        }
    }

    panelAnim() {
        let panelNode = this.node.getChildByName("panel");
        panelNode.active = true;
        panelNode.scaleY = 0;
        panelNode.RunAction(ezaction.scaleTo(0.5, { scaleY: 1 })).onStoped(() => {
            panelNode.RunAction(ezaction.scaleTo(0.5, { scaleY: 0, delay: 3 },))
        });
    }

    setDataId() {
        let index = Math.round(Math.random() * (this.dataIds.length - 1) + 1);
        let dataId = this.dataIds[index - 1];
        let panelNode = this.node.getChildByName("panel");
        panelNode.getChildByName("lab").getComponent(LanguageLabel).dataID = dataId;
    }
    
    initDataIds(clerkId: number) {
        for (let i = 1; i < 10; i++) {
            let dataId = `npc_clerk_${clerkId}_${i}`;
            let string = engine.i18n.getLangByID(dataId);
            if (string) {
                this.dataIds.push(dataId);
            }
        }
        this.node.getChildByName("panel").scaleY = 0;
        this.loopPlayLabStr(clerkId);
    }

    onDestroy() {
        // cc.loader.releaseAsset(this.skeleton.skeletonData)
        // this.skeleton.skeletonData = null;
        this.dataIds = null;
        this.storePos = null;
        this.leftPos = null;
        this.rightPos = null;
        super.onDestroy();
    }


}