const DEBUG = true;


const path = require('path');
const fs = require('fs');
const xlsx = require('node-xlsx');

// let dirpath = "D:\\Work\\game-doc\\config";
// let outputDir = "D:\\Work\\game-doc\\outputjson";


let excelFilePath = process.argv[2] || "";
let ignoreConfig = "h";
let outputjson = process.argv[3] || "";

let trace = console.log
// 忽略的xlsx sheet字段名称
let ignoreSheet = {}


let transferToJson = function ( xlsxPath ) {
    const workbook = xlsx.parse( xlsxPath );
    try {
        let content = {};
        content.date = Date.now();
        for (let sheet of workbook)
        {
            let ignorePatterns = ignoreSheet[sheet.name] ;
            if ( ignorePatterns && ignorePatterns.length < 1 ){
                continue;
            }
            if (!ignorePatterns){
                ignorePatterns = [];
            }
            if (sheet.data)
            {
                let nameSet = new Set();
                let itemNames = sheet.data[1];
                let useHash = true;
                for(let i =2;i<sheet.data.length;i++)
                {
                    let itemData = sheet.data[i];
                    if (!itemData[0]){
                        continue;
                    }
                    if ( nameSet.has( itemData[0] ) && useHash )
                    {
                        console.log("nameSet 出现重复",nameSet,itemData[0]);
                        useHash = false; // 第一列如果有重复则用数组形式
                        break;
                    }
                    nameSet.add(itemData[0]);
                }
                let cData = {};
                if (!useHash)
                {
                    cData = [];
                }
                for(let i =2;i<sheet.data.length;i++)
                {
                    let itemData = sheet.data[i];
                    if (!itemData[0]){
                        continue;
                    }
                    if (itemNames[0] === 'id' && useHash){
                        if (itemNames.length === 2){
                            cData[itemData[0]] = itemData[1]
                        }else{
                            let obj = {};
                            itemNames.forEach( (name,index)=>{
                                if (index === 0){
                                    return
                                }
                                if (ignorePatterns.indexOf(name) < 0){
                                    obj[ name ] = itemData[index];
                                }
                            } );
                            obj["id"] = itemData[0];
                            cData[itemData[0]] = obj;
                        }
                        continue;
                    }
                    let obj = {};
                    itemNames.forEach((name,index)=> {
                        if (name === "id"){
                            return;
                        }
                        if (ignorePatterns.indexOf(name)<0){
                            obj[ name ] = itemData[index];
                        }
                    });
                    obj["id"] = itemData[0];
                    if (useHash)
                    {
                        cData[ itemData[0] ] =obj;
                    }else
                    {
                        cData.push(obj);
                    }
                }
                trace(`sheet ${sheet.name} 生成成功，共有${Object.keys(cData).length}个元素`);
                content[sheet.name] = cData
            }
        }
        let contentsStr = '';
        if (DEBUG){
            contentsStr = JSON.stringify(content,null, 2 );
        }else{
            contentsStr = JSON.stringify(content);
        }
        let jsonPath = outputjson
        fs.writeFileSync(jsonPath ,contentsStr);
        trace("json保存路径"+jsonPath);

    }catch (e)
    {
        trace("发生错误",e.toString())
    }
};

// while (xlsxlist.length>0){
//     transferToJson(xlsxlist.pop() );
// }


let transferToJsonFunc = function (excelFilePath,ignorePatterns,processCallback){
    if (!excelFilePath || !fs.existsSync(excelFilePath) || excelFilePath.indexOf(".xlsx")<0){
        processCallback("路径不能为空且excel文件必须为正确路径！")
        return;
    }
    trace = processCallback
    if (ignorePatterns){
        let lineIgnores = ignorePatterns.split(";");
        for (let i=0;i<lineIgnores.length;i++){

            let sheetIgnore = lineIgnores[i];
            sheetIgnore = sheetIgnore.replace(/(^\s*)|(\s*$)/g, ""); 
            console.log(sheetIgnore)
            sheetIgnores = sheetIgnore.split(":");
            if (sheetIgnores.length>0){
                if (sheetIgnores[1]){
                    ignoreSheet[sheetIgnores[0]] = sheetIgnores[1].split(/[.,]+/)
                }else{
                    ignoreSheet[sheetIgnores[0]] = [];
                }
            }
        }
        console.log( JSON.stringify(ignoreSheet))
        outputDir = path.dirname(excelFilePath);
        transferToJson(excelFilePath)
    }
}
module.exports.transferToJson = transferToJsonFunc;


if (excelFilePath && ignoreConfig && outputjson ){
    console.log("excelFilePath = "+excelFilePath)
        console.log("ignoreConfig = "+ignoreConfig)

    transferToJsonFunc(excelFilePath,ignoreConfig,console.log)
}

