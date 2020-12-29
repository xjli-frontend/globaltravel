import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { LabelChangeSymbol } from "../../core/ui/label/LabelChangeSymbol";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";


const { ccclass, property } = cc._decorator;

@ccclass
export default class StoreUnLock extends ComponentExtends {


    onLoad(){
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)){
            this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchHandler, this);
        }
       
    }

    callback:Function = null;
    storeId:number = 1;
    onAdded(params:any){
        this.node.scale = 0;
        this.node.RunAction(ezaction.scaleTo(0.3,{scale:1}));
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        this.storeId = params["storeId"];
        mainNodes.get("store_icon").scale = this.storeId == 4 || this.storeId == 7 ?1.4:1.6;
        mainNodes.get("btn_close").active = params["active"]==0;
        mainNodes.get("store_icon").getComponent(cc.Sprite).spriteFrame = cc.loader.getRes(`main/store_icon/store_icon${this.storeId}`,cc.SpriteFrame);
        mainNodes.get("title").getComponent(LanguageLabel).dataID = `ui_unlock_${params["storeId"]}`;
        this.refreshLab();
        this.callback = params["callback"];
    }

    refreshLab(){
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let price = main.module.calcUiShow.calcTargetPrice(`store_${this.storeId}`,0,1);
        mainNodes.get("lab_num").getComponent(LabelChangeSymbol).num = price;
        this.showButtonEffect(mainNodes.get("btn_buy"),main.module.calcTool.compare(main.module.vm.credit,price));
        mainNodes.get("price").getComponent(cc.Layout).updateLayout();
    }

    showButtonEffect(btnNode:cc.Node,state:boolean){
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp){
            btnComp.canTouch = state;
        }
        let func = (_node)=>{
            if(_node.children.length == 0){
                return;
            }
            for (let child of _node.children){
                if(child.name == "lab_num"){
                    color = cc.Color.BLACK;
                }
                child.color = color;
                func(child);
            }
            
        }
        func(btnNode)
    }

    onTouchHandler(event:cc.Event.EventTouch){
        if(event.target.getComponent(ButtonEffect) && !event.target.getComponent(ButtonEffect).canTouch){
            return;
        }
        switch(event.target.name){
            case "btn_close":{
                this.node.destroy();
                break;
            }
            case "btn_buy":{
                this.node.destroy();
                this.callback && this.callback();
                break;
            }
        }
    }

    onDestroy(){
        this.callback = null;
        this.storeId = null;
        super.onDestroy();
    }

}
