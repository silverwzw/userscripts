// ==UserScript==
// @name         TTG Assistant
// @namespace    http://silverwzw.com/
// @version      0.1
// @author       Silverwzw
// @match        *://totheglory.im/*
// @icon         https://totheglory.im/favicon.ico
// @grant        unsafeWindow
// @grant        GM_setClipboard
// ==/UserScript==

// 脚本功能：
// 在任意页面：
//  - 增加快捷键"s"，功能为搜索影视作品
// 在种子列表页面：
//  - 自动按照种子容量从小到大排列
// 在种子详细页面：
//  - 增加快捷键"d"，功能为下载种子
//  - 增加快捷键"z"，功能为滚动至“字幕”锚点
//  - 增加快捷键"c"，功能为提取中文名和种子名，并格式化为文件夹名，然后放入剪贴板

(function() {
    'use strict';

    // ==================
    //   General Setup
    // ==================

    const script_name = "ttg_assistant";
    if (!("userscript" in unsafeWindow)) {
        unsafeWindow.userscript = {};
    }
    if (!(script_name in unsafeWindow.userscript)) {
        unsafeWindow.userscript[script_name] = {
            debug: false
        };
    }
    const script_config = unsafeWindow.userscript[script_name];

    function logif(should_log, ...rest) {
        if (!should_log) {
            return;
        }
        if (rest.length === 1 && typeof rest[0] === "function") {
            rest = rest[0]();
        }
        console.log(`[userscript.${script_name}] `, ...rest);
    }

    function log(...args) {
        logif(script_config.debug, ...args);
    }

    // =================
    //   Script Logic
    // =================

    function redirect(url) {
        log(`redirecting to ${url}`);
        if (script_config.debug) {
            return;
        }
        unsafeWindow.location.href = url;
    }

    const currentURL = new URL(unsafeWindow.location.href);
    log(currentURL);

    const isListPage = currentURL.pathname.match(/^\/browse.php$/) !== null;
    const isDownloadPage = currentURL.pathname.match(/^\/t\/\d+.*/) !== null;

    if (isListPage) {
        log("browse page.");
        if (currentURL.searchParams.get("search_field") === "" ||
            currentURL.searchParams.get("search_field") === null ||
            currentURL.searchParams.get("sort") !== null ||
            currentURL.searchParams.get("type") !== null) {
            log("disabled redirect due to query params.");
        } else {
            currentURL.searchParams.set("sort", 5);
            currentURL.searchParams.set("type", "asc");

            redirect(currentURL.href);
            return;
        }
    }

    if (isDownloadPage) {
        log("download page.");
    }

    function search_keyword() {
        const keyword = unsafeWindow.prompt("Search keyword");
        if (keyword && keyword.trim()) {
            redirect(`https://totheglory.im/browse.php?search_field=${keyword}&c=M&sort=5&type=asc`);
        }
    }

    function jump_to_cc() {
        for (const el of document.querySelectorAll("table#main_table table td")) {
            if (el.innerText.trim() == "字幕") {
                el.scrollIntoView();
                return;
            }
        }
    }

    function download_torrent() {
        document.querySelector("a.index").click();
    }

    function copy_title() {
        let title = "";
        let chinese_title = "";

        let els = document.querySelectorAll("table#main_table td.outer h1");
        if (els.length === 1) {
            const title_text = els[0].innerText;
            const match = title_text.match(/\s*([^\]]+?(?:20|19)\d{2})(?:$|\D)/);
            if (match !== null) {
                title = match[1].replaceAll(" ", ".");
            }
        }

        els = document.querySelectorAll("div#kt_d");
        if (els.length === 1) {
            const text = els[0].innerText;
            for (const regex of [/译\s*名\s*(?:\s|\:|：)s*([^\s\/\\]+)/,
                                 /中\s*文\s*名\s*(?:\s|\:|：)s*([^\s\/\\]+)/,
                                 /《(.+?)》/]) {
                const match = text.match(regex);
                if (match !== null) {
                    chinese_title = match[1];
                    break;
                }
            }
        }

        GM_setClipboard(`[待看][${chinese_title}]${title}`);
    }

    document.addEventListener("keypress", e => {
        log("key press = ", e);

        if (e.key === "s") {
            search_keyword();
        } else if (isDownloadPage) {
            if (e.key === "z") {
                jump_to_cc();
            } else if (e.key === "c") {
                copy_title();
            } else if (e.key === "d") {
                download_torrent();
            }
        }
    });
})();
