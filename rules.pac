function FindProxyForURL(url, host) {
   // Adding the dot at the end prevents search domain appending
   return "PROXY mwg-internal.wgcs-mowgli-preprod.svc.cluster.local.:8090";
}
