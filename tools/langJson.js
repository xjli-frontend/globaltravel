const path = require('path');
const fs = require('fs');
const axios = require("axios");
const xlsx = require("node-xlsx");
const fse = require('fs-extra');

const trace = console.log;

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
        url:'https://svn-share.game.com/svn/%E5%85%B0%E6%B9%BE%E4%BA%92%E5%8A%A8/%E9%A1%B9%E7%9B%AE%E8%B5%84%E6%BA%90/%E8%AF%AD%E8%A8%80%E6%96%87%E5%AD%97%E9%85%8D%E7%BD%AE%E8%A1%A8',
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
                trace("即将从svn上下载多语种表=> "+obj.name);
                break;
            }
        }
    }
    trace("commitId=",commitId);
    trace("select_file = ",select_file);
    let excelFile = path.join(__dirname, "__temp.xlsx" );
    if (fs.existsSync(excelFile)){
        fs.unlinkSync(excelFile);
    }
    let url = `https://svn-share.game.com/svn/%E5%85%B0%E6%B9%BE%E4%BA%92%E5%8A%A8/!svn/ver/${commitId}/%E9%A1%B9%E7%9B%AE%E8%B5%84%E6%BA%90/%E8%AF%AD%E8%A8%80%E6%96%87%E5%AD%97%E9%85%8D%E7%BD%AE%E8%A1%A8/${select_file}`;
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

const isChineseChar = function (str){   
    var reg = /[\u4E00-\u9FA5\uF900-\uFA2D]/;
    return reg.test(str);
}
let langExcelToJson = function(excelFilePath, outputDir, minify){
    let parseSheet = function( sheet){
        let langMap = {};
        let titles = sheet[0];// 标题数组
        for (let i = 1;i< titles.length;i++){
            let lang = titles[i];
            if (isChineseChar( lang )){
                continue;
            }
            let langObj = {};
            for (let m = 1;m<sheet.length;m++){
                let rowDatas = sheet[m];
                let labId = rowDatas[0];
                if (!labId){
                    continue;
                }
                let label = rowDatas[i] || "";
                label = label.replace(/\\r/g,"");
                label = label.replace(/\\n/g,"\n");
                langObj[labId] = label;
            }
            langMap[lang] = langObj;
        }
        return langMap;
     }
    let transferToJsonNew = function (workbook) {
        // 公用模块
        let commonSheet = workbook[0].data;
        let commonDatas = parseSheet(commonSheet);
        let themeSheet = workbook[1].data;
        let themeDatas = parseSheet(themeSheet);
        let accumulationSheet = workbook[2].data;
        let accumulationDatas = parseSheet(accumulationSheet);
        for (let lang in commonDatas){
            let langObj = commonDatas[lang];
            let langObj1 = themeDatas[lang];
            let langObj2 = accumulationDatas[lang];
            let lll = Object.assign(langObj,langObj1, langObj2);
            let contentsStr = '';
            if (minify){
                contentsStr=JSON.stringify(lll);
            }else{
                contentsStr=JSON.stringify(lll,null,2);
            }
            fs.writeFileSync(  path.join(outputDir,lang+".json") ,contentsStr,"utf8");
            trace(`${lang} 多语言文本已导出成功，${path.join(outputDir,lang+".json")}`);
        }
    };
    let transferToJson = function ( workbook ) {
        for (let sheet of workbook){
            if (sheet.data){
                for (let i=1;i<sheet.data[0].length;i++){
                    let lang = sheet.data[0][i];// 语言
                    if (isChineseChar(lang)){
                        continue;
                    }
                    let langObj = {};
                    for (let m=1;m<sheet.data.length;m++){
                        let labId = sheet.data[m][0];
                        if (!labId){
                            continue
                        }
                        let label = sheet.data[m][i] || "";
                        if (langObj[labId]){
                            throw new Error('Error: labid重复！请检查'+lang);
                        }
                        label = label.replace(/\\r/g,"");

                        label = label.replace(/\\n/g,"\n");
                        langObj[labId] = label;
                    }
                    let contentsStr = '';
                    if (minify){
                        contentsStr=JSON.stringify(langObj);
                    }else{
                        contentsStr=JSON.stringify(langObj,null,2);
                    }
                    fs.writeFileSync(  path.join(outputDir,lang+".json") ,contentsStr,"utf8");
                    trace( `${lang} 多语言文本已导出成功，${path.join(outputDir,lang+".json")}`);
                }
            }
            break;
        }
    };

    try { 
        const workbook = xlsx.parse( excelFilePath );
        if (workbook.length > 2){
            transferToJsonNew(workbook);
        }else{
            transferToJson(workbook);
        }
    }catch (e){
        trace("发生错误",e.toString())
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
    // 输出json文件目录
    let outputDir = path.join( path.dirname(__dirname) ,"assets","resources","langjson");
    await fse.ensureDir(outputDir);
    let minify = false;
    langExcelToJson(excelFilePath, outputDir, minify);
    if (needDelete){
        if (fs.existsSync(excelFilePath)){
            fs.unlinkSync(excelFilePath);
        }
    }
}

main();