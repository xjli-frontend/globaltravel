
import ButtonEffect from "../../../core/ui/button/ButtonEffect";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";
import { service } from "../../../service/Service";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EditBoxControl extends ComponentExtends {

    @property(ButtonEffect)
    btn:ButtonEffect = null;

    initStr:string = "";

    onLoad(){
    }


    //昵称输入限制
    onEditBoxChanged(){
        cc.log(`onEditBoxChanged`);
        let editbox:cc.EditBox = this.node.getComponent(cc.EditBox);
        // editbox.blur();  //主动让editbox失去焦点，已达到我们替换文本的目的
        let str = "";
        //这个for循环是为了检测每个字符，因为现在的输入法可以一次性输入多个字符
        let reg = new RegExp(/^[\u4e00-\u9fa5]|[A-Za-z0-9]/);
        for(let i = 0; i < editbox.string.split("").length; i++){
            if(reg.test(editbox.string.charAt(i))){
                str += editbox.string.charAt(i);
            }
        }
        editbox.string = str;
        // editbox.focus();//替换完成后在触发焦点，这样不会导致玩家输入中断。
        if(editbox.string == this.initStr ){
            return ;
        }
        if(editbox.string == "" ){
            editbox.string = this.initStr;
            return;
        }
        // service.analytics.logEvent("set_click_name", "", "")
        // main.module.gameProtocol.sendNickName(editbox.string,()=>{
        //     this.initStr = editbox.string;
        //     let gameData = main.module.gamedata;
        //     gameData.nickName = this.initStr;
        // })
    }

    onEditBoxEnded() {
        cc.log(`onEditBoxEnded`);
        let editbox:cc.EditBox = this.node.getComponent(cc.EditBox);
        service.analytics.logEvent("set_click_name", "", "")
        main.module.gameProtocol.sendNickName(editbox.string,()=>{
            this.initStr = editbox.string;
            let gameData = main.module.gamedata;
            gameData.nickName = this.initStr;
        })
    }

    // onEditingReturn() {
    //     cc.log(`onEditingReturn`);
    //     let editbox:cc.EditBox = this.node.getComponent(cc.EditBox);
    //     editbox.blur();  //主动让editbox失去焦点，已达到我们替换文本的目的
    // }
    
    update(){
    }
    
    onDestroy(){
        this.initStr = null;
        super.onDestroy();
    }

}
