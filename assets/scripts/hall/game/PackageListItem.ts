
import engine from "../../core/Engine";
import { LanguageLabel } from "../../core/language/LanguageLabel";
import ButtonEffect from "../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../core/ui/ComponentExtends";
import { ViewUtils } from "../../core/ui/ViewUtils";
import main from "../../Main";
import { formatParams } from "../CalcTool";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PackageListItem extends ComponentExtends {


    onLoad() {
        if (!this.node.hasEventListener(cc.Node.EventType.TOUCH_END)) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);
        }
    }

    onBtnHandler(event: cc.Event.EventTouch) {
        if (event.target.name == "btn_package" && this.node.getChildByName("btn_package").getComponent(ButtonEffect).canTouch) {
            if (this.clickCallback) {
                this.clickCallback(this.params, this.reward, this);
                let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
                mainNodes.get("new1").active = false;
                mainNodes.get("new2").active = false;
            }
        }
    }

    /** 店铺达到最大等级时按钮要置灰不可点击*/
    refreshBtnState(){
        let config = main.module.themeConfig.getPropConfigByTag(`add_${this.params["pid"]}`);
        if (config.addType == 4){
            let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
            let storeList = main.module.vm.storeList;
            let maxLv = main.module.themeConfig.getStoreMaxLvById(config.addValue[0]);
            let level = storeList[`store_${config.addValue[0]}`]["level"];
            this.showButtonEffect(mainNodes.get("btn_package"), level < maxLv);
        }
    }
    
    clickCallback: Function = null;
    reward: formatParams = null;
    index: number = 0;
    params: any = null;
    setData(key, params: any) {
        this.params = params;
        let mainNodes = ViewUtils.nodeTreeInfoLite(this.node);
        let sprNode = mainNodes.get("spr");
        sprNode.active = false;
        let config = main.module.themeConfig.getPropConfigByTag(`add_${params["pid"]}`);
        cc.loader.loadRes(`popup/package/prop${config.addType}`, cc.SpriteFrame, (error, resource) => {
            sprNode.getComponent(cc.Sprite).spriteFrame = resource;
            sprNode.active = true;
        });
        mainNodes.get("count").getComponent(cc.Label).string = `x${params["totalCount"] - params["usedCount"]}`;
        mainNodes.get("effect").getComponent(LanguageLabel).dataID = `ui_prop_value${config.addType}`;
        sprNode.scale = 1;
        this.showButtonEffect(mainNodes.get("btn_package"), true);
        mainNodes.get("new1").active = main.module.gamedata.newPropId.indexOf(params["pid"])!=-1;
        mainNodes.get("new2").active = main.module.gamedata.newPropId.indexOf(params["pid"])!=-1;
        if (config.addType == 1) {
            mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}`, `${config.addValue[0]}`);
        } else {
            if (config.addType == 2) {
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_1`, `${config.addValue[0]}`);
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_2`, `${config.addValue[1]}`);
            } else if (config.addType == 3) {
                sprNode.scale = 1.4;
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_1`, `${Math.floor(Number((1 - config.addValue[0]).toFixed(1)) * 100)}%`);
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_2`, `${config.addValue[1]}`);
            } else if (config.addType == 4) {
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_1`, `${engine.i18n.getLangByID(`ui_store_${config.addValue[0]}`)}`);
                mainNodes.get("effect").getComponent(LanguageLabel).setVars(`value${config.addType}_2`, `${config.addValue[1]}`);
            }
        }
        this.refreshBtnState();
        let times = 0;
        switch (params.pid) {
            case 1://12小时
                times = 1 * 60 * 60;
                break;
            case 2://一天
                times = 2 * 60 * 60;
                break;
            case 3://一周
                times = 3 * 60 * 60;
                break;
            case 4://
                times = 12 * 60 * 60;
                break;
        }
        this.reward = main.module.calcUiShow.getTimeStageReward(times);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onBtnHandler, this);

        this.index = null;
        this.params = null;
        this.reward = null;
        this.clickCallback = null;
        super.onDestroy();
    }

    showButtonEffect(btnNode: cc.Node, state: boolean) {
        let color = state ? cc.Color.WHITE : cc.Color.GRAY;
        let btnComp = btnNode.getComponent(ButtonEffect);
        btnNode.color = color;
        if (btnComp) {
            btnComp.canTouch = state;
        }
        let func = (_node) => {
            if (_node.children.length == 0) {
                return;
            }
            for (let child of _node.children) {
                child.color = color;
                func(child);
            }

        }
        func(btnNode)
    }

}