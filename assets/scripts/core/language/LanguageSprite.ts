import { LanguageComponent } from "./LanguageComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export class LanguageSprite extends LanguageComponent{

    /** spriteFrame 路径 */
    @property(cc.String)
    public spriteFramePath:string = "";

    start(){
        this.updateSprite( this.i18n.currentLanguage )
    }

    public set language(lang:string){
        this.updateSprite(lang);
    }

    updateSprite(lang:string){
        do {
            let spcomp:cc.Sprite = this.node.getComponent(cc.Sprite);
            if (!spcomp){
                cc.warn("[LanguageSprite], state = 1");
                break;
            }
            let currentspfpath = this.spriteFramePath;
            if (spcomp.spriteFrame){
                // 旧有的cc.SpriteFrame的uuid
                let oldspfuuid = spcomp.spriteFrame["_uuid"];
                // 旧有的uuid的相对路径。
                currentspfpath = this.i18n.parseUuidToUrl(oldspfuuid);
                if (!currentspfpath){
                    cc.warn("[LanguageSprite], state = 2");
                    break;
                }
            }else{
                // cc.log("纹理对象为空，无法切换多语种图片",this.node.name);
                // return;
            }
            if (!currentspfpath){
                cc.log("纹理对象为空，无法切换多语种图片",this.node.name);
                break;
            }
            let o_arr =currentspfpath.split("/").reverse();
            let hasfind = false;
            for (let i=0;i<o_arr.length;i++){
                if ( this.i18n.isExist(o_arr[i]) ){
                    if (o_arr[i] === lang){
                        //前后两个语种一致,则不做任何处理
                        this.spriteFramePath = currentspfpath
                        return;
                    }
                    hasfind = true;
                    o_arr[i] = lang;
                    break;
                }
            }
            if (!hasfind){
                cc.warn("当前节点不支持语言更换，请检查文件路径是否有效，"+currentspfpath)
            }
            // 新语言的SpriteFrame路径
            let newspfpath = o_arr.reverse().join("/");
            let newspf = cc.loader.getRes(newspfpath,cc.SpriteFrame);
            if (!newspf){
                cc.warn("[LanguageSprite] newspf is null "+newspfpath);
                break;
            }
            this.spriteFramePath = newspfpath;
            spcomp.spriteFrame= newspf;
        } while (false);
    }
}
