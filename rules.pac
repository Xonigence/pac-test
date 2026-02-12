function FindProxyForURL(url, host) {

    // Flipkart domains
    if (dnsDomainIs(host, "flipkart.com") ||
        shExpMatch(host, "*.flipkart.com")) {
        return "192.168.1.13:3128";
    }

    // Everything else goes directly
    return "DIRECT";
}
