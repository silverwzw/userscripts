// ==UserScript==
// @name         23qb_auto_download
// @namespace    http://silverwzw.com
// @version      0.1
// @description  Automatically download text from 23qb.net
// @author       Silverwzw
// @match        *://*.23qb.net/book/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    //
    // == 帮助函数 ==
    //

    // 获得本页标题
    function GetTitle() {
        let e = document.querySelectorAll("div#mlfy_main_text>h1");
        if (e.length != 1) {
            throw new Error("Cannot get title element!");
        }
        return e[0].innerText;
    }

    // 获得本页正文
    function GetContent() {
        // ts()函数会异步加载*部分*正文，这里直接调用使得正文全部加载
        try {
            unsafeWindow.ts();
        } catch(e) {
            ;
        }

        // 从Dom获得正文
        let e = document.querySelectorAll("div#mlfy_main_text>div#TextContent");
        if (e.length != 1) {
            throw new Error("Cannot get content element!");
        }

        // 拼接，去除水印
        let text = "";
        for (let line of e[0].querySelectorAll("p")) {
            let t = line.innerText;
            if (t != "铅笔小说" && t != "（继续下一页）") {
                text += "\n\n" + t;
            }
        }
        return text;
    }

    // 下载一个文件名为filename，内容为text的文本文件
    function Download(filename, text) {
        let e = document.createElement('a');
        e.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        e.setAttribute('download', filename);

        e.style.display = 'none';
        document.body.appendChild(e);
        console.log(e.click());

        document.body.removeChild(e);
    }

    // 判断是否是书籍内页
    function IsBook(pathname) {
        return pathname.match(/^\/book\/\d+\/[0-9_]+\.html$/);
    }

    // 调试信息
    function Log(text) {
        console.log(`UserScript[${GM_info.script.name}]:\n ${text}.`);
    }

    // 设置状态机函数（自动下载用），自动下载的时候需要跨页维持状态。
    function GlobalVar(name) {
        return `${GM_info.script.name}:${name}`;
    }

    //
    // == 主逻辑 ==
    //

    if (!IsBook(document.location.pathname)) {
        Log("Warning: This page does not seem like a book page.");
    }

    try {
        // 获得标题和正文
        const title = GetTitle();
        const content = GetContent();

        // 调用Action函数即下载
        const Action = () => Download(title, `${title}\n\n${content}`);

        // 设置页面内全局函数autodownload，调用autodownload时实现自动下载功能
        unsafeWindow.autodownload = function () {
            // 将状态机设为“寻找第一页”状态
            GM_setValue(GlobalVar("autodownload"), "find_first_page");
            // 重载本页使得状态机的新状态得到处理。
            document.location.reload();
        };

        // 导航信息
        const ReadParams = unsafeWindow.ReadParams || {};

        // 获得状态机状态
        let ad_phase = GM_getValue(GlobalVar("autodownload"), "disabled");
        Log(`Auto download phase: ${ad_phase}`);

        // 如果状态机状态为“寻找第一页”
        if (ad_phase == "find_first_page") {
            // 如果前一页是书籍内页
            if (IsBook(ReadParams.url_previous)) {
                // 跳转到前一页
                setTimeout(() => {
                    unsafeWindow.location.pathname = ReadParams.url_previous;
                }, 2000);
                return;
            }
            // 否则，当前页就是第一页。将状态机设置为“开始下载”
            ad_phase = "started";
            GM_setValue(GlobalVar("autodownload"), ad_phase);
        }

        // 如果状态机状态为“开始下载”
        if (ad_phase == "started") {
            // 执行下载
            Action();
            // 如果有下一页
            if (IsBook(ReadParams.url_next)) {
                // 跳转到下一页
                setTimeout(() => {
                    unsafeWindow.location.pathname = ReadParams.url_next;
                }, 2000);
                return;
            } else {
                // 否则，已下载完最后一页，状态机设为停止。
                GM_setValue(GlobalVar("autodownload"), "disabled");
                return;
            }
        }

        // 自动下载状态为“禁止”，那么只下载本页。
        Action();

    } catch (e) {
        // 有任何异常，则状态机设为停止
        GM_setValue(GlobalVar("autodownload"), "disabled");
        Log(`Error ${e.message}`);
    }
})();
