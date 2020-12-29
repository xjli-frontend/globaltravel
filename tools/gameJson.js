const path = require('path');
const fs = require('fs');
const axios = require("axios");
const xlsx = require("node-xlsx");
const fse = require('fs-extra');

const trace = console.log;
const DEBUG = true;

let ignoreConfig = `coinvalue;
multiplier;
turntable;
bonus;
bonustype;`

let outputjson = path.join( path.dirname(__dirname) ,"assets","resources","hall","hall.json");
fse.ensureDirSync( path.dirname(outputjson) );

let select_file = process.argv[2];
if (select_file === "$*"){
    select_file = process.argv[3]
}
if (!select_file){
    trace("必须传一个文件名参数")
    return;
}
trace('__dirname=',__dirname);
let getRemoteXlsx = async function (select_file) {
    let response = await axios({
        method:'get',
        url:'https://c_hhe@svn-share.game.com/svn/%E5%85%B0%E6%B9%BE%E4%BA%92%E5%8A%A8/%E9%A1%B9%E7%9B%AE%E8%B5%84%E6%BA%90/%E7%AC%AC4%E7%BB%84/%E7%AD%96%E5%88%92%E6%96%87%E6%A1%A3/%E6%B8%B8%E6%88%8F%E5%A4%A7%E5%8E%85',
        auth:{
            username:"c_hhe",
            password:"asdasd"
        }
    })
    let commitId = '';
    let htmlcontens = response.data.split("\n");
    for (let lineFile of htmlcontens){
        if (lineFile.indexOf('index') && lineFile.indexOf('rev') ){
            let arr = lineFile.split(/\s+/);
            for (let property of arr){
                if (property.indexOf('rev')>=0){
                    commitId = property.replace(/[^\d]+/,'')
                    break;
                }
            }
        }
        if (lineFile.indexOf("file")){
            let re_html = /<(\w+)([^>]*)\/>/g;
            let match = re_html.exec(lineFile);
            let obj = {}
            while (match){
                var _property = match[2];
                var _re_property = /\s*(\w+)\s*=\"([^""]*)\"/g;
                var __match = _re_property.exec(_property);
                while (__match)
                {
                    obj[__match[1]] =  __match[2];
                    __match = _re_property.exec(_property);
                }
                match = re_html.exec(lineFile);
            }
            if (obj.name && obj.name.indexOf(select_file)>=0){
                select_file = obj.href;
                trace("即将从svn上下载游戏玩法配置表=> "+obj.name);
                break;
            }
        }
    }
    trace("commitId=",commitId);
    trace("select_file = ",select_file);
    let excelFile = path.join(__dirname, "__game_temp.xlsx" );
    if (fs.existsSync(excelFile)){
        fs.unlinkSync(excelFile);
    }
    let url = `https://svn-share.game.com/svn/%E5%85%B0%E6%B9%BE%E4%BA%92%E5%8A%A8/!svn/ver/${commitId}/%E9%A1%B9%E7%9B%AE%E8%B5%84%E6%BA%90/%E7%AC%AC4%E7%BB%84/%E7%AD%96%E5%88%92%E6%96%87%E6%A1%A3/%E6%B8%B8%E6%88%8F%E5%A4%A7%E5%8E%85/${select_file}`;
    try{
        response = await axios({
            method:'get',
            url:url,
            auth:{
                username:"c_hhe",
                password:"asdasd"
            },
            responseType:'stream'
        })
        await new Promise( (resolve,reject)=>{
            response.data.pipe(fs.createWriteStream( excelFile ))
            response.data.on('end', () => {
                trace("下载下来的xlsx文件"+excelFile);
                resolve();
            });
        } )
        
    }catch (e){
        trace('url=',url)
        trace("发生错误",e);
        excelFile = "";
    }
    return excelFile;
}

// 忽略的xlsx sheet字段名称
let ignoreSheet = {}
let transferToJson = function ( xlsxPath ) {
    const workbook = xlsx.parse( xlsxPath );
    try {
        let content = {};
        content.date = Date.now();
        for (let sheet of workbook){
            let ignorePatterns = ignoreSheet[sheet.name] ;
            if ( ignorePatterns && ignorePatterns.length < 1 ){
                continue;
            }
            if (!ignorePatterns){
                ignorePatterns = [];
            }
            if (sheet.data){
                let nameSet = new Set();
                let itemNames = sheet.data[1];
                let useHash = true;
                for(let i =2;i<sheet.data.length;i++){
                    let itemData = sheet.data[i];
                    if (!itemData[0]){
                        continue;
                    }
                    if ( nameSet.has( itemData[0] ) && useHash ){
                        console.log("nameSet 出现重复",nameSet,itemData[0]);
                        useHash = false; // 第一列如果有重复则用数组形式
                        break;
                    }
                    nameSet.add(itemData[0]);
                }
                let cData = {};
                if (!useHash){
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

let transferToJsonFunc = function (excelFilePath,ignorePatterns){
    if (!excelFilePath || !fs.existsSync(excelFilePath) || excelFilePath.indexOf(".xlsx")<0){
        trace("路径不能为空且excel文件必须为正确路径！")
        return;
    }
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
        console.log( '忽略=》',JSON.stringify(ignoreSheet))
        transferToJson(excelFilePath)
    }
}


let main = async function(){
    // 输入excel文件
    let excelFilePath = "";
    let needDelete = true;
    if (!fs.existsSync(select_file)){
        let oldTAG = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        try{
            excelFilePath = await getRemoteXlsx(select_file);
        }catch(e){
            trace(e);
        }
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = oldTAG;
    }else{
        needDelete = false;
        excelFilePath = select_file;
    }
    if (!excelFilePath){
        return;
    }
    trace(`处理的xlsx文件 ${excelFilePath}`)
    transferToJsonFunc(excelFilePath,ignoreConfig);

    if (needDelete){
        if (fs.existsSync(excelFilePath)){
            fs.unlinkSync(excelFilePath);
        }
    }
}

main();
