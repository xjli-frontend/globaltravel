/**
 * 音乐音效管理
 * Author      : zhljian
 * Create Time : 2017.9.4
 */
import { EventDispatcher } from "../event/EventDispatcher";
import { AudioImp } from "./AudioImp";

const EFFECT_RADIO = 1;

const AUDIO_VOLUME = "audio_volume";
const AUDIO_SWITCH = "audio_switch";
const EFFECT_VOLUME = "effect_volume";
const MUSIC_SWITCH = "MUSIC_SWITCH";
const EFFECT_SWITCH = "EFFECT_SWITCH";


const LOCAL_STORE_KEY = "game_audio";

const INITIAL_VOLUME = 0.5;
export class Audio extends EventDispatcher {
    /** 音效渐变时间 */
    public static FadeDuration:number = 1.0;

    private curMusic: any = {};                     // 正在播放的音乐
    private effectDict: any = {};                   // 正在播放的音效
    private todoMusicUrl: string = null;
    private _audioEngine: AudioImp = null;
    private _audioLocalObj:Object = {};

    public get audioEngine():AudioImp{
        if (!this._audioEngine){
            this._audioEngine = new AudioImp();
        }
        return this._audioEngine;
    }

    constructor(){
        super();
        let _ss = cc.sys.localStorage.getItem( LOCAL_STORE_KEY );
        if (_ss){
            try{
                this._audioLocalObj = JSON.parse(_ss);
            }catch(e){
                this._audioLocalObj = {};
            }
        }
        if (!this._audioLocalObj.hasOwnProperty(AUDIO_VOLUME)) {
            this._audioLocalObj[AUDIO_VOLUME] = INITIAL_VOLUME;
            this._audioLocalObj[EFFECT_VOLUME] = INITIAL_VOLUME;
        } else {
            if (this._audioLocalObj[AUDIO_VOLUME] < INITIAL_VOLUME) {
                this._audioLocalObj[AUDIO_VOLUME] = INITIAL_VOLUME;
                this._audioLocalObj[EFFECT_VOLUME] = INITIAL_VOLUME;
            }
        }
        if (!this._audioLocalObj.hasOwnProperty(MUSIC_SWITCH)) {
            this._audioLocalObj[MUSIC_SWITCH] = true;
        }
        if (!this._audioLocalObj.hasOwnProperty(EFFECT_SWITCH)) {
            this._audioLocalObj[EFFECT_SWITCH] = true;
        }
    }

    save(){
        let _ss = JSON.stringify(this._audioLocalObj);
        cc.sys.localStorage.setItem( LOCAL_STORE_KEY ,_ss );
    }


    /** 设置音乐音量 */
    public setMusicVolume(volume: number, save: boolean = true) {
        if (this.curMusic.id != null) {
            this.audioEngine.setVolume(this.curMusic.id, volume);
        }
        if (save){
            this._audioLocalObj[AUDIO_VOLUME] = volume;
            this.setEffectsVolume(volume * EFFECT_RADIO);
            this.save();
        }
    }

    /** 获取音乐音量 */
    public getMusicVolume(): number {
        if (!this.getAudioSwitch()){
            return 0;
        }
        return this._audioLocalObj[AUDIO_VOLUME];
    }

    /** 获取音效音量 */
    public getEffectVolume(): number {
        if(!this.effectSwitch){
            return 0;
        }
        return this._audioLocalObj[EFFECT_VOLUME];
    }

    /*** 同时设置音乐、有效开关 */
    public setAudioSwitch(val:boolean){
        this.musicSwitch = val;
        this.effectSwitch = val;
    }

    /*** 音乐开关 */
    public getAudioSwitch():boolean{
        return this.musicSwitch;
    }

    /**
     * 音乐开关状态
     */
    public set musicSwitch(val:boolean){
        this._audioLocalObj[MUSIC_SWITCH] = val;
        this.save();
        if ( val ){
            if (this.todoMusicUrl) {
                if (this.curMusic.id == null) {
                    this.playMusic(this.todoMusicUrl);
                }
            }
            let vol = this.getMusicVolume();
            this.setMusicVolume( vol , false);
        }else{
            this.todoMusicUrl = this.curMusic.url;
            this.setMusicVolume(0, false );
        }

    }
    public get musicSwitch():boolean{
        return this._audioLocalObj[MUSIC_SWITCH];
    }
    /**
     * 音效开关状态
     */
    public set effectSwitch(val:boolean){
        this._audioLocalObj[EFFECT_SWITCH] = val;
        this.save();
        if ( val ){
            let vol = this.getEffectVolume();
            this.setEffectsVolume( vol );
        }else{
            this.setEffectsVolume(0);
        }
    }
    effectVolume = 0;
    
    public get effectSwitch():boolean{
        return this._audioLocalObj[EFFECT_SWITCH];
    }

    /**
     * 切换音乐开关
     */
    public transMusicSwitch() {
        
    }

    /**
     * 播放音乐
     * @param url       音乐文件路径
     * @param loop      是否循环
     * @param volume    音乐声音
     * @return          音乐id
     */
    public playMusic(url: string, loop: boolean = true,callback:(url)=>void = null ) {
        // 背景音乐正在播放
        if (this.curMusic.url == url && loop) {
            return -1;
        }
        let play = () => {
            try {
                let musicId = this.playMusicWithFade(url, loop, this.getMusicVolume(), Audio.FadeDuration,callback);

                this.curMusic = { id: musicId, url: url };
                return musicId;
            } catch (e) {
                cc.warn(e);
            }
            return 0;
        }

        if (this.curMusic.id != null) {
            this.stopMusic();
        } 
        else {
        }
        play();
        return 0;
    }

    public playMusicWithFade(url: string, loop: boolean, volume: number, duration: number,callback:(url)=>void = null): number {
        let id = this.audioEngine.play(url, loop, 0, callback);
        this.audioEngine.fade(id, 0, volume, duration,(id:number)=>{
            callback && callback(url);
        });
        return id;
    }

    public stopMusicWithFade(duration: number,callback:(url)=>void = null) {
        let id = this.curMusic.id;
        let url = this.curMusic.url;
        this.audioEngine.fade(id, this.getMusicVolume(), 0, duration,(id:number)=>{
            callback && callback(url);
        });
    }

    public pauseMusictWithFade() {
        if (this.curMusic.id) {
            this.audioEngine.fade(this.curMusic.id, this.getMusicVolume(), 0, Audio.FadeDuration,(id:number)=>{
                this.audioEngine.pause(this.curMusic.id);
                this.curMusic.paused = true;
            });
        }
    }

    public resumeMusicWithFade(url:string) {
        if (this.curMusic.id) {
            if (this.curMusic.paused) {
                this.audioEngine.resume(this.curMusic.id);
                this.audioEngine.fade(this.curMusic.id, 0, this.getMusicVolume(), Audio.FadeDuration);
                this.curMusic.paused = false;
            }
        } else {
            this.playMusic(url, true);
        }
    }

    /**
     * 暂停音乐
     */
    public pauseMusic() {
        if (this.curMusic.id != null) {
            this.audioEngine.pause(this.curMusic.id);
        }
    }

    /**
     * 恢复音乐
     */
    public resumeMusic() {
        if (this.curMusic.id != null) {
            this.audioEngine.resume(this.curMusic.id);
        }
    }

    /**
     * 停止音乐
     * @param cleanup   是否清楚缓存
     */
    public stopMusic() {
        this.todoMusicUrl = null;
        this.stopMusicWithFade(Audio.FadeDuration);
    }

    /**
     * 停止音乐切不清除todoMusicUrl
     * @param cleanup 
     */
    private stopMusicWithout() {
        if (this.curMusic.id != null) {
            this.stopMusicWithFade(Audio.FadeDuration);
            this.curMusic = {};
        }
    }

    /**
     * 播放音效
     * @param url       音效文件路径
     * @param loop      是否循环
     * @param volume    音效声音
     * @return          音效id
     */
    public playEffect(url: string, loop: boolean = false, callback: (url:string)=>void = null) {
        try {
            let effectId = this.audioEngine.play(url, loop, this.getEffectVolume(),()=>{
                callback && callback(url);
            });
            this.effectDict[effectId] = { id: effectId, url: url, timer: null};
            return effectId;
        } catch (e) {
            cc.warn(e);
        }
        return 0;
    }

    public pauseEffectWithFade(url) {
        let effectInfo = this.getEffectInfo(url);
        if (effectInfo) {
            effectInfo.isPause = true;
            this.audioEngine.fade(effectInfo.id, this.getMusicVolume(), 0, Audio.FadeDuration,(id:number)=>{
                this.audioEngine.pause(effectInfo.id);
                effectInfo.isFadePauseing = true;
            });
        }
    }

    public resumeEffectWithFade(url) {
        let effectInfo = this.getEffectInfo(url);
        if (effectInfo) {
            this.audioEngine.resume(effectInfo.id);
            this.audioEngine.fade(effectInfo.id, 0, this.getMusicVolume(), Audio.FadeDuration);
        } else {
            this.playMusic(url, true);
        }
    }

    public stopEffectWithFade(url) {
        let effectInfo = this.getEffectInfo(url);
        if (effectInfo) {
            this.audioEngine.fade(effectInfo.id, this.getMusicVolume(), 0, Audio.FadeDuration,()=>{
                this.stopEffect(effectInfo.id);
            });
        }
    }

    public setEffectVolume(url, volume) {
        let effectInfo = this.getEffectInfo(url);
        if (effectInfo) {
            this.audioEngine.setVolume(effectInfo.id, volume);
        }
    }

    public playEffectWithFade(url:string, loop:boolean, callback: (url:string)=>void = null): number {

        let id = null;
        if (this.getEffectInfo(url)) {
            id = this.getEffectInfo(url).id;
            this.audioEngine.setVolume(id, this.getMusicVolume(), ()=>{
                callback && callback(url);
            });
        } else {
            id = this.playEffect(url, loop);
            this.audioEngine.fade(id, 0, this.getMusicVolume(), Audio.FadeDuration,()=>{
                callback && callback(url);
            });
        }
        return id;
    }

    /**
     * 暂停音效
     * @param id        音效id或url
     */
    public pauseEffect(id: any) {
        for (let effectId in this.effectDict) {
            let effectInfo = this.effectDict[effectId];

            if (effectInfo.id == id || effectInfo.url == id) {
                effectInfo.isPause = true;
                this.audioEngine.pause(effectInfo.id);
            }
        }
    }

    /**
     * 恢复音效
     * @param id        音效id或url
     */
    public resumeEffect(id: any) {
        for (let effectId in this.effectDict) {
            let effectInfo = this.effectDict[effectId];
            if ((effectInfo.id == id || effectInfo.url == id) && effectInfo.isPause) {
                effectInfo.isPause = false;
                this.audioEngine.resume(effectInfo.id);
                this.audioEngine.setVolume(effectInfo.id, this.getEffectVolume());
            }
        }
    }

    public getEffectInfo(id) {
        for (let effectId in this.effectDict) {
            if (this.effectDict[effectId].url == id || this.effectDict[effectId].id == id) {
                return this.effectDict[effectId]
            }
        }
        return null;
    }

    /**
     * 停止音效
     * @param id        音效id或url
     * @param cleanup   是否清楚缓存
     */
    public stopEffect(id: any) {
        for (let effectId in this.effectDict) {
            let effectInfo = this.effectDict[effectId];

            if (effectInfo.id == id || effectInfo.url == id) {
                this.audioEngine.stop(effectInfo.id);
                delete this.effectDict[effectId];
            }
        }
    }

    /**
     * 停止所有音效
     * @param cleanup   是否清楚缓存
     */
    public stopAllEffects() {
        for (let effectId in this.effectDict) {
            let effectInfo = this.effectDict[effectId];

            this.audioEngine.stop(effectInfo.id);
        }
        this.effectDict = {};
    }

    /** 设置所有音效声音 */
    public setEffectsVolume(volume: number) {
        for (let effectId in this.effectDict) {
            this.audioEngine.setVolume(parseInt(effectId), volume);
        }
    }

    /** 设置一个音效的音量 */
    public setOneEffectVolume(id: number, volume: number) {
        for (let effectId in this.effectDict) {
            if (effectId == id.toString()) {
                this.audioEngine.setVolume(id, volume);
            }
        }
    }

    /**
     * 恢复所有的音乐音效
     */
    public resumeAll() {
        this.audioEngine.resumeAll();
    }
    public stopEffectWithFade20(url) {
        let effectInfo = this.getEffectInfo(url);
        if (effectInfo) {
            this.audioEngine.fade(effectInfo.id, this.getMusicVolume(), this.getMusicVolume()*0.2, Audio.FadeDuration,()=>{
                // this.stopEffect(effectInfo.id);
            });
        }
    }
    public halfMusicVolmue() {
        if (this.curMusic.id != null) {
            this.audioEngine.setVolume(this.curMusic.id, this.getMusicVolume() / 2);
        }
    }

    public resumeMusicVolmue() {
        if (this.curMusic.id != null) {
            this.audioEngine.setVolume(this.curMusic.id, this.getMusicVolume());
        }
    }
    /**
     * 暂停所有的音乐音效
     */
    public pauseAll() {
        this.audioEngine.pauseAll();
    }
    public findEffectByUrl( url:string ){
        for (let effectId in this.effectDict) {
            for (let value in this.effectDict[effectId]) {
                if( this.effectDict[effectId][value] == url ){
                    return effectId;
                }
            }
        }
        return "";
    }
    public destroy() {
        super.destroy();
        this.stopAllEffects();
        if (this.curMusic.id){
            this._audioEngine.stop(this.curMusic.id)
        }
        this.curMusic = null;
        this.effectDict = null;
        this._audioEngine = null;
    }
}