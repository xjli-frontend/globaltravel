
const { ccclass, property } = cc._decorator;
@ccclass
export default class EdgeMaskComponent extends cc.Component {

    spriteOrSpine:cc.Sprite|sp.Skeleton = null;
    onLoad(){
        this.spriteOrSpine = this.node.getComponent(sp.Skeleton);
        if (this.spriteOrSpine){
            let spineMaterial = cc.loader.getRes("common/materials/matl_spineMask",cc.Material);
            this.spriteOrSpine.setMaterial(0,spineMaterial);
        }else{
            this.spriteOrSpine = this.node.getComponent(cc.Sprite);
            let spriteMate = cc.loader.getRes("common/materials/matl_spriteMask",cc.Material);
            this.spriteOrSpine.setMaterial(0,spriteMate);
        }
    }

    enableSpineMask(val:boolean){
        let material = this.spriteOrSpine.getMaterial(0);
        material.setProperty("u_enableMask", val?1:0);
    }

    setYs(y1:number,y2:number){
        let material = this.spriteOrSpine.getMaterial(0);
        material.setProperty("u_startYs",{x:y1,y:y2});

    }
}