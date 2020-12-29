import engine from "../../../core/Engine";
import { gui } from "../../../core/gui/GUI";
import { ComponentExtends } from "../../../core/ui/ComponentExtends";
import main from "../../../Main";


const { ccclass, property } = cc._decorator;
@ccclass
export class MapControl extends ComponentExtends {

    @property({
        type: cc.Node,
        tooltip: '目标节点，当mapContainer为null时，需要将该组件挂在目标节点，该节点默认为挂载节点'
    })
    public map: cc.Node = null;

    @property({
        type: cc.Node,
        tooltip: '当该节点为空时，需要将改组件挂在map节点上，该节点默认为挂载节点的父节点'
    })
    public mapContainer: cc.Node = null;

    @property(cc.Label)
    public scaleTime: cc.Label = null;

    @property({
        tooltip: '图片缩放最大scale'
    })
    public maxScale: number = 3;

    @property({
        tooltip: '图片缩放最小scale'
    })
    public minScale: number = 1;

    @property({
        tooltip: '初始scale'
    })
    public initScale: number = 1;

    @property({
        tooltip: '单点触摸容忍误差'
    })
    public moveOffset: number = 2;

    @property({
        tooltip: '滚轮缩放比率'
    })
    public increaseRate: number = 10000;

    @property({
        tooltip: '允许超出边界值'
    })
    public limit: number = 200;

    @property({
        tooltip: '惯性阀值'
    })
    public threshold: number = 1.5;
    

    public operLock: boolean = false; // 操作锁
    public mapTouchList: any[] = []; // 触摸点容器
    public singleTouchCb: Function = null; // 单点回调函数
    
    
    public _isMoving: boolean = false; // 是否拖动地图flag
    set isMoving(val:boolean){
        this._isMoving = val;
        main.module.vm.isMoving = val;
    }

    get isMoving(){
        return this._isMoving;
    }
    protected start(): void {
        if (!this.map) this.map = this.node;
        if (!this.mapContainer) this.mapContainer = this.node.parent;
        this.addEvent();

        this.initNode();

    }

    initNode(){
        if (this.initScale) {
            this.node.scale = this.initScale;
        }
        this.node.x = -815;
        this.node.y = 15;
        this.cloudOpacity();
    }

    onDestroy() {
        if (this.map) {
            this.map.targetOff(this);
        }
        this.operLock = null; // 操作锁
        this.isMoving = null; // 操作锁
        this.mapTouchList = null; // 操作锁
        this.singleTouchCb = null; // 操作锁
        super.onDestroy();
    }

    private addEvent(): void {
        this.map.on(cc.Node.EventType.TOUCH_MOVE, (event: any) => {
            if (gui.customPopup.size()>0) {
                return;
            }
            main.module.mainScene.showStoresName(true,this.map.scale);
            if (this.operLock) return; // 如果触摸操作暂时锁定则不响应
            let touches: any[] = event['getTouches'](); // 获取所有触摸点
            // 1.x当多点触摸的时候 第二个触摸点即使不在node上也能进来 而且target也是当前node
            // 通过rect是否包含当前触摸点来过滤无效的触摸点
            touches
                .filter(v => {
                    let startPos: cc.Vec2 = cc.v2(v.getStartLocation().x, v.getStartLocation().y);
                    let worldPos: cc.Vec2 = this.mapContainer.convertToWorldSpaceAR(cc.Vec2.ZERO);
                    let worldRect: cc.Rect = cc.rect(
                        worldPos.x - this.mapContainer.width / 2,
                        worldPos.y - this.mapContainer.height / 2,
                        this.mapContainer.width,
                        this.mapContainer.height
                    );
                    return worldRect.contains(startPos);
                })
                .forEach(v => { // 将有效的触摸点放在容器里自行管理
                    let temp: any[] = this.mapTouchList.filter(v1 => v1.id === v.getID());
                    if (temp.length === 0) {
                        this.mapTouchList.push({ id: v.getID(), touch: v });
                    }
                })
                ;
                this.mouseDown = true;
            if (this.mapTouchList.length >= 2) {
                // 如果容器内触摸点数量超过1则为多点触摸，此处暂时不处理三点及以上的触摸点，可以根据需求来处理
                this.isMoving = true;
                this.dealTouchData(this.mapTouchList, this.map);
            } else if (this.mapTouchList.length === 1) {
                // sigle touch
                let touch: any = this.mapTouchList[0].touch;
                let startPos: cc.Vec2 = cc.v2(touch.getStartLocation());
                let nowPos: cc.Vec2 = cc.v2(touch.getLocation());
                // 有些设备单点过于灵敏，单点操作会触发TOUCH_MOVE回调，在这里作误差值判断
                if ((Math.abs(nowPos.x - startPos.x) <= this.moveOffset
                    || Math.abs(nowPos.y - startPos.y) <= this.moveOffset)
                    && !this.isMoving) {
                    return;
                }
                let dir: cc.Vec2 = cc.v2(touch.getDelta());
                this.isMoving = true;
                this.dealMove(dir, this.map, this.mapContainer);
               
            }
        }, this);


        this.map.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            if (gui.customPopup.size()>0) {
                return;
            }
            if (this.operLock) return cc.log('operate is lock');
            this.finalPos = event.touch.getLocation();
            this.finalTime = event.touch["_lastModified"];
        }, this);

        this.map.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            engine.log.info(`${event.target.name}MapControl,TOUCH_END`);
            if (gui.customPopup.size()>0) {
                return;
            }
            main.module.mainScene.showStoresName(false,this.map.scale);
            if (this.operLock) return cc.log('operate is lock');
            // 需要自行管理touches队列, cocos 的多点触控并不可靠
            if(this.isMoving && this.mapTouchList.length >= 2){
                cc.log(`TOUCH_END双指回弹`);
                this.twoScaleAnim();
            }
            if(this.isMoving && this.mapTouchList.length < 2){
                this.dealMoveAction(event);
            }
            if (this.mapTouchList.length < 2) {
                if (!this.isMoving) {
                    let worldPos: cc.Vec2 = cc.v2(event['getLocation']());
                    let nodePos: cc.Vec2 = this.map.convertToNodeSpaceAR(worldPos);
                    this.dealSelect(nodePos);
                }
                this.isMoving = false; // 当容器中仅剩最后一个触摸点时讲移动flag还原
            };
            this.removeTouchFromContent(event, this.mapTouchList);
        }, this);

        this.map.on(cc.Node.EventType.MOUSE_DOWN, (event) => {
            main.module.mainScene.showStoresName(false,this.map.scale);
            if (this.operLock) return;
            this.mouseDown = true;
        }, this);
        
        this.map.on(cc.Node.EventType.MOUSE_UP, (event) => {
            main.module.mainScene.showStoresName(false,this.map.scale);
            if (this.operLock) return;
            this.mouseDown = false;
        }, this);

        this.map.on(cc.Node.EventType.TOUCH_CANCEL, (event) => {
            if (this.operLock) return;
            if(this.isMoving && this.mapTouchList.length >= 2){
                cc.log(`TOUCH_CANCEL双指回弹`);
                this.twoScaleAnim();
            }
            if(this.isMoving && this.mapTouchList.length < 2){
                this.dealMoveAction(event);
            }
            if (this.mapTouchList.length < 2) { // 当容器中仅剩最后一个触摸点时讲移动flag还原
                this.isMoving = false;
            };
            main.module.mainScene.showStoresName(false,this.map.scale);
            this.removeTouchFromContent(event, this.mapTouchList);
        }, this);

        this.map.on(cc.Node.EventType.MOUSE_WHEEL, (event) => {
            if (this.operLock) return;
            // cc.log('==== MOUSE WHEEL ===');
            if (gui.customPopup.size()>0) {
                return;
            }
            let location: any = event['getLocation']();
            let worldPos: cc.Vec2 = cc.v2(location.x, location.y);
            let scrollDelta: number = event['getScrollY']();
            let scale: number = (this.map.scale + (scrollDelta / this.increaseRate));

            let target: cc.Node = this.map;
            let pos: cc.Vec2 = target.convertToNodeSpaceAR(worldPos);
            this.smoothOperate(target, pos, scale,false);
        }, this);
    }

    finalPos:cc.Vec2 = new cc.Vec2(0,0);
    finalTime:number = 0;
    actionDuration:number = 0;

    public removeTouchFromContent(event: any, content: any[]): void {
        let eventToucheIDs: number[] = event['getTouches']().map(v => v.getID());
        for (let len = content.length, i = len - 1; i >= 0; --i) {
            if (eventToucheIDs.indexOf(content[i].id) > -1)
                content.splice(i, 1); // 删除触摸
        }
    }

    /** 双指回弹 */
    twoScaleAnim(){
        cc.log(`twoScaleAnim双指回弹`)
        if(this.map.scale<this.minScale){
            // this.map.StopAllActions();
            this.map.RunAction(ezaction.scaleTo(0.2,{scale:this.minScale})).onStoped(()=>{
                cc.log(`之后twoScaleAnim双指回弹scale`+this.map.scale)
            });
            cc.log(`之前twoScaleAnim双指回弹scale`+this.map.scale)
        }
    }

    public smoothOperate(target: cc.Node, pos: cc.Vec2, scale: number,twoAction:boolean=true): void {
        let scX: number = scale;
        // 当前缩放值与原来缩放值之差
        let disScale: number = scX - target.scaleX;
        // 当前点击的坐标与缩放值差像乘 
        let gapPos: cc.Vec2 = pos.scale(cc.v2(disScale, disScale));
        // 当前node坐标位置减去点击 点击坐标和缩放值的值
        let mapPos: cc.Vec2 = target.getPosition().sub(cc.v2(gapPos.x, gapPos.y));
        // 放大缩小
        if (!this.isOutRangeScale(scale,twoAction)) {
            scale = (scale * 100 | 0) / 100;
            target.scale = scale;
            if(scale<this.minScale){
                return;
            }
            this.dealScalePos(mapPos, target);
        }
        // 更新 label 显示
        scale = this.dealScaleRange(scale);
        // this.scaleTime.string = `${scale * 100 | 0}%`;
        this.cloudOpacity();
    }

    cloudOpacity(){
        this.node.getChildByName("cloud_anim").children.forEach((cloud)=>{
            if(this.node.scale>=this.initScale){
                cloud.opacity = 0;
            }else{
                cloud.opacity = Math.abs(this.node.scale-1) * 255 * this.maxScale/this.minScale;
            }
        })
    }

    private dealTouchData(touches: any[], target: cc.Node): void {
        let touch1: any = touches[0].touch;
        let touch2: any = touches[1].touch;
        let delta1: cc.Vec2 = cc.v2(touch1.getDelta());
        let delta2: cc.Vec2 = cc.v2(touch2.getDelta());
        let touchPoint1: cc.Vec2 = target.convertToNodeSpaceAR(cc.v2(touch1.getLocation()));
        let touchPoint2: cc.Vec2 = target.convertToNodeSpaceAR(cc.v2(touch2.getLocation()));
        let distance: cc.Vec2 = touchPoint1.sub(touchPoint2);
        let delta: cc.Vec2 = delta1.sub(delta2);
        let scale: number = 1;
        if (Math.abs(distance.x) > Math.abs(distance.y)) {
            scale = (distance.x + delta.x) / distance.x * target.scaleX;
        } else {
            scale = (distance.y + delta.y) / distance.y * target.scaleY;
        }
        let pos: cc.Vec2 = touchPoint2.add(cc.v2(distance.x / 2, distance.y / 2));
        this.smoothOperate(target, pos, scale);
    }

    private isOutRangeScale(scale: number,twoAction:boolean): boolean {
        return (scale > this.maxScale || scale < this.minScale-(twoAction?0.05:0));
    }

    private dealScaleRange(scale: number): number {
        if (scale > this.maxScale) {
            return this.maxScale;
        } else if (scale < this.minScale) {
            return this.minScale;
        } else {
            return scale;
        }
    }

    public dealScalePos(pos: cc.Vec2, target: cc.Node): void {
        let container: cc.Node = this.mapContainer;
        let worldPos: cc.Vec2 = container.convertToWorldSpaceAR(pos);
        let nodePos: cc.Vec2 = container.convertToNodeSpaceAR(worldPos);
        let edge: any = this.calculateEdge(target, container, nodePos);
        edge.lBorderDelta > 0 && (pos.x -= edge.lBorderDelta);
        edge.rBorderDelta > 0 && (pos.x += edge.rBorderDelta);
        edge.uBorderDelta > 0 && (pos.y += edge.uBorderDelta);
        edge.dBorderDelta > 0 && (pos.y -= edge.dBorderDelta);
        if (1 === target.scale) pos = cc.Vec2.ZERO;
        target.x = pos.x;
        target.y = pos.y;
    }

    private dealMoveAction(event: cc.Event.EventTouch): void {
        let endPos = event.touch.getLocation();
        cc.log(`StopAllActions`)
        // this.map.StopAllActions();
        // this.map.RunAction(ezaction.moveTo((new Date().getTime() - this.finalTime)/1000/2,{x:this.map.x+endPos.x-this.finalPos.x,y:this.map.y+endPos.y-this.finalPos.y}))
        let worldPos: cc.Vec2 = this.map.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let nodePos: cc.Vec2 = this.mapContainer.convertToNodeSpaceAR(worldPos);
        nodePos.x += (endPos.x-this.finalPos.x)*this.threshold;
        nodePos.y += (endPos.y-this.finalPos.y)*this.threshold;
        let edge: any = this.calculateEdge(this.map, this.mapContainer, nodePos);
        let params = {};
        let duration = (new Date().getTime() - this.finalTime)/1000;
        let backParams:Object = {};
        if (edge.lBorderDelta <= 0 && edge.rBorderDelta <= 0) {
            // this.map.x += endPos.x-this.finalPos.x;
            params["x"] = this.map.x+(endPos.x-this.finalPos.x)*this.threshold;
        }else{
            let maxX = (this.map.width*this.map.scaleX-cc.winSize.width)/2;  
            if(this.map.x>=maxX){
                backParams["x"] = maxX;
            }else if(this.map.x<=-maxX){
                backParams["x"] = -maxX;
            }
        }
        if (edge.uBorderDelta <= 0 && edge.dBorderDelta <= 0) {
            // this.map.y += endPos.y-this.finalPos.y;
            params["y"] = this.map.y+(endPos.y-this.finalPos.y)*this.threshold;
        }else{
            let maxY = (this.map.height*this.map.scaleY-cc.winSize.height)/2;  
            if(this.map.y>=maxY){
                backParams["y"] = maxY;
            }else if(this.map.y<=-maxY){
                backParams["y"] = -maxY;
            }
        }
        if(duration>0.25 && Object.getOwnPropertyNames(backParams).length==0)return;

        let ce3 = ezaction.HCustomEase.create("ce3", "M0,0 C0.084,0.61 0.214,0.802 0.28,0.856 0.356,0.918 0.374,1 1,1 ")
        const rollEaseOut = ezaction.ease.customEase(ce3);
        if ( (edge.lBorderDelta <= 0 && edge.rBorderDelta <= 0) && (edge.uBorderDelta <= 0 && edge.dBorderDelta <= 0)) {
            this.map.RunAction(ezaction.moveTo(duration*3,params).easing(rollEaseOut));
        }else{
            this.map.RunAction(ezaction.moveTo(0.2,backParams).easing(rollEaseOut));
        }
    }

    mouseDown:boolean = false;
    private dealMove(dir: cc.Vec2, map: cc.Node, container: cc.Node): void {
        let worldPos: cc.Vec2 = map.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let nodePos: cc.Vec2 = container.convertToNodeSpaceAR(worldPos);
        let edge: any = this.calculateEdge(map, container, cc.v2(nodePos.x + dir.x,nodePos.y + dir.y));
        if (edge.lBorderDelta <= 0 && edge.rBorderDelta <= 0) {
            map.x += dir.x;
        }else{
            let _x = map.x + dir.x;
            let maxX = (this.map.width*this.map.scaleX-cc.winSize.width)/2;  
            if(edge.rBorderDelta > 0){
                if(_x<=-maxX-this.limit * this.map.scaleX){
                    map.x = -maxX-this.limit * this.map.scaleX;
                }else{
                    map.x = _x;
                }
            }else if(edge.lBorderDelta > 0){
                if(_x>=maxX+this.limit * this.map.scaleX){
                    map.x = maxX+this.limit * this.map.scaleX;
                }else{
                    map.x = _x;
                }
            }
        }
        if (edge.uBorderDelta <= 0 && edge.dBorderDelta <= 0) {
            map.y += dir.y;
        }else{
            let _y = map.y + dir.y;
            let maxY = (this.map.height*this.map.scaleY-cc.winSize.height)/2;  
            if(edge.dBorderDelta > 0){
                if(_y>=maxY+this.limit * this.map.scaleY){
                    map.y = maxY+this.limit * this.map.scaleY;
                }else{
                    map.y = _y;
                }
            }else if(edge.uBorderDelta > 0){
                if(_y<=-maxY-this.limit * this.map.scaleY){
                    map.y = -maxY-this.limit * this.map.scaleY;
                }else{
                    map.y = _y;
                }
            }
        }
    }

    /** 移动到目标节点 */
    followTargetPos(targetNode:cc.Node,duration:number,callback?:Function,isEasing:boolean=false){
        let ce2 = ezaction.HCustomEase.create
        ("ce2", "M0,0 C0.018,0.592 0.092,0.79 0.154,0.9 0.172,0.932 0.209,1 0.268,1 0.394,1 0.572,1 1,1 ")
        const rollEaseOut2 = ezaction.ease.customEase(ce2);
        let worldPos = targetNode.parent.convertToWorldSpaceAR(targetNode.getPosition());
        let deviationX = (worldPos.x-cc.winSize.width/2);
        let deviationY = (worldPos.y-cc.winSize.height/2);
        let targetX = this.node.x - deviationX;
        let targetY = this.node.y - deviationY;
        const store_width = cc.winSize.width;
        const store_height = cc.winSize.height;
        if(targetX>this.node.width/2*this.node.scaleX-store_width/2){
            targetX = this.node.width/2*this.node.scaleX-store_width/2;
        }else if(targetX<-this.node.width/2*this.node.scaleX+store_width/2){
            targetX = -this.node.width/2*this.node.scaleX+store_width/2;
        }else if(targetY>this.node.height/2*this.node.scaleY-store_height/2){
            targetY = this.node.height/2*this.node.scaleY-store_height/2;
        }else if(targetY<-this.node.height/2*this.node.scaleY+store_height/2){
            targetY = -this.node.height/2*this.node.scaleY+store_height/2;
        }
        if(isEasing){
            this.node.RunAction(ezaction.moveTo(duration,{x:targetX,y:targetY}).easing(rollEaseOut2)).onStoped(()=>{
                callback && callback();
            });
        }else{
            this.node.RunAction(ezaction.moveTo(duration,{x:targetX,y:targetY})).onStoped(()=>{
                callback && callback();
            });
        }
    }

    public setSinglTouchCb(cb: Function): void {
        this.singleTouchCb = cb;
    }

    private dealSelect(nodePos: cc.Vec2): void {
        cc.log(`click map on cc.v2(${nodePos.x}, ${nodePos.y})`);
        // do sth
        if (this.singleTouchCb) this.singleTouchCb(nodePos);
    }

    // 计算map的四条边距离容器的距离
    public calculateEdge(target: cc.Node, container: cc.Node, nodePos: cc.Vec2): any {
        let realWidth: number = target.width * target.scaleX;
        let realHeight: number = target.height * target.scaleY;
        let lBorderDelta: number = (nodePos.x - realWidth / 2) + container.width / 2;
        let rBorderDelta: number = container.width / 2 - (realWidth / 2 + nodePos.x); // <= 0 safe
        let uBorderDelta: number = container.height / 2 - (realHeight / 2 + nodePos.y);
        let dBorderDelta: number = (nodePos.y - realHeight / 2) + container.height / 2;
        return { lBorderDelta, rBorderDelta, uBorderDelta, dBorderDelta };
    }
}
