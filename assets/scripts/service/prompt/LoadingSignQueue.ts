import { gui } from "../../core/gui/GUI";
import engine from "../../core/Engine";


class LoadingSignQueue {

    private loadingRespath: string = "common/persist/prefab/loading";

    protected removeLoading(){
        gui.loading.$delete(this.loadingRespath);
    }

    protected showLoading(){
        if ( !gui.loading.has(this.loadingRespath)){
            gui.loading.add( this.loadingRespath ,null);
        }
    }

    private _loadingTag:number = 0;
    protected reduceLoadingTag(){
         if (this._loadingTag > 0){
            --this._loadingTag;
         }
         if (this._loadingTag == 0){
             this.removeLoading();
         }
    }
    protected addLoadingTag(){
        ++this._loadingTag;
        if (this._loadingTag > 0){
            this.showLoading();
        }
    }

    add( callback: (next:Function)=>void = null) :Function {
        this.addLoadingTag();
        let next = this.reduceLoadingTag.bind(this);
        if (callback){
            callback( next );
        }
        return next;
    }

    addWithContinue( time:number ){
        time = Math.max(time,0);
        this.add( (next:Function)=>{
            engine.timer.scheduleOnce( this.reduceLoadingTag.bind(this),time )
        } )
    }

    addWithDelay( time:number , callback:Function){

    }
    
}