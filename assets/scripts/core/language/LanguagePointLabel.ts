import { EngineMessage } from "../EngineMessage";
import { Message } from "../event/MessageManager";
import { LanguageLabel } from "./LanguageLabel";

const { ccclass, property } = cc._decorator;

@ccclass
export class LanguagePointLabel extends LanguageLabel{
    
    @property({
        tooltip: "字大小"
    })
    fontSize:number = 25;

    @property({
        tooltip: "行高"
    })
    lineHeight:number = 30;

    @property({
        tooltip: "点到内容的距离"
    })
    pointSpace:number = 10;

    private isUpdate:boolean = false;
    onLoad(){
        this.initFontSize = this.fontSize;
    }

    update(){
        if(this.isUpdate){
            return;
        }
        this.isUpdate = true;
        this.updateLab(); 
    }

    updateLab(){
        this.node.getComponent(cc.Widget).updateAlignment();
        this.string.split("\n").forEach((text)=>{
            if(text != ""){
                this.createLab(text);
            }
        })
    }

    createLab(text:string){
        let labNode = new cc.Node();
        labNode.width = this.node.width;
        let lab = labNode.addComponent(cc.Label);
        lab.string = text;
        lab.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        lab.verticalAlign = cc.Label.VerticalAlign.CENTER;
        lab.fontSize = this.fontSize;
        lab.lineHeight = this.lineHeight;
        lab.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
        // let isPaytable = this.dataID.match(/^paytable_/) !== null || this.dataID.match(/^rules_/) !== null;
        // if(i18n.currentLanguage == "thai" && isPaytable){
        //     let path = `game/main/thai/upcib`;
        //     let font = cc.loader.getRes(path,cc.TTFFont);
        //     lab.fontSize = this.initFontSize * 1.1;
        //     lab.font = font;
        //     lab.fontFamily = null;
        // }else{
        //     lab.fontSize = this.initFontSize ;
            lab.fontFamily = this.getLabelFont( this.i18n.currentLanguage);
        // }
        lab.string = text;
        labNode.parent = this.node;

        let pointNode = new cc.Node();
        pointNode.parent = labNode;
        pointNode.x = - (labNode.width/2 + this.pointSpace);
        pointNode.y = labNode.height/2 - this.lineHeight/2 - (this.lineHeight - this.fontSize)/2;
        let poineLab = pointNode.addComponent(cc.Label);
        poineLab.fontSize = this.fontSize;
        poineLab.lineHeight = this.lineHeight;
        poineLab.fontFamily = this.getLabelFont( this.i18n.currentLanguage);
        poineLab.string = "•";

        this.layout();
    }

    layout(){
        let layoutCom = this.node.addComponent(cc.Layout);
        layoutCom.type = cc.Layout.Type.VERTICAL;
        layoutCom.spacingY = this.lineHeight/3;
        layoutCom.resizeMode = cc.Layout.ResizeMode.CONTAINER;
    }
}
