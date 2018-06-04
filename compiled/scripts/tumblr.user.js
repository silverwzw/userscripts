// ==UserScript==
// @name         tumblr image downloader / right click
// @namespace    silverwzw.com
// @version      0.1
// @description  download all visible 1280 quality images from user page. capped at 2 images/second
// @author       Silverwzw
// @match        *.tumblr.com
// @grant        GM_download
// @require      https://raw.githubusercontent.com/silverwzw/userscripts/master/compiled/lib/user-script-lib.js
// @run-at       context-menu
// ==/UserScript==
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
(function () {
    'use strict';
    ;
    ;
    let downloaded = {};
    let searchPattern = /.*\.tumblr\.com\/.*\/tumblr_[0-9a-zA-Z]+_\d{2,4}\.[a-zA-Z0-9]{3,4}$/;
    let replacePattern = /_\d{2,4}(?=\.[a-zA-Z0-9]{3,4}$)/;
    function setColor(img, color) {
        img.style.borderTopColor = color;
        img.style.borderTopStyle = "solid";
        img.style.borderTopWidth = "5px";
    }
    function filterImage(image) {
        if (!searchPattern.test(image.src)) {
            image.classList.add("failmatch");
            return false;
        }
        return true;
    }
    function downloadOneP(context) {
        return new Promise((fulfill, reject) => {
            let details;
            function setErrorAndReject(reason) {
                let ec = Object.create(context);
                ec.error = reason;
                reject(ec);
            }
            details = {
                url: context.src,
                name: context.src.substr(context.src.lastIndexOf("/") + 1),
                onload: () => fulfill(context),
                onerror: (error) => setErrorAndReject(error.error + " " + error.details),
                onprogress: () => setColor(context.img, "blue"),
                ontimeout: setErrorAndReject.bind(undefined, "timeout")
            };
            GM_download(details);
        });
    }
    function download(contexts, num) {
        if (num === undefined) {
            num = 1;
        }
        contexts = contexts.slice(0, num);
        if (contexts.length === 0) {
            return [];
        }
        let promises;
        promises = contexts.map((c) => {
            c.img.classList.add("download");
            downloaded[c.src] = true;
            setColor(c.img, "orange");
            return downloadOneP(c).then((c) => setColor(c.img, "green"), (c) => {
                setColor(c.img, "red");
                console.log("Error downloading " + c.src + ", msg: " + c.error);
            });
        });
        return promises;
    }
    function getContext() {
        let contexts;
        let images;
        images = [...document.querySelectorAll("a>img:not(.download):not(.failmatch)")];
        contexts = images.filter(filterImage).map((img) => ({
            img: img,
            src: img.src.replace(replacePattern, "_1280")
        }));
        return contexts.filter((c) => !downloaded[c.src]);
    }
    function doOnce() {
        let contexts = getContext();
        return Promise.all(download(contexts, 1));
    }
    function start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield setTimeoutP(500);
            yield doOnce();
            yield start();
        });
    }
    start();
})();
