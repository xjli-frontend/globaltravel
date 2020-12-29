import engine from "../core/Engine";
import { Message } from "../core/event/MessageManager";
import { AudioMessage } from "./AudioMessage";





/*
 * @CreateTime: Jun 15, 2018 11:50 AM
 * @Author: dgflash
 * @Contact: dgflash@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 11, 2018 10:36 AM
 * @Description: 游戏音乐管理
 */


export class GameAudio {
    private dirPath: string;        // 文件夹路径
    private ext: string = ".mp3";    // 文件扩展名

    constructor() {
        Message.on(AudioMessage.BGM, this.onHandler, this);
        Message.on(AudioMessage.BGM2, this.onHandler, this);
        Message.on(AudioMessage.EFFECT, this.onHandler, this);
        Message.on(AudioMessage.BUILD_EFFECT, this.onHandler, this);
        this.dirPath = `main/audio/`;
    }

    private onHandler(event: string, args: any) {
        switch (event) {
            case AudioMessage.BGM:
                this.playBGM();
                break;
            case AudioMessage.BGM2:
                this.playBGM2();
                break;
            case AudioMessage.EFFECT:
                this.playEffect(args);
                break;
            case AudioMessage.BUILD_EFFECT:
                this.playBuildEffect(args);
                break;
            default:
                break;
        }
    }

    /** 播放建筑环境声 */
    currentBuildId = -1;
    currentTimer:string = "";
    private playBuildEffect(buildId) {
        if(buildId == this.currentBuildId){
            return ;
        }
        if(this.currentBuildId != -1){
            let url2 = this.getRealUrl(`build${this.currentBuildId}`);
            cc.log(`停止建筑声=>${this.currentBuildId}`)
            engine.audio.stopEffect(url2);
        }
        let url = this.getRealUrl(`build${buildId}`);
        cc.log(`播放建筑声=>${buildId}`)
        engine.audio.playEffect(url);
        this.currentBuildId = buildId;
        engine.timer.unschedule(this.currentTimer);
        this.currentTimer = engine.timer.scheduleOnce(()=>{
            this.currentBuildId = -1;
        },8)
    }


    playNumMusicLoop(url,callback){
        engine.audio.playMusic(url,false,()=>{
            if(this.musicNum++ == 1){
                callback && callback();
            }else{
                cc.log(`背景音乐循环${this.musicNum}`)
                this.playNumMusicLoop(url,callback);
            }
        });
    }
    musicNum:number = 0;
    /** 播放普通背景音乐 */
    private playBGM() {
        cc.log("播放普通的背景音乐");
        this.musicNum = 0;
        let random = this.getRandom(1,3);
        let url = this.getRealUrl(`bgm${random}`);
        this.playNumMusicLoop(url,()=>{
            let bgsUrl = this.getRealUrl("bgs");
            engine.audio.playMusic(bgsUrl,false,()=>{
                this.playBGM();
            });
        });
    }

    
    /** 播放普通背景音乐2 */
    private playBGM2() {
        cc.log("切换地标 切换背景音乐");
        this.playBGM();
    }

    /** 播放音效 */
    private playEffect(effect: string) {
        cc.log("播放音效", effect);
        let url = this.getRealUrl(effect);
        engine.audio.playEffect(url);
    }



    public getRealUrl(id: string) {
        let url = this.dirPath + id + this.ext;
        // let md5Url = cc.url.raw(url);

        // if (cc.loader.md5Pipe && cc.loader.md5Pipe.transformURL) {
        //     md5Url = cc.loader.md5Pipe.transformURL(md5Url);
        // }
        return url;
    }

    /** 获取begin到length的随机数 */
    public getRandom = function (begin: number, length: number) {
        return Math.round(Math.random() * (length - begin) + begin);
    };
}


