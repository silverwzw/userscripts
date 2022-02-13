// ==UserScript==
// @name         Enter id through right arrow key
// @namespace    http://silverwzw.com/
// @version      0.1
// @author       Silverwzw
// @include      *
// @exclude      /^https?://[^/]+\.google.com\/.*/
// @exclude      /^https?://[^/]+\.gmail.com\/.*/
// @exclude      /^https?://[^/]+\.youtube.com\/.*/
// @grant        unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    if (!("userscript_debug" in unsafeWindow)) {
        unsafeWindow.userscript_debug = false;
    }

    const placeholder_delay = 500;
    const suffix = "@your_domain.com";
    const tag_user = "user_name";
    const supported_input_types = new Set(["text", "id", "url", "email"]);
    const supported_protocols = new Set(["http", "https"]);
    const regional_domains = new Set(["cn", "us", "tw", "hk", "ca", "au", "uk"]);
    const wellknown_domains = new Set(["com", "gov", "edu", "org"]);
    const ip_re = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/;
    const hardcode_hostnames = [
        {re: ip_re, disable: true},
        {re: /intl\.alipay\.com$/, prefix: "ali.intl"},
        {re: /aliexpress\.com$/, prefix: "ali.intl"},
        {re: /alipay\.com$/, prefix: "ali"},
        {re: /bilibili\.com$/, tag: "bilibili.com"},
        {re: /retiehe\.com$/, tag: "retiehe.com"},
        {re: /silverwzw\.com$/, disable: true},
        {re: /labstack\.com$/, disable: true },
        {re: /papajohns\.com$/, prefix: "papajohns"},
        {re: /arknights\.global$/, prefix: "yo-star.com"},
        {re: /cue\.dev/, prefix: "cuehealth.com"}
    ];

    const url = new URL(document.URL);
    if (!supported_protocols.has(url.protocol.slice(0, -1).toLowerCase())) {
        // disable the logic on local html file
        log(unsafeWindow.userscript_debug, `Disabled due to incorrect protocol ${url.protocol}.`);
        return;
    }
    const disabled_domain = Symbol("disabled_domain");
    const id = resolve(url.hostname.toLowerCase());
    if (id === disabled_domain) {
        return;
    }

    function log(should_log, ...rest) {
        if (!should_log) {
            return;
        }
        console.log(...rest);
    }

    function resolve(hostname) {
        for (const {re, id, prefix, tag, disable} of hardcode_hostnames) {
            if (hostname.match(re)) {
                if (id !== undefined) {
                    return id;
                } else if (prefix !== undefined) {
                    return prefix + suffix;
                } else if (tag !== undefined) {
                    return `${tag_user}+A.${tag}@gmail.com`;
                } else if (disable) {
                    log(unsafeWindow.userscript_debug, `Disabled due to '${hostname}' is a disabled hostname.`);
                    return disabled_domain;
                }
            }
        }

        const domains = hostname.split(".");
        let slice_start;

        if (domains[0] === "www") {
            slice_start = 1;
        } else if (regional_domains.has(domains.at(-1)) && wellknown_domains.has(domains.at(-2))) {
            slice_start = -3;
        } else {
            slice_start = -2;
        }
        return domains.slice(slice_start).join(".") + suffix;
    }

    function isTargetValid(target, debug) {
        if (target === undefined || target === null) {
            log(debug, "Invalid target because target is undefined or null.");
            return false;
        }

        const { nodeName, type, disabled, readOnly, value, minLength, maxLength, pattern } = target;

        switch (nodeName.toUpperCase()) {
          case "INPUT":
            if (!supported_input_types.has(type)) {
                log(debug, `Invalid input type: "${type}".`);
                return false;
            } break;
          case "TEXTAREA":
            break;
          default:
            log(debug, `Invalid target node: "${nodeName}".`);
            return false;
        }

        if (disabled || readOnly || value === undefined || value === null || value.length !== 0) {
            log(debug, "Invalid target because readOnly or not empty: ", target);
            return false;
        }

        if (typeof maxLength === "number" && maxLength >= 0 && id.length > maxLength) {
            log(debug, `Disabled due to max-length = ${maxLength}, id = ${id}.`);
            return false;
        }
        if (typeof minLength === "number" && minLength >= 0 && id.length < minLength) {
            log(debug, `Disabled due to min-length = ${minLength}, id = ${id}.`);
            return false;
        }
        if (typeof pattern === "string" && pattern.length !== 0 && !id.match(pattern)) {
            log(debug, `Disabled due to pattern = ${pattern}.`);
            return false;
        }

        return true;
    }

    function keydownHandler(event) {
        if (event.key !== "ArrowRight") {
            return;
        }
        if (!isTargetValid(event.target, unsafeWindow.userscript_debug)) {
            return;
        }
        event.target.value = id;
        event.preventDefault();
    }

    function setPlaceholder(event) {
        const { target } = event;
        if (!isTargetValid(target, false)) {
            return;
        }

        if (typeof target.placeholder === "string" && target.placeholder.length !== 0) {
            return;
        }

        target.placeholder = id;

        target.addEventListener("blur", event => {
            if (target.placeholder === id) {
                target.placeholder = "";
            }
        }, { once: true, passive: true });
    }

    document.addEventListener("focusin",
        event => setTimeout(() => setPlaceholder(event), placeholder_delay),
        { passive: true });

    document.addEventListener("keydown", keydownHandler);
})();
