function FindProxyForURL(url, host) {
    // 1. DIRECT: The PAC file's own location (GitHub Pages)
    // This prevents the phone from trying to use the proxy to find the script itself.

    if (// Myntra Domains
        dnsDomainIs(host, ".myntra.com") || 
        localHostOrDomainIs(host, "myntra.com") ||
        shExpMatch(host, "*.myntassets.com") || // Myntra's Image/Static CDN
        
        // Hotstar Domains
        dnsDomainIs(host, ".hotstar.com") || 
        localHostOrDomainIs(host, "hotstar.com") ||
        shExpMatch(host, "*.akamaihd.net") || 
        
        // NDTV Domains
        dnsDomainIs(host, ".ndtv.com") || 
        localHostOrDomainIs(host, "ndtv.com")) {
        return "DIRECT";
    }


    // 4. PROXY: Everything else goes via the IPsec Tunnel
    return "PROXY 10.42.2.66:8090";
}
