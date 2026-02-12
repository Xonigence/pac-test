function FindProxyForURL(url, host) {

    // Flipkart domains
    if (dnsDomainIs(host, "flipkart.com") ||
        shExpMatch(host, "*.flipkart.com")) {
        return "192.168.1.13:8080";
    }

    // Everything else goes directly
    return "DIRECT";
}
