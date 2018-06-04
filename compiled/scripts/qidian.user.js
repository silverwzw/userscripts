// ==UserScript==
// @name        QidianDownloader
// @namespace   silverwzw.com
// @version     0.1
// @author      Silverwzw
// @description Copy content to pastebin while reading a chapter on qidian.com
// @match       http*://*.qidian.com/chapter/*
// @connect     qidian.com
// @connect     pastebin.com
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_deleteValue
// @grant       GM_xmlhttpRequest
// @require     https://raw.githubusercontent.com/silverwzw/userscripts/master/lib/user-script-lib.js
// @run-at      document-end
// ==/UserScript==
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference path="../lib/credential.ts" />
(function () {
    'use strict';
    class UnexpectedDocument extends Error {
        constructor(e) {
            super(`Unexpected document structure: ${e.message}`);
            this.stack += '\n' + e.stack;
        }
    }
    function main() {
        return __awaiter(this, void 0, void 0, function* () {
            let pastebinConn = yield PastenbinConn.create(pastebinDevKey, false);
            let bookName;
            let chapterName;
            let content;
            let paragraphs;
            paragraphs = [...document.querySelectorAll(".j_readContent>p")];
            try {
                bookName = getTextByElement("#bookImg");
                chapterName = getTextByElement(".j_chapterName");
                content = paragraphs.map(getTextByElement).join('\n');
            }
            catch (e) {
                throw new UnexpectedDocument(e);
            }
            let pasteTitle = bookName + " " + chapterName;
            let url = yield pastebinConn.createPaste(pasteTitle, content);
            console.log("Content saved to pastebin : " + url);
        });
    }
    main();
})();
