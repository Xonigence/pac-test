function FindProxyForURL(url, host) {

 
  if (dnsDomainIs(host, "flipkart.com") || shExpMatch(host, "*.flipkart.com") || shExpMatch(host, "*.google.com") ) {
  return "PROXY 10.42.2.61:8090";
  }

  return "DIRECT"
}
