/**
 * author: xuao
 * time: 2019/10/9
 * func: 游戏全局事件消息
 */
export class GameMessage{
    /** 收到新邮件 */
    public static readonly RECEIVED_NEW_MAIL: string = "received_new_mail";
    /** 退出VIP大厅 */
    public static readonly EXIT_VIP_HALL: string = "exit_vip_hall";
    /** 进入游戏大厅 */
    public static readonly ENTER_VIP_HALL: string = "enter_vip_hall";
}
