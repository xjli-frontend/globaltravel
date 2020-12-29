import { ComponentExtends } from "../../core/ui/ComponentExtends";
import main from "../../Main";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LanguageScale extends ComponentExtends{

    @property
    en_scale:number = 1;
    
    onLoad(){
        this.node.scale = 1;
        if(main.module.vm.lang == "en"){
            this.node.scale = this.en_scale;
        }
    }   
    
   
    

    onDestroy(){
        
    }
}



