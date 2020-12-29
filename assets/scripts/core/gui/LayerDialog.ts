/*
 * @CreateTime: Mar 11, 2019 6:48 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 14, 2019 1:58 PM
 * @Description: Modify Here, Please 
 * 
 * 对话框层控制器
 * 该层的节点将一次只显示一个，删除以后会自动从队列当中取一个弹窗，知道队列为空
 */


import { UICallbacks, ViewParams } from "./Defines";
import { LayerUI } from "./LayerUI";

export class LayerDialog extends LayerUI {

    stopCom: cc.BlockInputEvents = null;

    constructor(name: string, container: cc.Node) {
        super(name, container);
        this.stopCom = this.layer.addComponent(cc.BlockInputEvents);
        this.layer.active = false;
        this._asyncQueue.complete = () => {
            this.layer.active = this.size() > 0;
        }
    }

    protected _handlerTask(next: Function, viewParams: ViewParams) {
        // 一次只能出现一个PopUp界面
        let callbacks = viewParams.callbacks;
        let $onRemoved = callbacks.onRemoved;
        callbacks.onRemoved = (node, params) => {
            if ($onRemoved) {
                $onRemoved(node, params);
            }
            next();
        }
        super._handlerTask(() => {
            if (this.layer.childrenCount < 1) {
                cc.warn("上次弹窗界面未成功显示，直接进入下一步");
                callbacks.onRemoved && callbacks.onRemoved(null, viewParams.params);
            }
        }, viewParams);
    }

    protected _createNode(prefab: cc.Prefab, viewParams: ViewParams): cc.Node {
        this.layer.active = true;
        return super._createNode(prefab, viewParams);
    }

    add(prefabPath: string, params: any, callbacks: UICallbacks = null): string {
        this.stopCom.enabled = !params.clickStop;
        return super.add(prefabPath, params, callbacks);
    }

    clear() {
        super.clear();
        this.layer.active = false;
    }

}