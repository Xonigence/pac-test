# StrongSwan Android VPN — PAC / HTTP Proxy Feasibility Report

**Document type:** Technical assessment & recommendation  
**Product:** StrongSwan Android VPN Client (fork, v2.6.2)  
**Prepared for:** Engineering / product leadership review  
**Date:** June 7, 2026  
**Status:** Analysis complete — no code changes made  

---

## 1. Purpose

This document assesses whether **Proxy Auto-Configuration (PAC)** can be integrated into the StrongSwan Android VPN client via `CharonVpnService` and Android’s `VpnService.Builder.setHttpProxy()` API.

The specific question evaluated:

> Can we safely add PAC support using `ProxyInfo.buildPacProxy()` before `builder.establish()` to route **myntra.com** over direct internet while sending **all other traffic** through the VPN?

---

## 2. Executive Summary

| Question | Answer |
|----------|--------|
| Does StrongSwan already support HTTP proxy on VPN? | **Yes** — direct HTTP proxy only (`ProxyInfo.buildDirectProxy`) |
| Can we call `setHttpProxy()` before TUN establishment? | **Yes** — already implemented in the correct location |
| Can we add PAC via `buildPacProxy()`? | **Technically callable, but not supported by Android for VPN** |
| Can PAC achieve “myntra.com direct, rest via VPN”? | **No** — PAC operates at the wrong network layer |
| Recommended action | **Do not implement PAC over VPN.** Use existing split-tunnel or per-app VPN features for selective routing. |

### Bottom line for leadership

Adding a PAC URL through the VPN builder is **not a viable solution** for domain-based VPN bypass on Android. The platform explicitly states that **PAC proxies are not supported over VPNs**. Even if the API call succeeds, it will not deliver reliable, system-wide routing behavior.

StrongSwan **already has** a supported path for HTTP proxy configuration (direct proxy with optional host exclusions). For bypassing the VPN itself, the client already supports **IP-based split tunneling** and **per-application VPN rules**.

---

## 3. Background

### 3.1 What is PAC?

A PAC (Proxy Auto-Configuration) file is a JavaScript script that tells applications **which HTTP proxy to use** (or `DIRECT`) for a given URL. It is commonly used on corporate networks.

### 3.2 What is Android VpnService?

Android’s `VpnService` API creates a virtual network interface (TUN). Applications send IP packets through this tunnel based on **routing rules**, not proxy scripts. The VPN app (StrongSwan/charon) encrypts and forwards that traffic.

### 3.3 Proposed change under review

```java
ProxyInfo proxy = ProxyInfo.buildPacProxy(
    Uri.parse("https://your-server/proxy.pac")
);
builder.setHttpProxy(proxy);
// then builder.establish()
```

---

## 4. Current StrongSwan Android Architecture

### 4.1 High-level connection flow

```
User initiates VPN
    → CharonVpnService starts charon (native IKE daemon)
    → IKE / IPsec negotiation with VPN gateway
    → On successful CHILD_SA (tunnel up):
        → Native code configures TUN via Java BuilderAdapter
        → Java applies routes, DNS, proxy, MTU, app rules
        → builder.establish() creates TUN interface
    → Traffic flows: App → TUN → charon → encrypted tunnel → gateway
```

### 4.2 Key components

| Component | Responsibility |
|-----------|----------------|
| `CharonVpnService` | Android VPN service, lifecycle, notifications |
| `BuilderAdapter` | Java wrapper exposed to native code via JNI |
| `BuilderCache` | Stores and reapplies TUN configuration (routes, DNS, proxy) |
| `android_service.c` | Triggers TUN creation when IPsec tunnel is ready |
| `VpnProfile` | Stores user/admin configuration including proxy settings |

### 4.3 Where proxy is configured today

Proxy settings are applied in **`BuilderCache.applyData()`**, immediately before **`mBuilder.establish()`**. This is the correct and only integration point. No native/JNI changes are required for proxy configuration.

**Current behavior:**
- Reads `proxyHost`, `proxyPort`, `proxyExclusions` from VPN profile
- Builds `ProxyInfo.buildDirectProxy(host, port, exclusions)`
- Calls `builder.setHttpProxy(proxy)` on Android 10+ (API 29+)
- UI, database, managed configuration, and JSON import already support these fields

---

## 5. Findings

### 5.1 Search results across codebase

| Term searched | Found in project? | Notes |
|---------------|-------------------|-------|
| `setHttpProxy` | Yes | Used in `CharonVpnService.java` |
| `ProxyInfo` | Yes | Direct proxy only |
| `buildPacProxy` | **No** | Not implemented anywhere |
| `VpnService.Builder` | Yes | Via inherited `VpnService.Builder` inner class |
| `establish()` | Yes | Java + JNI path |

### 5.2 SDK compatibility

| Setting | Value |
|---------|-------|
| Minimum SDK | 21 (Android 5.0) |
| Target SDK | 36 |
| `setHttpProxy` requirement | API 29 (Android 10) — already guarded in code |
| `buildPacProxy` API availability | API 21+ (not the limiting factor) |

**Implication:** On devices below Android 10, HTTP proxy configuration is silently skipped. This is existing behavior.

### 5.3 Android platform limitations (official documentation)

Per [Android VpnService.Builder.setHttpProxy()](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo)):

1. **PAC proxies are not supported over VPNs.**
2. The HTTP proxy is **only a recommendation** — applications may ignore it.
3. Apps using the proxy **cannot distinguish** between traffic routed through the VPN and traffic that bypasses the VPN.
4. **Split tunneling + HTTP proxy generally does not work** as expected for HTTP traffic.

These are platform constraints, not StrongSwan limitations.

---

## 6. Traffic Impact Analysis

Understanding what PAC / HTTP proxy actually affects:

| Traffic type | Affected by HTTP proxy? | Controlled by VPN routes? |
|--------------|------------------------|---------------------------|
| Browser (Chrome, WebView) | Often, for HTTP/HTTPS only | Yes — IP routing |
| Apps using system HTTP proxy | Yes, for HTTP/HTTPS | Yes — IP routing |
| Apps with custom networking | Usually no | Yes — IP routing |
| UDP, games, non-HTTP protocols | No | Yes — IP routing |
| DNS queries | No (separate DNS config) | Yes — via VPN DNS/routes |
| IKE control traffic to gateway | No (`protect()` bypass) | Bypasses TUN by design |

### Critical distinction

| Layer | Mechanism | What it controls |
|-------|-----------|------------------|
| **L3 — IP routing** | VPN routes, split tunnel subnets | Whether packets enter the VPN tunnel |
| **L7 — HTTP proxy** | `setHttpProxy`, PAC | Which HTTP proxy an app uses (if it honors system proxy) |

**PAC only affects L7 proxy selection.** It does **not** remove traffic from the VPN tunnel.

---

## 7. Use Case Evaluation: myntra.com Direct, Everything Else via VPN

### 7.1 What PAC would do (if it worked)

A PAC rule like `if (dnsDomainIs(host, "myntra.com")) return "DIRECT"` would tell **HTTP-aware apps** not to use an HTTP proxy for Myntra. It would **not** stop those packets from being routed through the VPN TUN interface.

### 7.2 What is actually required

To send Myntra traffic outside the VPN tunnel, you need **IP-level split tunneling**:

- Exclude Myntra IP address ranges from VPN routes, **or**
- Exclude the Myntra application package from the VPN, **or**
- Implement custom packet inspection and routing in userspace (high complexity)

### 7.3 Options comparison

| Approach | Sends Myntra outside VPN? | Sends other traffic through VPN? | Reliability | Already in StrongSwan? |
|----------|--------------------------|----------------------------------|-------------|------------------------|
| PAC via `buildPacProxy` | **No** (wrong layer) | Partial / unpredictable | **Low** | No |
| Direct proxy + exclusions | No (bypasses proxy only) | N/A | Medium (HTTP only) | **Yes** |
| `excludedSubnets` (IP ranges) | **Yes** (if IPs are correct) | **Yes** | Medium (IP changes) | **Yes** |
| Per-app VPN (exclude Myntra app) | **Yes** (for that app) | **Yes** | **High** (for native app) | **Yes** |
| Custom PAC engine in VPN service | Possible with major effort | Possible | Low–medium | No |

### 7.4 Recommendation for the myntra.com use case

| Scenario | Recommended approach |
|----------|---------------------|
| Native Myntra Android app should bypass VPN | **Per-app exclusion** (`addDisallowedApplication`) |
| Myntra in browser should bypass VPN | Exclude browser app (affects all browser traffic) or use **excluded IP subnets** |
| Corporate HTTP proxy with Myntra exceptions | Use **existing direct proxy + exclusion list** (`*.myntra.com`) |
| Dynamic domain-based VPN bypass | **Not feasible** via PAC on Android VPN — requires custom solution |

---

## 8. Feasibility Assessment

| Initiative | Feasibility | Risk | Recommendation |
|------------|-------------|------|----------------|
| Keep current direct HTTP proxy | **High** | Low | **Proceed** — already working |
| Add PAC via `buildPacProxy` | **Low** (platform unsupported) | High (false expectations) | **Do not proceed** |
| Domain bypass via split-tunnel subnets | **Medium** | Medium (IP drift) | **Proceed with IP research** |
| Domain bypass via per-app VPN | **High** (for native apps) | Low | **Proceed** if app package is known |
| Custom PAC + packet routing engine | **Low** (high effort) | Very high | **Defer** unless strategic priority |

---

## 9. Risks of Implementing PAC over VPN

1. **Non-functional feature** — API may accept the call but PAC will not work as on Wi‑Fi/corporate networks.
2. **Misleading product behavior** — stakeholders may believe domain routing is solved when it is not.
3. **Split-tunnel breakage** — documented Android issue when combining HTTP proxy with partial VPN routing.
4. **Inconsistent app behavior** — Chrome, WebView, OkHttp, and native apps handle system proxy differently.
5. **Maintenance burden** — new profile fields, UI, testing across OEMs for a feature Android does not support.
6. **Device fragmentation** — proxy only applies on Android 10+; older devices get no proxy at all.

---

## 10. Recommended Path Forward

### 10.1 Short term (no PAC)

1. **Do not implement `buildPacProxy`** in the VPN builder.
2. **Use existing capabilities** for selective routing:
   - VPN profile `excludedSubnets` / `includedSubnets`
   - Per-app allow/deny lists
   - Existing direct HTTP proxy with exclusion list (if HTTP proxy steering is the actual need)
3. **Clarify requirement** with stakeholders: is the goal HTTP proxy steering or true VPN bypass?

### 10.2 If HTTP proxy steering is required

Leverage the **existing direct proxy configuration** in VPN profiles:

- Proxy host and port
- Exclusion list with wildcards (e.g. `*.myntra.com`)
- Already documented in app UI with appropriate caveats

### 10.3 If VPN bypass for Myntra is required

| Step | Action | Owner |
|------|--------|-------|
| 1 | Confirm target: native app, browser, or both | Product |
| 2 | For native app: identify package name, configure per-app exclusion | Engineering |
| 3 | For browser/domain: research Myntra CDN IP ranges for `excludedSubnets` | Engineering / Ops |
| 4 | Test on Android 10–14+ across target devices | QA |
| 5 | Document IP refresh process (CDNs change) | Operations |

### 10.4 If PAC is a hard business requirement

A **custom implementation** outside `setHttpProxy` would be required:

- Download and evaluate PAC script (JavaScript engine)
- Intercept DNS and/or packets in the VPN service
- Route packets based on evaluated rules
- Use `VpnService.protect()` to prevent routing loops

**Estimated complexity:** Major architectural change — not a small patch to `CharonVpnService`.

---

## 11. Technical Reference (for engineering)

### 11.1 Relevant source files

| File | Purpose |
|------|---------|
| `app/src/main/java/org/strongswan/android/logic/CharonVpnService.java` | VPN service, builder, proxy application |
| `app/src/main/jni/libandroidbridge/backend/android_service.c` | TUN setup on tunnel up |
| `app/src/main/jni/libandroidbridge/vpnservice_builder.c` | JNI bridge to BuilderAdapter |
| `app/src/main/java/org/strongswan/android/data/VpnProfile.java` | Profile storage |
| `app/src/main/java/org/strongswan/android/ui/VpnProfileDetailActivity.java` | Proxy UI |

### 11.2 Proxy application code path

```
VpnProfile (proxyHost, proxyPort, proxyExclusions)
    → BuilderCache constructor: ProxyInfo.buildDirectProxy(...)
    → BuilderCache.applyData(): builder.setHttpProxy(mProxyServer)  [API 29+]
    → BuilderAdapter.establishIntern(): mBuilder.establish()
```

### 11.3 Call flow diagram

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ User / MDM   │────▶│ CharonVpnService │────▶│ charon (native)  │
│ VPN Profile  │     │ BuilderAdapter   │     │ IKE / IPsec      │
└──────────────┘     └────────┬─────────┘     └────────┬─────────┘
                              │                         │
                              │    CHILD_SA UP          │
                              │◀────────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ BuilderCache    │
                     │ applyData()     │
                     │  - routes       │
                     │  - DNS          │
                     │  - HTTP proxy   │
                     │  - app rules    │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ Android OS      │
                     │ TUN interface   │
                     └─────────────────┘
```

### 11.4 Network layer model

```
┌─────────────────────────────────────────────────────────┐
│  Applications (browser, Myntra app, other apps)         │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────────┐
│ HTTP Proxy (L7) │           │ IP Routing (L3)     │
│ setHttpProxy    │           │ VPN routes / split  │
│ Advisory only   │           │ tunnel / per-app    │
│ PAC = NOT SUPPORTED         │ Controls TUN traffic│
└─────────────────┘           └──────────┬──────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ StrongSwan TUN/ESP  │
                              └─────────────────────┘
```

---

## 12. Decision Log (for meeting use)

| # | Decision | Proposed outcome |
|---|----------|------------------|
| 1 | Implement PAC via `buildPacProxy` | **Reject** — Android does not support PAC over VPN |
| 2 | Continue using direct HTTP proxy feature | **Approve** — already implemented and supported |
| 3 | Pursue Myntra VPN bypass | **Approve** — via per-app exclusion or excluded subnets |
| 4 | Invest in custom PAC engine | **Defer** — pending business case and cost estimate |

---

## 13. Appendix: Sample Patch (Experimental Only — Not Recommended)

The following illustrates where PAC *could* be inserted. **This is documented for completeness only and is not recommended for production.**

**Location:** `CharonVpnService.java` → `BuilderCache` constructor

```java
// NOT RECOMMENDED — Android documents PAC as unsupported over VPN
if (profile.getProxyPacUrl() != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    mProxyServer = ProxyInfo.buildPacProxy(Uri.parse(profile.getProxyPacUrl()));
} else if (profile.getProxyHost() != null) {
    // existing buildDirectProxy path
}
```

**Additional work if pursued (against recommendation):**
- New `proxyPacUrl` field on `VpnProfile`
- Database schema migration
- UI / managed configuration updates
- QA across OEMs with no guarantee of functional behavior

---

## 14. References

- [Android VpnService.Builder.setHttpProxy()](https://developer.android.com/reference/android/net/VpnService.Builder#setHttpProxy(android.net.ProxyInfo))
- [Android ProxyInfo](https://developer.android.com/reference/android/net/ProxyInfo)
- StrongSwan Android source: `src/frontends/android/`
- StrongSwan build documentation: [docs.strongswan.org — Android VPN Client](https://docs.strongswan.org/docs/latest/os/androidVpnClientBuild.html)

---

## 15. Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Author / Engineer | | | |
| Engineering Lead | | | |
| Product Manager | | | |

---

*End of report*
