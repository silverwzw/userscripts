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

/// <reference path="../lib/credential.ts" />

(function() {

'use strict';

class UnexpectedDocument extends Error {
    constructor(e : Error) {
        super(`Unexpected document structure: ${e.message}`);
        this.stack += '\n' + e.stack;
    }
}

async function main() : Promise<void> {

    let pastebinConn : PastenbinConn = await PastenbinConn.create(pastebinDevKey, false);

    let bookName : string;
    let chapterName : string;
    let content : string;
    
    let paragraphs : Element[];
    
    paragraphs = [... document.querySelectorAll(".j_readContent>p")];
    
    try {
        bookName = getTextByElement("#bookImg");
        chapterName = getTextByElement(".j_chapterName");
        content = paragraphs.map(getTextByElement).join('\n');
    }
    catch (e) {
        throw new UnexpectedDocument(e);
    }
    
    let pasteTitle : string = bookName + " " + chapterName;
    let url : string = await pastebinConn.createPaste(pasteTitle, content);
    console.log("Content saved to pastebin : " + url);
}

main();

})();