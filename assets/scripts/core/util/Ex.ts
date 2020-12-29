/*
 * @CreateTime: Aug 14, 2018 2:24 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Aug 14, 2018 2:26 PM
 * @Description: Modify Here, Please 
 * 
 * 扩展方法
 */


export class Ex {
    constructor(){
        
    }

    /**
     * 手机振动 [200,150,200]
     */
    vibrate(pattern: number | number[]){
        if (cc.sys.isBrowser && cc.sys.isMobile){
            navigator.vibrate = navigator.vibrate || navigator["webkitVibrate"] || navigator["mozVibrate"] || navigator["msVibrate"];
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            } 
        }else{
            // 调用native
            
        }
    }
    shake(shakeNode: cc.Node, duration: number) {
        let action = shakeNode.runAction(
            cc.repeatForever(
                cc.sequence(
                    cc.moveTo(0.02, cc.v2(5, 7)),
                    cc.moveTo(0.02, cc.v2(-6, 7)),
                    cc.moveTo(0.02, cc.v2(-13, 3)),
                    cc.moveTo(0.02, cc.v2(3, -6)),
                    cc.moveTo(0.02, cc.v2(-5, 5)),
                    cc.moveTo(0.02, cc.v2(2, -8)),
                    cc.moveTo(0.02, cc.v2(-8, -10)),
                    cc.moveTo(0.02, cc.v2(3, 10)),
                    cc.moveTo(0.02, cc.v2(0, 0))
                )
            ));
        setTimeout(() => {
            shakeNode.stopAction(action);
        }, duration * 1000);
    }
}