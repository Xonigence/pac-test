function FindProxyForURL(url, host) {

    // Flipkart domains
    if (dnsDomainIs(host, "flipkart.com") ||
        shExpMatch(host, "*.flipkart.com")) {
        return "192.168.1.13:3128; ";
    }

    // Amazon domains
    if (dnsDomainIs(host, "amazon.com") ||
        shExpMatch(host, "*.amazon.com") ||
        dnsDomainIs(host, "amazon.in") ||
        shExpMatch(host, "*.amazon.in")) {
        return "DIRECT";
    }

    // Everything else goes directly
    return "DIRECT";
}
