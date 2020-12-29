


const { ccclass } = cc._decorator;

@ccclass
export class SpineAnimationQueue extends cc.Component {

    public completeCallback: Function = null;

    public progressBeginCallback: (animationName:string)=>void = null;
    public progressEndCallback: (animationName:string)=>void = null;

    private _spine: sp.Skeleton = null;
    public get spine():sp.Skeleton{
        return this._spine;
    }
    private _animations: Array<string> = null;

    private _loop: boolean = false;
    public get loop():boolean{
        return this._loop;
    }

    private _isCompleted:boolean = false;
    public get isCompleted():boolean{
        return this._isCompleted;
    }

    onLoad() {
        this._spine = this.node.getComponent(sp.Skeleton);
        this._spine.setCompleteListener(this.completeHandler.bind(this));

        let generatorSpinePromiseFactroy = function( spine ){
            let spineAnimations = [];
            let spineResolveCallbacks = [];
            let spineCompleteHandler = ()=>{
                let resolveFunc = spineResolveCallbacks.shift();
                if (resolveFunc){
                    resolveFunc();
                }
                if ( spineAnimations.length>0 ){
                    spine.setAnimation(0,spineAnimations.shift(),false);
                }
            }
            spine.setCompleteListener(spineCompleteHandler );
            return ( animation )=>{
                return new Promise( (resolve,reject)=>{
                    spineResolveCallbacks.push(resolve);
                    spineAnimations.push(animation);
                    if (spineAnimations.length == 1){
                        spine.setAnimation(0,spineAnimations.shift(),false);
                    }
                } )
            }
        }




    }

    clearAnimation() {
        this._spine.clearTracks();
    }

    /**
     * 按顺序播放一组动画
     * @param val 
     */
    setAnimations(val:Array<string>){
        this._animations = val;
        if (this._isCompleted){
            this.play();
        }else{
            this._loop = false;
            if (this._spine.timeScale ==1){
                this._spine.timeScale = 5; // 加快当前播放的动画
            }
        }
    }

    setAnimation(animation: string, loop: boolean = false) {
        this._isCompleted = false;
        this._loop = loop;
        this._spine.timeScale = 1;
        this._spine.setAnimation(0, animation, loop);
        if (this.progressBeginCallback){
            this.progressBeginCallback(this._spine.animation);
        }
    }

    private play() {
        if (!this._animations || this._animations.length < 1) {
            this._isCompleted = true;
            if (this.completeCallback) {
                this.completeCallback(this);
                this.completeCallback = null;
            }
            return;
        }
        this.setAnimation(this._animations.shift());
    }
    private completeHandler() {
        if (this.progressEndCallback){
            this.progressEndCallback(this._spine.animation);
        }
        if (this._loop) {
            // 循环动画判断是不是切换横竖屏
            let animation = this._spine.animation;
            this.setAnimation(animation, true);
            return;
        }
        this.play();
    }
}