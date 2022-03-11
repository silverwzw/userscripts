// ==UserScript==
// @name         PokemonGoNYCMap Addon
// @namespace    silverwzw.com
// @version      0.1
// @description  Display Icon and Show Pokemon Notifications
// @author       Silverwzw
// @match        https://nycpokemap.com/
// @match        https://nycpokemap.com/index.html
// @match        https://nycpokemap.com/gym.html
// @grant        window.focus
// @grant        unsafeWindow
// ==/UserScript==

let arrayify = (obj, i) => Array.prototype.slice.call(obj, i);

(function() {

    'use strict';

    let mute = false, notificationArr = [], el;

    let getNumFromImg = img => {
        let r = img.src.match(/poke_number\/(\d+)\.png/);
        return null === r ? null : r[1];
    };

    let changeIconSmall = (img, num) => {
        img.src = `https://s3.us-east-2.amazonaws.com/pokemongohub-db-web/normal/${num}.png`;
    };

    let changeIconLarge = (img, num) => {
        var numstr = num < 10 ? "00" + num : (num < 100 ? "0" + num : num);
        img.src = `https://s3.us-east-2.amazonaws.com/pokemongohub-db-web/normal-animated/${numstr}.gif`;
    };

    let notify = (img, num) => {

        if (!isPokemonChecked(Number(num))) {
            return;
        }

        if (mute) {
            return;
        }

        let close = notification => {
            console.log("close");
            notification.close();
            notificationArr = notificationArr.filter(el => el !== notification);
        };

        let sh = () => {

            let notification = new Notification("New Message", {
                icon: img.src
            });

            notificationArr.push(notification);

            notification.onclick = function() {
                if (el !== undefined) {
                    el.style = "";
                }
                el = img;
                el.style = "border-style: solid; border-color: red";
                window.focus();
                unsafeWindow.parent.focus();
                close(this);
            };

            setTimeout(() => close(notification), 10000);
        };

        if (Notification.permission != "granted" && Notification.permission !== "denied") {
            Notification.requestPermission(sh);
        } else {
            sh();
        }
    };

    if (null !== window.location.pathname.match(/^\/gym\.htm/)) {
        setInterval(() => {
            arrayify($("img.pokemon_icon_img:not(.processed)")).forEach(img => {
                let num = getNumFromImg(img);
                if (num === null) {
                    return;
                }
                changeIconSmall(img, num);
                img.classList.add("processed");
            });
        }, 1000);
        return;
    }

    setInterval(() => {
        arrayify($("img.pokemon_icon_img:not(.processed)")).forEach(img => {
            let num = getNumFromImg(img);
            changeIconSmall(img, num);
            notify(img, num);
            img.classList.add("processed");
        });
        arrayify($("div.filter_checkbox>label:not(.processed)")).forEach(label => {
            let img = $("img", label)[0];
            let num = getNumFromImg(img);
            changeIconLarge(img, num);
            img.style = "max-height: 50px; max-width: 50px";

            let textNode = arrayify(label.childNodes).find(n => n.nodeType === n.TEXT_NODE);
            var text = textNode.data.trim();
            textNode.data = " ";
            let link = document.createElement("a");
            link.href = `https://db.pokemongohub.net/pokemon/${num}`;
            link.text = text;
            link.target = "_blank";
            label.appendChild(link);

            label.classList.add("processed");
            img.classList.add("processed");
        });
    }, 1000);

    let toggleMute = () => {
        mute = !mute;
        l.text = mute ? "Enable Notification" : "Disable Notification";
    };

    let dismissAllNotifications = () => {
        notificationArr.forEach(notification => notification.close());
        notificationArr = [];
    };

    let l = document.createElement("a");
    l.href = "#";
    l.text = mute ? "Enable Notification" : "Disable Notification";
    l.onclick = toggleMute;

    let d = document.createElement("a");
    d.href = "#";
    d.text = "Dismiss All";
    d.onclick = dismissAllNotifications;

    let topbar = $("#topbar")[0];
    topbar.appendChild(l);
    topbar.appendChild(d);

    let onclose;
    if ("function" === typeof unsafeWindow.onbeforeunload) {
        let origin = unsafeWindow.onbeforeunload;
        onclose = function () {
            dismissAllNotifications();
            return origin.apply(this, arrayify(arguments));
        };
    }
    else {
        onclose = () => { dismissAllNotifications(); return null; };
    }

    unsafeWindow.onbeforeunload = onclose;
})();
