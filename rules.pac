function FindProxyForURL(url, host) {

    // Flipkart domains
    if (dnsDomainIs(host, "flipkart.com") ||
        shExpMatch(host, "*.flipkart.com")) {
        return "PROXY YOUR_PROXY_IP:YOUR_PROXY_PORT";
    }

    // Amazon domains
    if (dnsDomainIs(host, "amazon.com") ||
        shExpMatch(host, "*.amazon.com") ||
        dnsDomainIs(host, "amazon.in") ||
        shExpMatch(host, "*.amazon.in")) {
        return "PROXY YOUR_PROXY_IP:YOUR_PROXY_PORT";
    }

    // Everything else goes directly
    return "DIRECT";
}
