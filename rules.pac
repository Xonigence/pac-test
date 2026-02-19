function FindProxyForURL(url, host) {
    
    // Check for specific shopping and streaming domains
    if (
        shExpMatch(host, "*.flipkart.com") || shExpMatch(host, "flipkart.com") ||
        shExpMatch(host, "*.youtube.com")  || shExpMatch(host, "youtube.com")  ||
        shExpMatch(host, "*.hotstar.com")  || shExpMatch(host, "hotstar.com")
    ) {
        return "PROXY 10.42.2.61:8090";
    }

    // Default: Connect directly to the internet
    return "DIRECT";
}
