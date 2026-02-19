 function FindProxyForURL(url, host) {
                        // If we got here, we are already inside the tunnel.
                        // Now decide if we need the Bangalore gateway.
                        if ((shExpMatch(host, ".flipkart.com")) || (shExpMatch(host, ".youtube.com")) || (shExpMatch(host, ".hotstar.com")) || (shExpMatch(host, ".ndtv.com"))){
                            return "DIRECT"; // Inside VPN, but no proxy needed
                        }
                        return "PROXY 10.42.2.61:8090";
                    }
