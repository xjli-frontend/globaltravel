/*
 * @CreateTime: Dec 23, 2017 11:04 AM
 * @Author: dgflash
 * @Contact: dgflash@qq.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 10, 2018 8:29 PM
 * @Description: 主题事件
 */

export enum ThemeMessage {
    /**
     * 重新进入成功事件，此时已获取entrydata
     */
    REFRESH_ENTRY = "REFRESH_ENTRY",
    /**
     * 刷新游戏事件
     */
    REFRESH_GAME = "REFRESH_GAME",
    /**
     * 刷新网页事件
     */
    REFRESH_PAGE = "REFRESH_PAGE",

    /** 转动状态变化 */
    STATE_CAHNGE = "state_change",

    /** 播放消除动画时间 */
    WIN_PLAY_ONCE = "WIN_PLAY_ONCE",

    EMILINATED_FLY = "EMILINATED_FLY",

    /** reset 掉落计数UI */
    RESET_FREESPIN_ELEMENTS = "RESET_FREESPIN_ELEMENTS",

    /** 元素中奖特效 */
    ELEM_REWARD_EFFECT = "elements_reward_effect",

    /** 横竖屏切换并且autospin弹窗打开时 */
    AUTO_POPUP_CHANGE = 'auto_popup_change',
    /** 自动旋转次数变化通知*/
    AUTO_TIMES_CHANGE = "AUTO_TIMES_CHANGE",

    OPEN_AUTO_COMPLETE= "OPEN_AUTO_COMPLETE",
    PROP_CHANGE = "PROP_CHANGE",

    FREESPIN_RESULT = "FREESPIN_RESULT",

    /** 监听优惠中心数据改变 */
    PROMOTION_DATA_CHANGE = "promotion_data_change",
    /** 中奖开始 */
    BG_START = "bg_start",
    /** 中奖结束 */
    BG_END = "bg_end",
    /** bg待机 */
    BG_DAIJI= "bg_daiji",
    /** 展示大奖动画 */
    SHOW_BIGWIN = "show_bigwin",
    /** 语言改变 */
    CHANG_LANG = "chang_lang",

    FLOOR_FAST = "floor_fast",
    FLOOR_SLOW = "floor_slow",
    FLOOR_LIGHT = "floor_light",
    FLOOR_LIGHT2 = "floor_light2",
    FLOOR_LIGHT3 = "floor_light3",
    FLOOR_LIGHT4 = "floor_light4",

    /** 控制背景光的隐藏 */
    BG_GUANG_ACTIVE = "bg_guang_active",

    CREDIT = "credit"

}