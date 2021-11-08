// ==UserScript==
// @name         Enter email through right arrow key
// @namespace    http://silverwzw.com/
// @version      0.1
// @author       Silverwzw
// @include      *
// @exclude      /^https?://[^/]+\.google.com\/.*/
// @exclude      /^https?://[^/]+\.gmail.com\/.*/
// @exclude      /^https?://[^/]+\.youtube.com\/.*/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const debug = false;
    const placeholder_delay = 500;
    const suffix = "@silverwzw.com";
    const supported_input_types = new Set(["text", "email", "url"]);
    const supported_protocols = new Set(["http", "https"]);
    const regional_domains = new Set(["cn", "us", "tw", "hk", "ca", "au", "uk"]);
    const wellknown_domains = new Set(["com", "gov", "edu", "org"]);
    const hardcode_hostnames = [
        {re: /intl\.alipay\.com$/, prefix: "ali.intl"},
        {re: /aliexpress\.com$/, prefix: "ali.intl"},
        {re: /alipay\.com$/, prefix: "ali"}
    ];

    const url = new URL(document.URL);
    if (!supported_protocols.has(url.protocol.slice(0, -1).toLowerCase())) {
        // disable the logic on local html file
        log(debug, `Disabled due to incorrect protocol ${url.protocol}.`);
        return;
    }
    const email = resolve(url.hostname.toLowerCase());

    function log(should_log, ...rest) {
        if (!should_log) {
            return;
        }
        console.log(...rest);
    }

    function resolve(hostname) {
        for (const {re, email, prefix} of hardcode_hostnames) {
            if (hostname.match(re)) {
                return email !== undefined ? email : (prefix + suffix);
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
                log(debug, `Invalid input type: "${type}" }.`);
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

        if (typeof maxLength === "number" && maxLength >= 0 && email.length > maxLength) {
            log(debug, `Disabled due to max-length = ${maxLength}, email = ${email}.`);
            return false;
        }
        if (typeof minLength === "number" && minLength >= 0 && email.length < minLength) {
            log(debug, `Disabled due to min-length = ${minLength}, email = ${email}.`);
            return false;
        }
        if (typeof pattern === "string" && pattern.length !== 0 && !email.match(pattern)) {
            log(debug, `Disabled due to pattern = ${pattern}.`);
            return false;
        }

        return true;
    }

    function keydownHandler(event) {
        if (event.key !== "ArrowRight") {
            return;
        }
        if (!isTargetValid(event.target, debug)) {
            return;
        }
        event.target.value = email;
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

        target.placeholder = email;

        target.addEventListener("blur", event => {
            if (target.placeholder === email) {
                target.placeholder = "";
            }
        }, { once: true, passive: true });
    }

    document.addEventListener("focusin",
        event => setTimeout(() => setPlaceholder(event), placeholder_delay),
        { passive: true });

    document.addEventListener("keydown", keydownHandler);
})();
