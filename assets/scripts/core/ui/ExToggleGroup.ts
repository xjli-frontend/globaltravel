/*
 * @CreateTime: Sep 23, 2017 9:51 AM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Sep 30, 2017 4:36 PM
 * @Description:cc.ToggleGroup 扩展
 */


const { ccclass, property } = cc._decorator;

@ccclass
export default class ExToggleGroup extends cc.ToggleContainer {
    private _callback: (toggle: cc.Toggle, group: ExToggleGroup) => void = null;
    private firstIndex: number = -1;

    start() {
        let toggles = this.node.children;
        let kindex = 0;
        toggles.forEach((toggle, index) => {
            let toggleComp = toggle.getComponent(cc.Toggle);
            if (toggleComp) {
                toggle.on('toggle', this.toggleCallback, this);
                toggleComp.isChecked = (kindex === this.firstIndex);
                kindex++;
            }
        });
        // this.setIndex(5);
    }

    setIndex(value: number) {
        let toggles = this.node.children;
        let kindex = 0;
        for (let i = 0; i < toggles.length; i++) {
            let toggleComp = toggles[i].getComponent(cc.Toggle);
            if (toggleComp) {
                toggleComp.isChecked = (kindex === value);
                kindex++;
            }
        }
        this.firstIndex = value;
    }
    getIndex(): number {
        let toggles = this.node.children;
        let kindex = 0;
        for (let i = 0; i < toggles.length; i++) {
            let toggleComp = toggles[i].getComponent(cc.Toggle);
            if (toggleComp) {
                if (toggleComp.isChecked) {
                    return kindex;
                }
                kindex++;
            }
        }
        return -1;
    }
    getItems(): Array<cc.Node> {
        let arr = [];
        let toggles = this.node.children;
        for (let i = 0; i < toggles.length; i++) {
            let toggleComp = toggles[i].getComponent(cc.Toggle);
            if (toggleComp) {
                arr.push(toggles[i]);
            }
        }
        return arr;
    }

    getSelectedItem(): cc.Node {
        let toggles = this.node.children;
        for (let i = 0; i < toggles.length; i++) {
            let toggleComp = toggles[i].getComponent(cc.Toggle);
            if (toggleComp && toggleComp.isChecked) {
                return toggles[i];
            }
        }
        return null;
    }

    toggleCallback(toggle: cc.Toggle) {
        if (this._callback) {
            this._callback(toggle, this);
        }
    }
    registerCallback(callback: (toggle: cc.Toggle, group: ExToggleGroup) => void) {
        this._callback = callback;
    }

    onDestroy() {
        this._callback = null;
        let toggles = this.node.children;
        toggles.forEach((toggle) => {
            if (!cc.isValid(toggle)) return;
            let toggleComp = toggle.getComponent(cc.Toggle);
            if (toggleComp) {
                toggle.off('toggle', this.toggleCallback, this);
            }
        });
    }
}