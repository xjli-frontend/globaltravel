/*
 * @CreateTime: Mar 11, 2019 6:44 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Mar 13, 2019 4:26 PM
 * @Description: Modify Here, Please 
 * 
 * UI基础层，允许添加多个预制件节点
 * add     : 添加一个预制件节点到层容器中，该方法将返回一个唯一uuid来标识该操作cc.Node节点。
 * delete  : 根据uuid删除cc.Node节点，如果节点还在队列中也会被删除, 删除节点可以用gui.delete(node)或this.node.destroy()
 * get     : 根据uuid获取cc.Node节点，如果节点不存在或者预制件还在队列中，则返回null 。
 * $delete : 根据预制件路径删除，预制件如在队列中也会被删除，如果该预制件存在多个也会一起删除。
 * $get    : 根据预制件路径获取当前显示的该预制件的所有cc.Node节点数组。
 * has     : 判断当前层是否包含 uuid或预制件路径对应的cc.Node节点。
 * find    : 判断当前层是否包含 uuid或预制件路径对应的cc.Node节点。
 * size    : 当前层上显示的所有cc.Node节点数。
 * clear   : 清除所有cc.Node节点，队列当中未创建的任务也会被清除。
 * 
 */
import { AsyncQueue } from "../util/AsyncQueue";
import { AssetsLoader } from "./AssetsLoader";
import { UICallbacks, ViewParams } from "./Defines";
import DelegateComponent from "./DelegateComponent";

export class LayerUI {

    /** 预制件资源加载管理类 */
    private static _loader: AssetsLoader<cc.Prefab> = null;
    private static getLoader(): AssetsLoader<cc.Prefab> {
        if (!LayerUI._loader) {
            LayerUI._loader = new AssetsLoader(cc.Prefab);
        }
        return LayerUI._loader;
    }

    /** 加载队列 */
    protected _asyncQueue: AsyncQueue = new AsyncQueue();

    protected _layer: cc.Node = null;
    /**
     * 获取层cc.Node容器
     */
    public get layer(): cc.Node {
        return this._layer;
    }

    public name: string = "LayerUI";

    /**
     * UI基础层，允许添加多个预制件节点
     * @param name 该层名
     * @param container 容器cc.Node
     */
    constructor(name: string, container: cc.Node) {
        this.name = name;
        this._layer = container;
        if (container) {
            container.name = name;
        }
    }

    /** 设置层大小 */
    public layout(width: number, height: number) {
        this._layer && this._layer.setContentSize(width, height);
    }

    /** 是否开启层遮照 */
    public enableMask(val: boolean) {
        if (!this._layer) {
            cc.error("LayerUI layer is null")
            return;
        }
        if (val) {
            this._layer.addComponent(cc.Mask);
        } else {
            this._layer.removeComponent(cc.Mask);
        }
    }

    private _uuidCount: number = 1;
    /** 构造一个唯一标识UUID */
    protected UUID(prefabPath: string): string {
        return `${this.name}_${prefabPath}_${this._uuidCount++}`.toLowerCase();
    }

    /**
     * 添加一个预制件节点到层容器中，该方法将返回一个唯一`uuid`来标识该操作节点
     * @param prefabPath 预制件路径
     * @param params     传给组件`onAdded`、`onRemoved`方法的参数。
     * @param callbacks  回调函数对象，可选
     */
    add(prefabPath: string, params: any, callbacks: UICallbacks = null): string {
        if (!this._layer) {
            cc.error("LayerUI layer is null")
            return;
        }
        if (!prefabPath) {
            return;
        }
        let viewParams = {
            UUID: this.UUID(prefabPath),
            prefabPath: prefabPath,
            params: params || {},
            callbacks: callbacks || {},
            valid: true
        };
        /** 将预制件资源提前放入下载队列中 */
        LayerUI.getLoader().add(prefabPath);
        this._asyncQueue.push(this._handlerTask.bind(this), viewParams);
        this._asyncQueue.yieldTime(1);
        this._asyncQueue.play();
        return viewParams.UUID;
    }

    protected _handlerTask(next: Function, viewParams: ViewParams) {
        if (!viewParams.valid) {
            viewParams.callbacks = null;
            viewParams.params = null;
            next();
        } else {
            // 获取预制件资源
            LayerUI.getLoader().getRes(viewParams.prefabPath, (res: cc.Prefab) => {
                if (res && viewParams.valid) {
                    this._createNode(res, viewParams);
                }
                next();
            })
        }
    }
    /**
     * 创建节点界面，可覆盖重写
     * @param prefab 
     * @param viewParams 
     */
    protected _createNode(prefab: cc.Prefab, viewParams: ViewParams) {
        if (!this._layer) {
            cc.error("LayerUI layer is null")
            return null;
        }
        let childNode: cc.Node = cc.instantiate(prefab);
        let comp = childNode.addComponent(DelegateComponent);
        comp.viewParams = viewParams;
        this.layer.addChild(childNode);
        comp.addView();
        return childNode;
    }

    /**
     * 根据uuid删除节点，如果节点还在队列中也会被删除
     * 注意。删除节点请直接调用 `this.node.destroy()`或 `gui.delete(node)`;
     * @param uuid 
     */
    delete(uuid: string): void {
        let children = this.__nodes();
        for (let i = 0; i < children.length; i++) {
            let viewParams = children[i].viewParams;
            if (viewParams.UUID === uuid) {
                children[i].removeView();
                viewParams.valid = false;
                return;
            }
        }
        // 如果当前正在处理该任务，则标记为无效状态
        let runningParams: ViewParams = this._asyncQueue.runningParams;
        if (runningParams) {
            if (runningParams.UUID === uuid) {
                runningParams.valid = false;
                return;
            }
        }
        // 遍历即将处理的任务队列，uuid相同的直接清除队列
        let queues = this._asyncQueue.queues;
        for (let i = 0; i < queues.length; i++) {
            if (queues[i].params && queues[i].params.UUID === uuid) {
                queues[i].params.valid = false;
                queues.splice(i, 1);
                return;
            }
        }
    }
    /**
     * 根据预制件路径删除，预制件如在队列中也会被删除，如果该预制件存在多个也会一起删除。
     * @param prefabPath 
     */
    $delete(prefabPath: string): void {
        let children = this.__nodes();
        for (let i = 0; i < children.length; i++) {
            let viewParams = children[i].viewParams;
            if (viewParams.prefabPath === prefabPath) {
                children[i].removeView();
                viewParams.valid = false;
            }
        }
        // 如果当前正在处理该任务，则标记为无效状态
        let runningParams: ViewParams = this._asyncQueue.runningParams;
        if (runningParams) {
            if (runningParams.prefabPath === prefabPath) {
                runningParams.valid = false;
            }
        }
        // 遍历即将处理的任务队列，存在同名的预制件则删除该任务。
        let queues = this._asyncQueue.queues;
        for (let i = 0, flag = true, len = queues.length; i < len; flag ? i++ : i) {
            let asyncTask = queues[i];
            if (asyncTask && asyncTask.params.prefabPath === prefabPath) {
                asyncTask.params.valid = false;
                queues.splice(i, 1);
                flag = false;
            } else {
                flag = true;
            }
        }
    }
    /**
     * 根据uuid获取节点，如果节点不存在或者还在队列中，则返回null 
     * @param uuid 
     */
    get(uuid: string): cc.Node {
        let children = this.__nodes();
        for (let comp of children) {
            if (comp.viewParams && comp.viewParams.UUID === uuid) {
                return comp.node;
            }
        }
        return null;
    }

    /**
     * 根据预制件路径获取当前显示的该预制件的所有cc.Node节点数组。
     * @param prefabPath 
     */
    $get(prefabPath: string): Array<cc.Node> {
        let arr: Array<cc.Node> = [];
        let children = this.__nodes();
        for (let comp of children) {
            if (comp.viewParams.prefabPath === prefabPath) {
                arr.push(comp.node);
            }
        }
        return arr;
    }

    /**
     * 判断当前层是否包含 uuid或预制件路径对应的cc.Node节点。
     * @param prefabPathOrUUID 预制件路径或者UUID
     */
    has(prefabPathOrUUID: string): boolean {
        let children = this.__nodes();
        for (let comp of children) {
            if (comp.viewParams.UUID === prefabPathOrUUID || comp.viewParams.prefabPath === prefabPathOrUUID) {
                return true;
            }
        }
        return false;
    }

    /**
     * 获取当前层包含指定正则匹配的cc.Node节点。
     * @param prefabPathReg 匹配预制件路径的正则表达式对象
     */
    find(prefabPathReg: RegExp): cc.Node[] {
        let arr: cc.Node[] = [];
        let children = this.__nodes();
        for (let comp of children) {
            if (prefabPathReg.test(comp.viewParams.prefabPath)) {
                arr.push(comp.node);
            }
        }
        return arr;
    }

    protected __nodes(): Array<DelegateComponent> {
        if (!this._layer) {
            cc.error("LayerUI layer is null")
            return [];
        }
        let result: Array<DelegateComponent> = [];
        let children = this.layer.children;
        for (let i = 0; i < children.length; i++) {
            let comp = children[i].getComponent(DelegateComponent);
            if (comp && comp.viewParams && comp.viewParams.valid && cc.isValid(comp)) {
                result.push(comp);
            }
        }
        return result;
    }
    /**
     * ui层节点数量
     * @param prefabPath 
     */
    size(): number {
        return this.__nodes().length;
    }
    /***
     * 清除所有节点，队列当中的也删除
     */
    clear(): void {
        if (!this._layer) {
            cc.error("LayerUI layer is null")
            return;
        }
        this._layer.destroyAllChildren();
        this._layer.removeAllChildren(true);
        if (this._asyncQueue.runningParams) {
            this._asyncQueue.runningParams.valid = false;
        }
        this._asyncQueue.clear();
        cc.log(`[ ${this.name} ] clear! childrenCount : ${this._layer.childrenCount}`);
    }
}