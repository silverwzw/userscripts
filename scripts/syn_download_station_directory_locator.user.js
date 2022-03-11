// ==UserScript==
// @name         Synology Download Station find directory
// @namespace    http://silverwzw.com/
// @version      0.1
// @author       Silverwzw
// @match        *://*.silverwzw.com:5001/dl*
// ==/UserScript==

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

    function jump_to_directory() {
        const keyword = prompt("Keyword?");
        log("keyword: ", keyword);
        if (!keyword || !keyword.trim()) {
            return;
        }
        for (let el of document.querySelectorAll("li.x-tree-node div")) {
            if (el.innerText.search(keyword) !== -1) {
                log("element found: ", el);
                el.scrollIntoView();
                return;
            }
        }
    }

    document.addEventListener("keypress", e => {
        log("keypress: ", e);
        if (e.key === "j") {
            jump_to_directory();
        }
    });
})();
