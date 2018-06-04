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

(function() {

'use strict';
    
interface Context {
    img: HTMLImageElement,
    src : string
};

interface ErrorContext extends Context {
    error : string
};

let downloaded : { [ url : string ] : boolean } = {};
let searchPattern : RegExp = /.*\.tumblr\.com\/.*\/tumblr_[0-9a-zA-Z]+_\d{2,4}\.[a-zA-Z0-9]{3,4}$/;
let replacePattern : RegExp = /_\d{2,4}(?=\.[a-zA-Z0-9]{3,4}$)/;

function setColor(img : HTMLImageElement, color : string) : void {
    img.style.borderTopColor = color;
    img.style.borderTopStyle = "solid";
    img.style.borderTopWidth = "5px";
}

function filterImage(image : HTMLImageElement) : boolean {
    if (!searchPattern.test(image.src)) {
        image.classList.add("failmatch");
        return false;
    }
    return true;
}

function downloadOneP(context : Context) : Promise<Context> {
    return new Promise<Context>((fulfill : (resolved : Context) => void,
                                 reject : (reason ?: ErrorContext) => void) : void => {
        
        let details : GM_Types.DownloadDetails;

        function setErrorAndReject(reason : string) : void {
            let ec : ErrorContext = Object.create(context);
            ec.error = reason;
            reject(ec);
        }

        details = {
            url : context.src,
            name : context.src.substr(context.src.lastIndexOf("/") + 1),
            onload: () : void => fulfill(context),
            onerror: (error : GM_Types.DownloadError) : void => setErrorAndReject(error.error + " " + error.details),
            onprogress: () : void => setColor(context.img, "blue"),
            ontimeout: setErrorAndReject.bind(undefined, "timeout")
        };
        GM_download(details);
    });
}

function download(contexts : Context[], num ?: number) : Promise<void>[] {
    if (num === undefined) {
        num = 1;
    }
    contexts = contexts.slice(0, num);
    if (contexts.length === 0) {
        return [];
    }

    let promises : Promise<void>[];
    promises = contexts.map((c : Context) : Promise<void> => {
        c.img.classList.add("download");
        downloaded[c.src] = true;
        setColor(c.img, "orange");
        return downloadOneP(c).then(
            (c : Context) : void => setColor(c.img, "green"),
            (c : ErrorContext) : void => {
                setColor(c.img, "red");
                console.log("Error downloading " + c.src + ", msg: " + c.error);
            }
        );
    });

    return promises;
}

function getContext() : Context[] {

    let contexts : Context[];
    let images : HTMLImageElement[];
    
    images = [... document.querySelectorAll("a>img:not(.download):not(.failmatch)")] as HTMLImageElement[];
    contexts = images.filter(filterImage).map((img : HTMLImageElement) : Context => ({
        img: img,
        src : img.src.replace(replacePattern, "_1280")
    }));

    return contexts.filter((c : Context) : boolean => !downloaded[c.src]);
}

function doOnce() : Promise<void> {
    let contexts : Context[] = getContext();
    return Promise.all(download(contexts, 1)) as Promise<any> as Promise<void>;
}

async function start() : Promise<void> {
    await setTimeoutP(500);
    await doOnce();
    await start();
}

start();

})();