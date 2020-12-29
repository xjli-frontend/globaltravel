import { Audio } from "./audio/Audio";
import { CreatorEx } from "./CreatorEx";
import { EngineMessage } from "./EngineMessage";
import { gui } from "./gui/GUI";
import { LanguageManager } from "./language/Language";
import { LanguageI18nEnum } from "./language/LanguageI18nEnum";
import { Network, network } from "./net/Network";
import { ComponentExtends } from "./ui/ComponentExtends";
import { EngineTime } from "./util/EngineTime";
import { Ex } from "./util/Ex";
import { ValueExtends } from "./util/ValueExtends";
import { Downloader } from "./util/Downloader";
import { Log } from './Log';

/*
 * Author      : donggang
 * Create Time : 2017.9.3
 */

const { ccclass } = cc._decorator;

/** 引擎对外接口 */
@ccclass
export default class engine extends ComponentExtends {
    /** 是否为竖屏 */
    public static fit: boolean = false;
    /** 游戏设计尺寸宽 */
    public static designWidth: number = 0;
    /** 游戏设计尺高 */
    public static designHeight: number = 0;
    /** 音频 */
    public static audio: Audio = null;
    /** 多语言 */
    public static i18n: LanguageManager = null;
    /** 网络状态 */
    public static network: Network = null;
    /** 游戏时间 */
    public static timer: EngineTime = null;
    /** 场景管理 */
    // public static scene: SceneManager = null;
    /** 扩展功能 */
    public static ex: Ex = null;

    /** 值类型处理扩展 */
    public static value: ValueExtends = new ValueExtends();

    /** 主图层 */
    public static canvas: cc.Node = null;

    /** 支持的屏幕旋转慕 默认是auto模式 **/
    public static orientation = cc.macro.ORIENTATION_AUTO;

    public static isShow: boolean = true;
    public static downloader: Downloader = null;

    // 当前应用版本号
    public static appVersion: string = "";
    /** 
     * add by howe 2018/07/19
     * 是否更新游戏尺寸
     * 加这个的目的是延迟更新，避免短时间频繁更新横竖屏导致游戏显示不正常
     */
    private _updateSizeState: number = 0;

    /** 初始设计分辨率 */
    private _originDesignResolution: cc.Size = cc.size(0, 0);

    public static log = new Log();

    onLoad() {
        new CreatorEx();
        this.initEngine();
        this.initManagers();
        this.initEvents();
        // 初始化gui框架
        gui.init(this.node);
        this.run();
        this.dispatchEvent(EngineMessage.ENGINE_START);
    }

    /** 初始化引擎 */
    protected initEngine() {
        engine.canvas = cc.find("Canvas");
        let ccCanvas: cc.Canvas = engine.canvas.getComponent(cc.Canvas);
        this._originDesignResolution = cc.size(ccCanvas.designResolution);
        cc.debug.setDisplayStats(false);
        // 设置游戏帧频率
        cc.game.setFrameRate(60);
        cc.log(`[Engine] initEngine`);
    }

    /** 初始化Manager */
    protected initManagers() {
        engine.i18n = new LanguageManager(LanguageI18nEnum.DEFAULT);
        engine.network = network;
        engine.timer = new EngineTime(this);
        engine.audio = new Audio();
        engine.ex = new Ex();
        engine.downloader = new Downloader(3);
        cc.log(`[Engine] initManagers`);
    }

    /** 初始化事件回调 */
    protected initEvents() {
        // 游戏显示事件
        cc.game.on(cc.game.EVENT_SHOW, () => {
            cc.log("cc.game.EVENT_SHOW");
            engine.isShow = true;
            engine.timer.load();
            // engine.audio.resumeAll();
            this.dispatchEvent(EngineMessage.GAME_ENTER, engine.timer.getLocalTime());
        });

        // 游戏隐藏事件
        cc.game.on(cc.game.EVENT_HIDE, () => {
            cc.log("cc.game.EVENT_HIDE");
            engine.isShow = false;
            engine.timer.save();
            // engine.audio.pauseAll();
            this.dispatchEvent(EngineMessage.GAME_EXIT, engine.timer.getLocalTime());
        });

        // 游戏尺寸修改事件
        cc.view.setResizeCallback(() => {
            this._updateSizeState = 1;
        });
        this.gameFitHandler();
        cc.log(`[Engine] initEvents`);
    }

    update() {
        switch (this._updateSizeState) {
            case 1: {
                this.gameFitHandler();
                this._updateSizeState = 2;
                break;
            }
            case 2: {
                this.dispatchEvent(EngineMessage.GAME_RESIZE);
                this._updateSizeState = 0;
                break;
            }
        }
    }

    /** 游戏界面尺寸处理  可扩展重写 */
    protected gameFitHandler() {
        let canvasSize = cc.view.getCanvasSize();
        cc.log(`[engin] ,canvasSize ${canvasSize.width} ${canvasSize.height} `)
        switch (engine.orientation) {
            case cc.macro.ORIENTATION_PORTRAIT: {
                // 只支持竖屏模式
                engine.fit = true;
                break;
            }
            case cc.macro.ORIENTATION_LANDSCAPE: {
                // 只支持横屏模式
                engine.fit = false;
                break;
            }
            default: {
                if (!cc.sys.isMobile) {
                    engine.fit = false;
                } else {
                    engine.fit = canvasSize.width < canvasSize.height;
                }
                break;
            }
        }
        let ccCanvas: cc.Canvas = engine.canvas.getComponent(cc.Canvas);
        let originDesignResolution = this._originDesignResolution;
        let minSize = Math.min(originDesignResolution.width, originDesignResolution.height);
        let maxSize = Math.max(originDesignResolution.width, originDesignResolution.height);
        if (engine.fit) {
            ccCanvas.designResolution = cc.size(minSize, maxSize);
        } else {
            // let designH = canvasSize.height;
            // let designW = designH * maxSize/minSize;
            ccCanvas.designResolution = cc.size(maxSize, minSize);
        }
        engine.designHeight = ccCanvas.designResolution.height;
        engine.designWidth = ccCanvas.designResolution.width;
        cc.log(`------------- engine.fit=${engine.fit} designResolution=${engine.designWidth} ${engine.designHeight}`)
    }

    /**
     * engine 已完成初始化
     */
    protected run() {

    }
}
