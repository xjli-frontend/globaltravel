import { ComponentExtends } from "./ComponentExtends";
import { EngineMessage } from "../EngineMessage";
import engine from "../Engine";
import { ViewUtils } from "./ViewUtils";

/*
 * @CreateTime: Jul 10, 2018 5:28 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 6:51 PM
 * @Description: Modify Here, Please 
 * 全屏界面组件
 * 横屏 1280 * 720
 * 竖屏 720 * 1280
 */

const { ccclass } = cc._decorator;

@ccclass
export class ViewLayout extends ComponentExtends{
    onLoad(){
        if (!CC_EDITOR){
            this.on(EngineMessage.GAME_RESIZE,this.evtHandler,this)
            this._layout();
        }
    }
    private evtHandler(evt){
        switch(evt){
            case EngineMessage.GAME_RESIZE:{
                this._layout();
                break;
            }
        }
    }
    protected _layout(){
        this.node.setContentSize(engine.designWidth, engine.designHeight);
    }
}