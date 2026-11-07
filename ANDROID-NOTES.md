# Android integration notes

This is the web app source, not an Android Studio project. Test these behaviours in the actual Android shell before submitting an AAB.

## Loading and navigation

- Prefer your controlled HTTPS origin, or AndroidX WebKit's `WebViewAssetLoader` for packaged assets. Do not rely on `file://` for ES modules and service workers.
- Enable JavaScript and DOM storage for this trusted app. Keep cleartext HTTP and mixed content disabled.
- Allow internal navigation only to your controlled app origin/path. Open unrelated HTTPS and `mailto:` links using the appropriate external Android activity. Do not load arbitrary websites into a WebView with privileged access.
- Ensure public legal links also work outside the app. The Play Console privacy policy URL must be a publicly accessible web page, not only a bundled asset.
- Handle Android back navigation, rotation, safe-area insets, keyboard resizing and process recreation. Do not destroy unsaved forms accidentally.

## PDF download, share and print

The browser version uses Blob URLs for local downloads, the Web Share API when file sharing is supported, and `window.print()` for printing. A plain WebView does not automatically implement these features.

- Implement the native host's PDF save/download flow using a user-chosen destination. A standard WebView `DownloadListener` alone may not handle generated `blob:` URLs.
- Use a narrowly scoped, origin-checked integration for handing generated PDF bytes to the Android host if needed. This starter does not expose an unrestricted JavaScript bridge.
- Share PDFs through a `FileProvider` content URI and the Android Sharesheet with temporary read permission. Avoid broad shared-storage access.
- Implement Android's print framework integration for WebView document printing if the Print action is exposed.
- Implement `WebChromeClient.onShowFileChooser` so users can pick a logo image or a JSON backup. Respect cancellation and selected-file MIME/size limits.
- Support downloading JSON backups and importing them. Backups include personal client details and are not encrypted.

Do not advertise any capability that fails in the shipped shell. If an action is unsupported, implement the integration or clearly disable that action in that build.

## Offline behaviour

The hosted PWA caches its own static application files after a successful HTTPS installation. Test service-worker operation in the WebView version you support. Packaged web assets need a deliberate local-origin/loading strategy. Do not assume a remote page will open on a first launch with no internet.

## Privacy and release

- Set real publisher identity and privacy/support contact in `assets/config.js` before distribution.
- The default web code processes records locally. Hosting requests may still produce server logs. Native SDKs, OS backup, crash reporting, analytics or ads can introduce additional handling.
- Base the Play Console Data Safety answers on the complete Android application and all SDKs actually shipped. Do not copy a blanket “no data collected” declaration from a web starter.
- Keep app listing, age audience, permissions, content rating, privacy policy and actual functionality consistent. Review current Play target-API, signing and testing requirements in Play Console at release time.
- Test clean install, offline reopen, create/edit/delete, client save, PDF save/share/print, backup restore, Urdu display, rotation, back button and low-storage errors.

Approval depends on the entire distributed application and current Google Play requirements; the presence of policy pages alone is not an approval guarantee.
