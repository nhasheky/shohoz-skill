/**
 * Builds the HTML `<script>` snippets for the admin-managed marketing pixels.
 * Known providers are generated from their pixel/container id; `custom` (or any
 * provider with its own code pasted) uses the raw head/body code as-is.
 */

export type PixelSnippetInput = {
  provider: string;
  pixelId?: string | null;
  headCode?: string | null;
  bodyCode?: string | null;
  advancedMatching?: boolean;
};

export const PROVIDER_LABELS: Record<string, string> = {
  facebook: "Facebook / Meta Pixel",
  tiktok: "TikTok Pixel",
  gtm: "Google Tag Manager",
  ga4: "Google Analytics 4",
  google_ads: "Google Ads",
  snapchat: "Snapchat Pixel",
  linkedin: "LinkedIn Insight Tag",
  pinterest: "Pinterest Tag",
  twitter: "X (Twitter) Pixel",
  clarity: "Microsoft Clarity",
  custom: "Custom HTML",
};

export const PROVIDER_ID_HINT: Record<string, string> = {
  facebook: "e.g. 1234567890123456",
  tiktok: "e.g. C1234ABCDEF",
  gtm: "e.g. GTM-XXXXXXX",
  ga4: "e.g. G-XXXXXXXXXX",
  google_ads: "e.g. AW-XXXXXXXXX",
  snapchat: "e.g. 1234abcd-...",
  linkedin: "e.g. 1234567",
  pinterest: "e.g. 2612345678901",
  twitter: "e.g. o1abc",
  clarity: "e.g. abcdefghij",
  custom: "",
};

export function buildHeadSnippet(p: PixelSnippetInput): string {
  if (p.headCode && p.headCode.trim()) return p.headCode.trim();
  const id = (p.pixelId ?? "").trim();
  if (!id) return "";
  switch (p.provider) {
    case "facebook":
      return `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');${p.advancedMatching ? `fbq('set','autoConfig',true,'${id}');` : ""}fbq('track','PageView');</script><noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/></noscript>`;
    case "tiktok":
      return `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)}}(window,document,"ttq");ttq.load('${id}');ttq.page();</script>`;
    case "gtm":
      return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>`;
    case "ga4":
    case "google_ads":
      return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
    case "snapchat":
      return `<script>(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${id}');snaptr('track','PAGE_VIEW');</script>`;
    case "linkedin":
      return `<script>_linkedin_partner_id="${id}";window._linkedin_data_partner_ids=window._linkedin_data_partner_ids||[];window._linkedin_data_partner_ids.push(_linkedin_partner_id);</script><script>(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}var s=document.getElementsByTagName("script")[0];var b=document.createElement("script");b.type="text/javascript";b.async=true;b.src="https://snap.licdn.com/li.lms-analytics/insight.min.js";s.parentNode.insertBefore(b,s)})(window.lintrk);</script>`;
    case "pinterest":
      return `<script>!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${id}');pintrk('page');</script>`;
    case "twitter":
      return `<script>!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${id}');</script>`;
    case "clarity":
      return `<script type="text/javascript">(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","${id}");</script>`;
    default:
      return "";
  }
}

export function buildBodySnippet(p: PixelSnippetInput): string {
  if (p.bodyCode && p.bodyCode.trim()) return p.bodyCode.trim();
  const id = (p.pixelId ?? "").trim();
  if (!id) return "";
  switch (p.provider) {
    case "gtm":
      return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
    case "linkedin":
      return `<noscript><img height="1" width="1" style="display:none;" alt="" src="https://px.ads.linkedin.com/collect/?pid=${id}&fmt=gif"/></noscript>`;
    default:
      return "";
  }
}

export type ParsedPart =
  | { kind: "code"; value: string }
  | { kind: "src"; value: string }
  | { kind: "html"; value: string };

/**
 * Splits a raw HTML snippet into executable scripts and inert HTML (e.g. the
 * GTM/LinkedIn `<noscript>` fallbacks). Scripts are injected individually so
 * that concatenated snippets never end up as one invalid `<script>` body.
 */
export function parseSnippetHtml(html: string): ParsedPart[] {
  const parts: ParsedPart[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const before = html.slice(lastIndex, m.index).trim();
    if (before) parts.push({ kind: "html", value: before });
    const srcMatch = (m[1] ?? "").match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      parts.push({ kind: "src", value: srcMatch[1] });
    } else {
      const code = m[2].trim();
      if (code) parts.push({ kind: "code", value: code });
    }
    lastIndex = re.lastIndex;
  }
  const rest = html.slice(lastIndex).trim();
  if (rest) parts.push({ kind: "html", value: rest });
  return parts;
}
