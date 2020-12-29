import { ViewParams } from "./Defines";

export default class DelegateComponent extends cc.Component {

    viewParams: ViewParams = null;

    private _onBeforeRemoveCalled: number = 0;

    addView() {
        let viewParams = this.viewParams;
        if (!viewParams) {
            return;
        }
        this.applyComponentsFunction(this.node, "onAdded", viewParams.params);
        if (typeof viewParams.callbacks.onAdded === "function") {
            viewParams.callbacks.onAdded(this.node, viewParams.params);
        }
    }
    /**
     * 删除节点，该方法只能调用一次，将会触发onBeforeRemoved回调
     */
    removeView() {
        let viewParams = this.viewParams;
        if (!viewParams) {
            return;
        }
        if (viewParams.valid && this._onBeforeRemoveCalled === 0) {
            this._onBeforeRemoveCalled = 1;
            this.applyComponentsFunction(this.node, "onBeforeRemove", viewParams.params);
            if (viewParams.callbacks && (typeof viewParams.callbacks.onBeforeRemove === "function")) {
                viewParams.callbacks.onBeforeRemove(this.node, this.onceDestroy.bind(this));
            } else {
                this.node.destroy();
            }
            viewParams.valid = false;
        }
    }
    onceDestroy() {
        if (this._onBeforeRemoveCalled === 1) {
            this.node.destroy();
        }
        this._onBeforeRemoveCalled = 2;
    }

    onDestroy() {
        let viewParams = this.viewParams;
        this.viewParams = null;
        if (!viewParams) {
            return;
        }
        viewParams.valid = false;
        this.applyComponentsFunction(this.node, "onRemoved", viewParams.params);
        if (viewParams.callbacks && (typeof viewParams.callbacks.onRemoved === "function")) {
            viewParams.callbacks.onRemoved(this.node, viewParams.params);
        }
        viewParams.callbacks = null;
        viewParams.params = null;
        // cc.log(`${this.viewParams.UUID} onDestroy!`)
    }

    protected applyComponentsFunction(node: cc.Node, funName: string, params) {
        let components: Array<cc.Component> = (<any>node)._components;
        if (!components) {
            return;
        }
        for (let i = 0; i < components.length; i++) {
            let component: cc.Component = components[i];
            let func = component[funName];
            if (func) func.call(component, params);
        }
    }
}