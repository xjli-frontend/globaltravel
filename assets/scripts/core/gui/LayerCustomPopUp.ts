/*
 * @CreateTime: Mar 11, 2019 6:50 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 14, 2019 1:59 PM
 * @Description: Modify Here, Please 
 * 
 * 自定义popup层，调用add显示，可以显示暗色背景，弹框参数可以查看PopViewParams
 * 允许同时弹出多个pop层，pop层之间相互block操作
 */

import { PopViewParams, ViewParams } from "./Defines";
import DelegateComponent from "./DelegateComponent";
import { LayerUI } from "./LayerUI";

export class LayerCustomPopUp extends LayerUI {
    private modalBackLayer:cc.Node = null;

    constructor(name: string, container: cc.Node) {
        super(name, container);
    }
    public setLayer(val: cc.Node) {
        this._layer = val;
        this._initModalBackLayer();

    }

    public layout(width: number, height: number) {
        super.layout(width, height);
        if (this.modalBackLayer) {
            this.modalBackLayer.width = 2 * cc.winSize.width;
            this.modalBackLayer.height = 2 * cc.winSize.height;
        }
    }
    private _initModalBackLayer() {
        this.modalBackLayer = new cc.Node("ModalBackgroundLayer");
        this.modalBackLayer.zIndex = 0;
        this._layer.addChild(this.modalBackLayer);
        this.modalBackLayer.width = 2 * cc.winSize.width;
        this.modalBackLayer.height = 2 * cc.winSize.height;

        this.modalBackLayer.addComponent(cc.BlockInputEvents);
        this.modalBackLayer.active = false;

        // 点击模态层背景自动关闭最上层的UI
        this.modalBackLayer.on(cc.Node.EventType.TOUCH_END, this.clickBgHandler, this);
    }

    /** 
     * 是否允许点击穿透
     * @param bool true / false
     */
    touchControll(bool: boolean) {
        this.modalBackLayer.active = bool;
    }

    protected clickBgHandler() {
        let _topNodeComp: DelegateComponent = null;
        let children = this.__nodes();
        for (let i = 0; i < children.length; i++) {
            if (!_topNodeComp) {
                _topNodeComp = children[i];
                continue;
            }
            if (_topNodeComp && _topNodeComp.node.zIndex < children[i].node.zIndex) {
                _topNodeComp = children[i];
            }
        }
        if (_topNodeComp) {
            if (_topNodeComp.node.zIndex < this.modalBackLayer.zIndex) {
                return;
            }
            let popParams = _topNodeComp.viewParams.callbacks as PopViewParams;
            if (popParams.touchClose || (typeof popParams.touchClose !== "boolean")) {
                this.delete(_topNodeComp.viewParams.UUID);
            }
        }
    }

    /** 查找顶级节点并把背景暗色层放在顶级节点以下 */
    private refreshModalBG() {
        let _topNodeComp: DelegateComponent = null;
        let children = this.__nodes();
        for (let i = 0; i < children.length; i++) {
            let comp = children[i];
            if (!_topNodeComp) {
                _topNodeComp = comp;
                continue;
            }
            if (_topNodeComp && _topNodeComp.node.zIndex < comp.node.zIndex) {
                _topNodeComp = comp;
            }
        }
        if (!_topNodeComp) {
            this.modalBackLayer.active = false;
        } else {
            this.modalBackLayer.width = 2 * cc.winSize.width;
            this.modalBackLayer.height = 2 * cc.winSize.height;
            this.modalBackLayer.active = true;
            this.modalBackLayer.zIndex = _topNodeComp.node.zIndex - 1;
            let viewParams = _topNodeComp.viewParams;
            let popParams = viewParams.callbacks as PopViewParams;
            if (popParams.modal) {
                let size = cc.winSize;
                let ctx;
                let alpha = 210;
                if (typeof popParams.opacity === "number") {
                    alpha = popParams.opacity;
                }
                if (!this.modalBackLayer.getComponent(cc.Graphics)) {
                    ctx = this.modalBackLayer.addComponent(cc.Graphics);
                    ctx.clear();
                    ctx.rect(-size.width, -size.height, size.width * 3, size.height * 3);
                    ctx.fillColor = cc.color(0, 0, 0, alpha);
                    ctx.fill();
                }
            } else {
                this.modalBackLayer.width = 0;
                this.modalBackLayer.height = 0;
                this.modalBackLayer.removeComponent(cc.Graphics);
            }
        }
    }
    /**
     * 添加一个预制件节点到PopUp层容器中，该方法将返回一个唯一uuid来标识该操作节点
     * @param prefabPath 预制件路径
     * @param params     传给组件onAdded、onRemoved方法的参数。
     * @param popParams  弹出界面的设置定义，详情见PopViewParams
     */
    add(prefabPath: string, params: any, popParams: PopViewParams = null): string {
        return super.add(prefabPath, params, popParams);
    }

    protected _createNode(prefab: cc.Prefab, viewParams: ViewParams): cc.Node {
        let popParams = viewParams.callbacks as PopViewParams;
        let $onRemoved = viewParams.callbacks.onRemoved;
        viewParams.callbacks.onRemoved = (node, params) => {
            if ($onRemoved) {
                $onRemoved(node, params);
            }
            // 组件删除之后，刷新一下modal背景
            this.refreshModalBG();
        }
        let childNode: cc.Node = cc.instantiate(prefab);
        let comp = childNode.addComponent(DelegateComponent);
        comp.viewParams = viewParams;
        // 如果有相对父节点则把当前界面放置在该父节点对应的全局坐标上
        if (popParams.parent && popParams.parent instanceof cc.Node) {
            let relativeNode = popParams.parent;
            let parentWorldPos = relativeNode.parent.convertToWorldSpaceAR(relativeNode.getPosition());
            let localPos = this._layer.convertToNodeSpaceAR(parentWorldPos);
            childNode.setPosition(localPos.x, localPos.y);
        }
        this._layer.addChild(childNode);

        let _topNodeComp: DelegateComponent = null;
        let children = this.__nodes();
        for (let i = 0; i < children.length; i++) {
            let comp = children[i];
            if (!_topNodeComp) {
                _topNodeComp = comp;
                continue;
            }
            if (_topNodeComp && _topNodeComp.node.zIndex < comp.node.zIndex) {
                _topNodeComp = comp;
            }
        }
        let zzindex = 2;
        if (_topNodeComp) {
            zzindex = _topNodeComp.node.zIndex + 2;
        }
        childNode.zIndex = zzindex;
        comp.addView();
        this.refreshModalBG();
        return childNode;
    }

    /** 清除所有pop */
    clear(){
        if(this.layer.children){
            this.modalBackLayer.off(cc.Node.EventType.TOUCH_END,this.clickBgHandler,this);
            super.clear()
            this._initModalBackLayer();
        }
        if (this._asyncQueue.runningParams) {
            this._asyncQueue.runningParams.valid = false;
        }
        this._asyncQueue.clear();
    }
}