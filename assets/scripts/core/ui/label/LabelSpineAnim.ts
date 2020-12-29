/*
 * @CreateTime: Dec 28, 2017 3:48 PM
 * @Author: zhljian
 * @Contact: 1065214861@qq.com
 * @Last Modified By: zhljian
 * @Last Modified Time: Dec 28, 2017 3:52 PM
 * @Description: 数字变化组件
 */
import engine from "../../Engine";
import { ComponentExtends } from "../ComponentExtends";

const {ccclass, property} = cc._decorator;

@ccclass
export class LabelSpineAnim extends ComponentExtends {
    @property( cc.Node )
    skeletonNode: cc.Node = null;

    @property({
        type: cc.Label,
        tooltip : "货币符号label"
    })
    cy: cc.Label = null;

    @property( cc.Node )
    cySkeletonNode1: cc.Node = null;

    @property( cc.Node )
    cySkeletonNode2: cc.Node = null;

    @property({
        tooltip : "每个spine的距离"
    })
    skeletonDistance: number = 75;

    public set num(num:number){
        this.currentNum = num;
    }

    public get num():number{
        return this.currentNum;
    }
    private duration: number = 0;       // 持续时间
    private callback: Function = null;  // 完成回调
    private isBegin: boolean = false;   // 是否开始
    private speed: number = 0;          // 变化速度
    private endNum: number = 0;            // 最终值
    private currentNum:number = 0;
    private skeletonObjectArray:Array<wordObject> = [];

    onLoad(){
        this.currentNum = 0;
        this.currentSkeletonArray = [];
        this.skeletonObjectArray = [];
        this.skeletonNode.active = false;
        this.cySkeletonNode1.active = false;
        this.cySkeletonNode2.active = false;
    }

    /**
     * 变化到某值,如果从当前开始的begin传入null
     * @param {number} duration 
     * @param {number} end 
     * @param {Function} [callback]
     */
    public changeTo(duration: number, endNum: number, callback?: Function) {
        if (duration == 0) {
            this.endNum = endNum;
            this.currentNum = endNum;
            this.playAnim(duration, callback);
            if (callback) callback();
            return;
        }
        this.currentNum = 0;
        this.endNum = endNum;
        this.playAnim(duration, callback);
    }

    public changBy( endNum: number, callback?: Function) {
        this.endNum = endNum;
        this.currentNum = endNum;
        this.playAnim(0, callback);
        if (callback) callback();
    }

    /** 播放动画 */
    private playAnim(duration: number, callback?: Function) {
        this.duration = duration;
        this.callback = callback;
        this.speed =  this.endNum / duration;
        this.isBegin = true;
    }

    /** 是否已经结束 */
    private isEnd(num: number): boolean {
        if (this.speed > 0) {
            return num >= this.endNum;
        } else {
            return num <= this.endNum;
        }
    }
    getPosByLength(length:number){
        let leftWidth = -50;   //         
        if( this.cy.string.split("").length > 1 ){
            leftWidth = -20;
        }else if(this.cy.string.split("").length == 0){
            leftWidth = this.skeletonDistance/2 +5;
        }
        let startX = (Math.floor(length/2) * - this.skeletonDistance) + this.cyWidth +leftWidth;
        let distanceArray = [];
        distanceArray.push(startX);
        for(let i=1; i<length; i++){
            distanceArray.push( startX + this.skeletonDistance * i );
        }
        return distanceArray;
    }

    private currentSkeletonArray:Array<wordObject> = [];
    private cyWidth:number = 0;
    update(dt) {
        if (this.isBegin) {
            if (this.currentNum == this.endNum){
                this.isBegin = false;
            }
            let isActive = ()=>{
                this.skeletonObjectArray.forEach((wordObject)=>{
                    if( wordObject.skeletonNode.active ){
                        wordObject.isUse = false;
                    }
                })
            }
            this.currentNum = this.currentNum + dt * this.speed;
            /** 变化完成 */
            if (this.isEnd(this.currentNum)) {
                this.currentNum = this.endNum;
                if (this.callback) this.callback();
            }
            let currentArray = engine.value.toCurrencyFormat(this.currentNum).split("");
            this.getScaleByLength(currentArray.length)
            this.cy.string = engine.value.currencySymbol// + engine.value.currencySymbol;
            let leftWidth = -50;            
            if( this.cy.string.split("").length > 1){
                leftWidth = -20;
            }
            if(this.cy.string.split("").length > 1){
                this.cySkeletonNode1.active = true;
                this.cySkeletonNode2.active = true;
                this.cySkeletonNode1.x = -40;
                this.cySkeletonNode2.x = 30;
            }else if(this.cy.string.split("").length == 0){
                this.cySkeletonNode1.active = false;
                this.cySkeletonNode2.active = false;
                leftWidth = this.skeletonDistance/2 +5;
            }else{
                this.cySkeletonNode1.active = true;
                this.cySkeletonNode2.active = false;
                this.cySkeletonNode1.x = 0;
            }
           
            this.cyWidth = this.cy.string.split("").length * 82;
            let posArray = this.getPosByLength(currentArray.length);
            this.cy.node.x = posArray[0] - this.cyWidth - leftWidth;
            isActive();
            currentArray.forEach((str,index)=>{
                let existNode = this.checkSkeletonObject(str, posArray[index]);
                if(existNode){
                    existNode.skeletonNode.active = true;
                    existNode.isUse = true;
                }else{
                    let targetObject = this.getStrAnim(str, posArray[index]);
                    targetObject.skeletonNode.active = true;
                }
            })
            this.saveSkeletonObjectByActive();
        }
    }

    private nodeScale = 1;
    private getScaleByLength(length:number){
        if(length < 5){
            this.node.scale = 1;
            this.node.x = -20;
        }else if(length < 6){
            this.node.scale = 1;
            this.node.x = -40;
        }else if(length < 8){
            this.node.scale = 1;
            this.node.x = -10;
        }else if(length < 9){
            this.node.scale = 0.85;
            this.node.x = -10;
        }else if(length < 10){
            this.node.scale = 0.7;
            this.node.x = -20;
        }else if(length < 11){
            this.node.scale = 0.7;
            this.node.x = -10;
        }else if(length < 13){
            this.node.scale = 0.6;
            this.node.x = -12;
        }else if(length < 14){
            this.node.scale = 0.55;
            this.node.x = -18;
        }else if(length < 15){
            this.node.scale = 0.55;
            this.node.x = -10;
        }else if(length < 18){
            this.node.scale = 0.45;
            this.node.x = -10;
        }

    }

    saveSkeletonObjectByActive(){
        this.currentSkeletonArray = [];
        this.skeletonObjectArray.forEach((wordObject)=>{
            if(wordObject.isUse){
                this.currentSkeletonArray.push(wordObject);
            }else{
                wordObject.skeletonNode.active = false;
            }
        })
    }

    checkSkeletonObject(str, posX:number){
        let _wordObject = null;
        this.currentSkeletonArray.forEach((wordObject)=>{
            if(str == wordObject.name.split("")[0] && posX == wordObject.skeletonNode.x){
                _wordObject = wordObject;
            }
        })
        return _wordObject;
    }

    private suf = 0;
    getStrAnim(animation:string, posX:number){
        let findNode = (animation):wordObject=>{
            this.skeletonObjectArray.forEach((wordObject)=>{
                if(wordObject.name.split("")[0] == animation){
                    if(!wordObject.isUse){
                        wordObject.skeletonNode.x = posX;
                        return wordObject;
                    }
                }
            })
            return null;
        }
        let targetObject = findNode(animation);
        if( targetObject ){
            targetObject.isUse = true;
            return targetObject;
        }else{
            let _skeletonNode =  cc.instantiate(this.skeletonNode);
            let newObject = new wordObject();
            newObject.skeletonNode = _skeletonNode;
            newObject.name = animation + this.suf++;
            newObject.skeletonNode.parent = this.node;
            newObject.skeletonNode.active = true;
            newObject.skeletonNode.x = posX;
            let anim = ""; 
            if(animation == ","){
                anim = "word11"
            }else if(animation == "."){
                anim = "word10";
            }else{
                anim = "word"+animation;
            }
            newObject.skeletonNode.getComponent(sp.Skeleton).setAnimation(0, anim, true);
            this.skeletonObjectArray.push(newObject);
            return newObject;
        }
    }

}

export class wordObject{
    /** spine */
    skeletonNode:cc.Node
    /** 是否正在使用*/
    isUse:boolean
    /** 名字*/
    name:string

    constructor(){
        this.isUse = true;
    }

 }