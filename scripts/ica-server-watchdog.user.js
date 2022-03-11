// ==UserScript==
// @name	BC1 Cluster Watcdog
// @namespace	http://silverwzw.com/
// @version	0.1
// @description	Give notification when ICA is down
// @include	*
// @copyright	2013+, Silverwzw
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.js
// ==/UserScript==

jQuery.noConflict();
function closure() {
    var servers;
    servers = {
        "http://bc1b3.csc.ncsu.edu:8390/" : true,
        "http://bc1b4.csc.ncsu.edu:8390/" : true,
        "http://bc1b5.csc.ncsu.edu:8390/" : true,
        "http://bc1b6.csc.ncsu.edu:8390/" : true,
        "http://bc1b7.csc.ncsu.edu:8390/" : true,
        "http://bc1b8.csc.ncsu.edu:8390/" : false,
        "http://bc1b9.csc.ncsu.edu:8390/" : true,
        "http://bc1b12.csc.ncsu.edu:8390/" : true,
        "http://bc1b13.csc.ncsu.edu:8390/" : true,
        "http://bc1b14.csc.ncsu.edu:8390/" : true
    };
    
    function running() {
        GM_setValue("BC1-Cluster-Watchdog-Heartbeat", new Date());
        
        function ping(server) {
            function warning(loc) {
                if (servers[server]) {
					console.log("Error Captured By " + loc);
                    alert("Warning: " + server + " is down ");
                }
                servers[server] = false;
            }
            function recover() {
                servers[server] = true;
            }
            try {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: (server + "ESAdmin/login.do"),
                    headers: {
                        'User-agent': 'Mozilla/4.0 (compatible) Steven-Wang\'s-Server-Status-Monitor',
                    },
                    onload: function(responseDetails) {
                        if (responseDetails.status >= 400) {
                            warning("Status Code " + responseDetails.status);
                        } else if (responseDetails.status == 200){
                            recover();
                        }
                    },
                    onerror : function(errorDetails) {
                        warning("onerror Event");
                    }
                });
            } catch (e) {
               warning("Exception Clause." + JSON.stringify(e));
            }
            GM_setValue("BC1-Cluster-Watchdog-Heartbeat", new Date());
    
        }
        var server;
        for (server in servers) {
            if (servers.hasOwnProperty(server)) {
				ping(server.trim());
            }
        }
        GM_setValue("BC1-Cluster-Watchdog-Heartbeat", new Date());
        window.setTimeout(running, 60000); //check the server every minute
    }
    
    function deamon() {
        var heartBeat;
        heartBeat = GM_getValue("BC1-Cluster-Watchdog-Heartbeat");
        if (heartBeat === undefined || new Date(heartBeat) - new Date() < -900000) { // if no heart beat in the past 15 minutes, call the main function
            console.log("BC1-Cluster-Watchdog.running got Called");
            running();
        } else {
            window.setTimeout(deamon, 25000); // every 25 seconds the deamon awakes to check the heart beat.
        }
    }
    deamon();
}

jQuery(document).ready(closure);
