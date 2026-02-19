function FindProxyForURL(url, host) {
   
    // 2. High-bandwidth/Streaming sites go DIRECT to save proxy load
    if (shExpMatch(host, "*.flipkart.com") || 
        shExpMatch(host, "*.youtube.com") || 
        shExpMatch(host, "*.hotstar.com") || 
        shExpMatch(host, "*.ndtv.com")) {
        return "DIRECT";
    }

    // 3. Default to Proxy, but allow DIRECT if the proxy is unreachable
    return "PROXY 10.42.2.61:8090";
}
