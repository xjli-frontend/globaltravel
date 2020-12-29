/**
 * author: xuao
 * time: 2019/10/17
 * func: 大厅协议错误码
 */

export class HallProtocolCode{
    public static readonly SUCCESS           = 0;                   // 正常
    public static readonly LOGIC_ERROR       = 1;                   // 计算过程逻辑错误
    public static readonly PARAM_ERROR       = 2;                   // 参数错误;缺少参数;或参数规格错误
    public static readonly INVALID           = 3;                   // 无效操作;如cd已经结束;秒cd则为无效操作
    public static readonly NO_USER           = 4;                   // 没有这个玩家
    public static readonly NOT_IN_GAME       = 5;                   // 玩家未登录
    public static readonly SERVER_ERROR      = 6;                   // 服务器内部错误
    public static readonly SERVER_CLOSE      = 7;                   // 已关服;仅仅是不提供服务;进程等数据刷回数据库后关闭
    public static readonly LACK_CREDIT       = 8;                   // 货币不足
    public static readonly UNKNOWN_REQUEST   = 9;                   // 未知的请求
    public static readonly ENTRY_CLOSE       = 10;                  // 玩法已经关闭
    public static readonly NETWORK_ERROR     = 11;                  // 网络错误，请求第三方服务时失败（客户端退出）

    public static readonly ACC_ACCOUNT_LOGINED = 20;                // 账号已登录，不需要重复登录
    public static readonly AUTO_COMPLETE_LOCK  = 31;                // 正在自动结算，不允许进行操作
    public static readonly NEED_ENTRY_BEFORE   = 50;                // 需要先进入主题

    public static readonly GAME_NOT_EXIST     = 101;                 // 游戏不存在
    public static readonly GAME_NOT_OPEN      = 102;                 // 游戏未开放
    public static readonly LEVEL_NOT_MATCH    = 103;                 // 玩家等级不够，不能进入游戏
    public static readonly ROOM_NOT_MATCH     = 104;                 // 玩家可进的房间等级不够，不能获取和进入该房间的游戏
    public static readonly TIME_NOT_ENOUGH    = 105;                 // 还未到领奖时间
    public static readonly GET_REWARD_FAILED  = 106;                 // 领奖失败
    public static readonly ITEM_NOT_FOUND     = 110;                 // 充值条目不存在
    public static readonly ORDER_NOT_FOUND    = 111;                 // 订单不存在
    public static readonly UID_NOT_MATCH      = 112;                 // 订单不是自己的
    public static readonly VERIFY_FAILED      = 113;                 // 第三方验证失败
    public static readonly REPEAT_PAY         = 114;                 // 重复的订单
    public static readonly MAIL_CREATE_FAILED = 120;                 // 邮件创建失败
    public static readonly MAIL_NOT_FOUND     = 121;                 // 邮件不存在
    public static readonly MAIL_HAS_EXPIRED   = 122;                 // 邮件已过期
    public static readonly MAIL_HAS_RECEIVED  = 123;                 // 附件已领取
    public static readonly MAIL_NO_RECEIVED   = 124;                 // 该邮件没有附件
    public static readonly MAIL_IS_UNREAD     = 125;                 // 该邮件处于未读状态，不能领取
    public static readonly USER_IS_RECEVING   = 126;                 // 用户正在一键领取，不要重复请求
    public static readonly ACC_NOT_GUEST      = 130;                 // 当前登录的帐号不是游客帐号，不允许绑定
    public static readonly PLATFORM_NOT_FOUND = 131;                 // 要绑定的平台不存在
    public static readonly BIND_ACC_EXISTS    = 132;                 // 要绑定的帐号已经存在，不允许绑定 

    public static readonly ERROR        = 400;
    public static readonly REJECT       = 406;
    public static readonly HTTPS_ERROR  = 1000;
    public static readonly WALLET_ERROR = 1001
}
