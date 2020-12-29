/*
 * @CreateTime: Aug 14, 2018 5:18 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: Dec 19, 2018 3:44 PM
 * @Description: Modify Here, Please 
 * 
 * 游戏配置静态访问类
 */

import GameConfig from "./GameConfig";
import QueryConfig from "./QueryConfig";

export default class Config{

    /** 配置数据，版本号、支持语种等数据 */
    public static game:GameConfig = null;

    /** 处理浏览器地址栏参数，包括服务器ip、端口等数据 */
    public static query:QueryConfig = new QueryConfig();
    
    public static init( gameConfig:any ){
        Config.game = new GameConfig(gameConfig);

    }
}



