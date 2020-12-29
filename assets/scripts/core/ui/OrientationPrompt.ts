/*
 * @CreateTime: Feb 26, 2019 3:19 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Feb 26, 2019 4:13 PM
 * @Description: Modify Here, Please 
 * 
 * 横竖屏旋转提示动画界面
 */

import { EventDispatcher } from "../event/EventDispatcher";
import { EngineMessage } from "../EngineMessage";

export class OrientationPrompt extends EventDispatcher{
    _orientation:number = cc.macro.ORIENTATION_AUTO;
    /**
     * 屏幕旋转提示对象
     * @param orientation 
     */
    constructor( orientation:number = cc.macro.ORIENTATION_LANDSCAPE ){
        super();
        if ( orientation === cc.macro.ORIENTATION_AUTO ){
            return;
        }
        if (cc.sys.isMobile || cc.sys.browserType == cc.sys.BROWSER_TYPE_MIUI){
            let browserType = cc.sys.browserType.toLowerCase();
            if ( browserType.indexOf("baidu")>= 0){
                cc.log(`[OrientationPrompt] 不支持百度浏览器！`);
                return;
            }
            this._orientation = orientation;
            this.on(EngineMessage.GAME_RESIZE, this._screenChange,this)
            this._screenChange();
        }
    }
    _screenChange(){
        let canvasSize = cc.view.getCanvasSize();
        let fit:boolean = canvasSize.width < canvasSize.height;
        if (cc.sys.isBrowser && cc.sys.browserType === cc.sys.BROWSER_TYPE_SAFARI){
            // Safari浏览器的判断规则
            fit = window.innerWidth < window.innerHeight;
        }
        switch(this._orientation){
            case cc.macro.ORIENTATION_LANDSCAPE:{
                if (fit){
                    this.showGuide();
                }else{
                    this.hideGuide();
                }
                break;
            }
            case cc.macro.ORIENTATION_PORTRAIT:{
                if (fit){
                    this.hideGuide();
                }else{
                    this.showGuide();
                }
                break;
            }
        }
    }
    showGuide(){
        let screenPrompt = document.getElementById("screen-prompt");
        if (screenPrompt){
            screenPrompt.style.display = "block";
        }else{
            this.init();
        }
    }
    hideGuide(){
        let screenPrompt = document.getElementById("screen-prompt");
        if (screenPrompt){
            screenPrompt.style.display = "none";
        }
    }
    _createStyle(){
        let _str = "";
        if ( this._orientation == cc.macro.ORIENTATION_LANDSCAPE ){
            _str = `
            .screen-prompt {
                width: 100%;
                height: 100%;
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                z-index: 50;
                background: #212121 url( ./orientation_landscape.gif) center center no-repeat;
                background-size: 30%;
            }`
        }else if ( this._orientation == cc.macro.ORIENTATION_PORTRAIT ){
            _str = `
            .screen-prompt {
                width: 100%;
                height: 100%;
                position: fixed;
                top: 0;
                right: 0;
                bottom: 0;
                left: 0;
                z-index: 50;
                background: #212121 url(./orientation_portrait.gif) center center no-repeat;
                background-size: 30%;
            }`
        }
        let style = document.createElement("style");
        style.type = "text/css";
        try{
        　　style.appendChild(document.createTextNode(_str));
        }catch(ex){
            if (style["styleSheet"]){
                style["styleSheet"].cssText = _str;//针对IE
            }
        }
        let head = document.getElementsByTagName("head")[0];
        head.appendChild(style);
    }

    init(){
        this._createStyle();
        let scriptEle = document.querySelector("script");
        let divEle = document.createElement("div");
        divEle.id = "screen-prompt";
        divEle.className = "screen-prompt";
        scriptEle.parentNode.insertBefore( divEle,scriptEle);
    }
}