/*
 * @CreateTime: Aug 16, 2018 7:03 PM
 * @Author: howe
 * @Contact: ihowe@outlook.com
 * @Last Modified By: howe
 * @Last Modified Time: May 29, 2019 2:17 PM
 * @Description: Modify Here, Please 
 * 
 * 
 * 资源下载器
 * 
 * 自动下载多个资源文件，断网重连会自动开启下载
 */


export class AssetsQueueLoader {
    
    public static loadResArrayDir(res_urls: string[], progressCallback: (progress:number,item:any)=>void, completeCallback: (error: Error|Array<Error>, resource: any[]) =>void ) {
        let urls = [];
        let uuids = [];
        let tables = (<any>cc.loader)._resources;
        if (!tables){
            tables =  (<any>cc.loader)._assetTables["assets"];
        }
        for (let i = 0; i < res_urls.length; i++) {
            let url = res_urls[i];
            let temp_urls = [];
            let temp_uuids = tables.getUuidArray(url, null, temp_urls);

            for (let j = 0; j < temp_urls.length; j++) {
                urls.push(temp_urls[j]);
            }
            for (let k = 0; k < temp_uuids.length; k++) {
                uuids.push(temp_uuids[k]);
            }
        }
        let errorItems = [];
        let progress: number = 0;
        let loadedMap = {};
        let hasComplete = false;
        (<any>cc.loader)._loadResUuids(uuids,
            (completedCount: number, totalCount: number, item: any) => {
                if (item.error){
                    errorItems.push(item.error)
                }
                totalCount = Math.max(totalCount,uuids.length);
                loadedMap[item.url] = true;
                completedCount = Object.keys(loadedMap).length;
                if (progressCallback){
                    let temp_progress: number = completedCount / totalCount;
                    if (progress < temp_progress) {
                        progress = temp_progress;
                    }
                    if (progress > 1){
                        progress = 1;
                    }
                    progressCallback(progress, item);
                }
                if (completedCount >= totalCount){
                    if (hasComplete){
                        return;
                    }
                    hasComplete = true;
                    if ( completeCallback){
                        if (errorItems.length > 0 ){
                            completeCallback( errorItems , [] );
                        }else{
                            completeCallback( null , [] );
                        }
                    }
                }
            },
            (error: Error, resource: any[]) => {
                if (hasComplete){
                    return;
                }
                hasComplete = true;
                if ( completeCallback){
                    if (error){
                        completeCallback( error , resource );
                    }else if (errorItems.length > 0 ){
                        completeCallback( errorItems , resource );
                    }else{
                        completeCallback( null , resource );
                    }
                }
            },
            urls);
        
    }
}