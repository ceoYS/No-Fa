# NoF Shield — Chrome Web Store Permission Justification

Status: submission-preparation artifact.

## Single purpose

NoF Shield has one browser-extension purpose:

> Redirect top-level Chrome navigations that match a user-confirmed risk signal
> to an extension-hosted pause page.

It is a Chrome desktop friction tool. It is not device-wide filtering, antivirus,
parental control, traffic inspection, or AI-based classification.

## Required permission

### declarativeNetRequest

NoF Shield uses Chrome's declarativeNetRequest API to apply local browser rules.

The extension does not use webRequest interception, content scripts, page scraping,
cookie access, browsing-history access, or remote code to inspect visited pages.

Rule matching and redirect decisions are performed locally by Chrome.

## Host permissions

Submission candidate:

- http://*/*
- https://*/*

### Why this scope is required

NoF Shield's core feature allows a user-confirmed risk signal to refer to an HTTP
or HTTPS destination that is not known when the extension is packaged.

A matching top-level navigation is redirected to the extension's own blocked.html
pause page.

Because those user-confirmed destinations may exist on arbitrary HTTP/HTTPS hosts,
restricting host permissions to a fixed set of domains would prevent the extension's
single core purpose from working for destinations outside that fixed set.

The broad host scope is therefore used only so declarativeNetRequest redirect rules
can operate on user-confirmed top-level navigations.

## What the permission is NOT used for

NoF Shield does NOT use host access to:

- read page contents;
- inject content scripts;
- collect browsing history;
- read cookies;
- read form inputs;
- inspect page text or images;
- record the blocked destination;
- transmit visited URLs or search terms to NoF servers;
- run analytics or advertising code.

Rules target top-level navigation (`main_frame`) only.

## Data handling

Matching happens locally in Chrome.

The extension does not send visited or blocked URLs to a server.

When the pause page offers a return to the NoF web app, it sends only a coarse
continuation destination such as `record` or `urge`. It does not pass the blocked URL.

Public privacy policy:

https://nof-mauve.vercel.app/privacy/

## Chrome Web Store reviewer text

### Host permission justification

NoF Shield's single purpose is to redirect top-level HTTP/HTTPS navigations that
match a user-confirmed risk signal to an extension-hosted pause page. These
user-confirmed destinations are not known at package time and may occur on any
HTTP or HTTPS host, so declarativeNetRequest redirect rules require host access
across HTTP/HTTPS origins. The extension does not inject scripts, read page
contents, cookies, forms, or browsing history, and it does not transmit visited
or blocked URLs to a server. Matching occurs locally in Chrome and is limited to
top-level navigation.

### Single-purpose statement

Redirect this Chrome browser's top-level navigations that match a user-confirmed
risk signal to an in-extension pause page.

## Release decision

Do not remove or narrow these host permissions without reworking and re-testing
the redirect architecture.

A future optional-host-permission design may reduce install-time scope, but that
would be a separate product/architecture change and is not part of the current
submission candidate.
