function shallowCopy(target, source) {
    for (let key in source) {
        target[key] = source[key];
    }
    return target;
}
function shallowCreate(obj) {
    let ret = Object.create(obj);
    return shallowCopy(ret, obj);
}
function sendRequestP(url, args) {
    let data;
    args = args === undefined ? {} : shallowCreate(args);
    if ("string" !== typeof args.data) {
        if (args.data instanceof FormData) {
            let d = {};
            for (let key of [...args.data.keys()]) {
                let value = args.data.get(key);
                if (value instanceof File) {
                    return Promise.reject("File data not supported");
                }
                if (value !== null && value !== undefined) {
                    d[key] = value;
                }
            }
            args.data = d;
        }
        else if (args.data === undefined) {
            args.data = {};
        }
        let pairs = [];
        for (let key in args.data) {
            pairs.push(key + "=" + encodeURI(args.data[key].toString()));
        }
        args.data = pairs.join("&");
    }
    if (args.data !== undefined && args.method === "POST" && args.mimeType === undefined) {
        args.mimeType = "application/x-www-form-urlencoded";
    }
    let xhrDetails = {
        method: args.method,
        url: url,
        headers: args.header,
        data: args.data,
        overrideMimeType: args.mimeType,
        context: args.context,
    };
    return new Promise((fulfill, reject) => {
        xhrDetails.onreadystatechange = xhr => {
            if (xhr.readyState !== xhr.DONE) {
                return;
            }
            if (xhr.status === 200) {
                fulfill(xhr);
            }
            else {
                reject("Request to " + url + " rejected with " + xhr.status);
            }
        };
        xhrDetails.onerror = reject;
        xhrDetails.ontimeout = () => reject("Timeout request to " + url);
        GM_xmlhttpRequest(xhrDetails);
    });
}
class PastenbinConn {
    constructor(devkey, userkey) {
        this.devkey = devkey;
        this.userkey = userkey;
    }
    static visibleStr2Int(str) {
        switch (str) {
            case "private":
                return 2;
            case "unlisted":
                return 1;
            case "public":
                return 0;
            default:
                throw new Error("Visbility can only be one of public, private or unlisted");
        }
    }
    static create(devKey, anonymous, userkey) {
        if (anonymous === undefined || anonymous) {
            return Promise.resolve(new PastenbinConn(devKey));
        }
        if (userkey === undefined) {
            userkey = GM_getValue(PastenbinConn.userkeykey);
        }
        if (userkey !== undefined && userkey !== null) {
            return Promise.resolve(new PastenbinConn(devKey, userkey));
        }
        let user = prompt("Please enter username for pastebin.com");
        let password = prompt("Please eneter password for pastebin.com");
        if (user === undefined || user === null || user === "") {
            return Promise.reject("Invalid pastebin user");
        }
        if (password === undefined || password === null || password === "") {
            return Promise.reject("Invalid pastebin password");
        }
        let data = {
            api_dev_key: pastebinDevKey,
            api_user_name: user,
            api_user_password: password
        };
        let options = {
            method: "POST",
            data: data
        };
        let requestP = sendRequestP("https://pastebin.com/api/api_login.php", options);
        return requestP.then(xhr => {
            if (/Bad API request/.test(xhr.responseText)) {
                return Promise.reject(xhr.responseText);
            }
            GM_setValue(PastenbinConn.userkeykey, xhr.responseText);
            return new PastenbinConn(pastebinDevKey, xhr.responseText);
        });
    }
    createPaste(title, content, visibility, path) {
        if (path !== undefined) {
            throw new Error("'path' is not supported.");
        }
        if (visibility === "private" && this.userkey === undefined) {
            throw new Error("Cannot create private paste without user key");
        }
        if (visibility === undefined) {
            visibility = "private";
        }
        let data = {
            api_option: "paste",
            api_dev_key: this.devkey,
            api_paste_code: content,
            api_paste_private: PastenbinConn.visibleStr2Int(visibility),
            api_dev_name: title,
            api_paste_expire_date: "N",
            api_user_key: this.userkey
        };
        let options = {
            method: "POST",
            data: data
        };
        let requestP = sendRequestP("https://pastebin.com/api/api_post.php", options);
        return requestP.then(xhr => {
            if (/^\s*https?.*/.test(xhr.responseText)) {
                return xhr.responseText;
            }
            else {
                if (/.*invalid(?:.+)api_user_key.*/.test(xhr.responseText)) {
                    GM_deleteValue(PastenbinConn.userkeykey);
                }
                return Promise.reject(xhr.responseText);
            }
        });
    }
}
PastenbinConn.userkeykey = "__pastebinUserkey";
function getUniqueElement(selector) {
    let elements = document.querySelectorAll(selector);
    if (elements.length !== 1) {
        throw new Error(`Cannot get a unique element by selector '${selector}'`);
    }
    return elements[0];
}
function getTextByElement(arg1) {
    let el = typeof arg1 === "string" ? getUniqueElement(arg1) : arg1;
    if (el.childNodes.length !== 1) {
        throw new Error("Cannot determine unique child node.");
    }
    let chNode = el.childNodes[0];
    if (!(chNode instanceof Text)) {
        throw new Error("Unexpected child node, expecting Text node.");
    }
    return chNode.wholeText;
}
function setTimeoutP(time) {
    return new Promise(fulfill => setTimeout(fulfill, time));
}
