# BillBanao

A beautiful, mobile-first invoice and quotation web app. Plain HTML, CSS and JavaScript; no dependencies, paid APIs, account or backend required.

## Sab se pehle — GitHub par upload

1. ZIP extract karein. `billbanao` folder **ke andar ki files** apne GitHub repository mein upload karein. `index.html` repository ke root par honi chahiye.
2. `assets/config.js` kholein. `publisherName` mein apna asli publisher/developer naam aur `supportEmail` mein apna monitored email address bharein. Business/customer information is file mein na dalein.
3. Repository → **Settings → Pages → Deploy from a branch → main → /(root) → Save**.
4. GitHub ka diya hua HTTPS URL kholein. GitHub Pages project subfolders supported hain; paths relative hain.
5. App mein **My business** khol kar business details save karein, phir apna pehla bill banayein.

Repository mein sirf source code aur public publisher contact rakhein. Customer records, real bills aur backup JSON ko GitHub par upload na karein. Yeh app unhein automatically repository mein nahi bhejti.

**Public release se pehle:** publisher naam/email configure karein, saare public pages khol kar check karein, aur distributed Android build ke actual behaviour ke mutabiq policy/Data Safety review karein. App approval ki guarantee nahi di ja sakti.

## Included features

- Responsive desktop workspace and mobile bottom navigation.
- English/Urdu interface with RTL, light and dark themes.
- Create, edit, duplicate, delete and search invoices and quotations.
- Client directory and saved client autofill.
- Business logo, contact details, document prefix and default notes.
- Manual payment status; quotation-to-invoice conversion.
- PKR, INR, USD, AED, GBP and EUR; exact minor-unit arithmetic.
- Item rounding, percentage discount, then tax on the discounted subtotal.
- Direct multipage PDF generation on the device, Urdu text included.
- Browser printing and feature-detected device file sharing.
- Local records, validated JSON backups, replace-with-confirmation restore, data deletion.
- PWA manifest and versioned offline cache with project-relative scope.
- Public Privacy Policy, Terms, Help, Contact, About and Data Deletion pages.
- No external fonts, third-party scripts, tracking, ads, analytics, login or payment processing.

## Public pages

| Page | URL relative to your website |
| --- | --- |
| App | `index.html` |
| Privacy policy | `privacy.html` |
| Terms of use | `terms.html` |
| Help | `help.html` |
| Contact | `contact.html` |
| Data deletion | `delete-data.html` |
| About | `about.html` |

If your app is hosted at `https://YOUR-USERNAME.github.io/YOUR-REPO/`, use `https://YOUR-USERNAME.github.io/YOUR-REPO/privacy.html` as the privacy policy URL. Replace these example names with the actual URL returned by GitHub.

## Local use and checks

Serve this directory over HTTP on localhost; do not double-click `index.html` using a `file://` URL because the app uses ES modules.

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. No `npm install` is needed. With a recent Node.js version, optional checks are:

```sh
node --test tests/*.test.mjs
node scripts/check.mjs
node scripts/build.mjs
```

`build` copies the deployable files to `dist/`. GitHub Pages branch publishing can serve the root files directly and does not need this command.

## Storage and practical limits

Data stays in this browser profile's local storage under a project-scoped key. There is no account or automatic sync. Export a backup regularly; uninstalling, clearing site data, device failure or browser eviction can erase records. Backups and PDFs are not encrypted. Do not treat local storage as a secure vault.

The app caps documents and clients at 1,500 each, items at 100 per document and imports at 12 MB. Browser storage may run out earlier, particularly with many logos; an unsuccessful save is reported without overwriting the previous saved data. Simultaneously editing a document in another tab requires closing and reopening the stale editor.

A restored backup **replaces** records; it does not merge devices. Previously issued documents keep a snapshot of their business/client details and logo. Profile changes affect new documents. Editing an existing document is an explicit change to that document.

PDFs embed locally rendered page images, which preserve Urdu shaping without remote fonts. PDF text is not selectable. Browser Print → Save as PDF may produce selectable text, depending on the browser. Use the OS/system Urdu fonts if your device lacks Urdu support.

## Offline and updates

Open the HTTPS app online once and wait for the service worker to finish installing. Offline operation is available after that installation. Browser storage controls can disable or remove the cache. A bare Android WebView may need additional host configuration; see `ANDROID-NOTES.md`.

When releasing a change, update `CONFIG.version` in `assets/config.js` and bump `CACHE` in `sw.js`. New workers wait until old app tabs close so unsaved forms are not interrupted. Close all app tabs and reopen to receive a cached version update.

## Android / Google Play

This ZIP contains the web application source. It does not contain an Android Studio project, APK or AAB. Read `ANDROID-NOTES.md` for the required WebView integrations before wrapping the app. Adding ads, analytics, login, server sync or other SDKs changes the data disclosures and needs a corresponding privacy-policy/Data Safety update.

## Verification performed for this delivery

- Eight Node tests cover monetary calculations, input limits, numbering collisions, unsafe backups, currency separation, storage failure/recovery and PDF structure.
- Asset, manifest, public-page links and service-worker precache paths checked.
- JavaScript syntax checked.
- The managed browser preview relay was unavailable in the authoring environment, so browser appearance, form interactions, actual PDF rendering and device behaviour still need a browser/device smoke test before public release.

## Official references

- [GitHub Pages branch publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Google Play functionality policy](https://support.google.com/googleplay/android-developer/answer/9898783)
- [Service worker registration](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register)

Publisher contact shown in this repository is public. Do not put passwords, tokens or private keys in client-side files.
