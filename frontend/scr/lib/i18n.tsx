// Language support: English, Hindi, Tamil.
// - <I18nProvider> wraps the app (see main.tsx) and remembers the choice in localStorage.
// - useI18n() gives components `t(key, params)`, the current `lang`, `setLang`, and `speechLang`
//   (the BCP-47 code the microphone button uses).
// - translate() is the same lookup for non-React code (e.g. error messages in lib/media.ts).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "ta";

export const LANGUAGES: { code: Lang; label: string; speech: string; locale: string }[] = [
  { code: "en", label: "English", speech: "en-IN", locale: "en-IN" },
  { code: "hi", label: "हिन्दी", speech: "hi-IN", locale: "hi-IN" },
  { code: "ta", label: "தமிழ்", speech: "ta-IN", locale: "ta-IN" },
];

const STORAGE_KEY = "cc_lang";

type Dict = Record<string, string>;

// ---------------------------------------------------------------------------------------
// ENGLISH (the source of truth — every key must exist here)
// Placeholders look like {name}. Keys ending _one / _other are picked using {count}.
// ---------------------------------------------------------------------------------------
const en = {
  // common
  "common.appName": "CivicConnect",
  "meta.title": "CivicConnect — Report civic issues, track their resolution",
  "common.language": "Language",
  "common.signIn": "Sign in",
  "common.back": "Back",
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.close": "Close",
  "common.loading": "Loading…",
  "common.noPhoto": "No photo",
  "common.municipalDesk": "municipal desk",

  // voice input
  "voice.start": "Speak",
  "voice.stop": "Stop",
  "voice.listening": "Listening…",
  "voice.unsupported": "Voice input isn't supported in this browser. Try Chrome, Edge or Safari.",
  "voice.denied": "Microphone access was blocked. Allow it in your browser settings and try again.",
  "voice.noSpeech": "Didn't catch anything — try again.",
  "voice.network": "Voice input needs an internet connection.",
  "voice.error": "Voice input failed. Please try again.",

  // categories
  "category.roads_potholes": "Roads & potholes",
  "category.garbage_sanitation": "Garbage & sanitation",
  "category.water_supply": "Water supply",
  "category.drainage_sewage": "Drainage & sewage",
  "category.streetlights": "Streetlights",
  "category.electricity": "Electricity",
  "category.public_safety": "Public safety",
  "category.other": "Other infrastructure",

  // statuses
  "status.reported": "Reported",
  "status.under_review": "Under Review",
  "status.assigned": "Assigned",
  "status.in_progress": "In Progress",
  "status.resolved": "Resolved",
  "status.rejected": "Rejected",

  // header / footer
  "nav.explore": "Explore",
  "nav.report": "Report an Issue",
  "nav.dashboard": "My Complaints",
  "nav.admin": "Admin",
  "nav.adminDashboard": "Admin Dashboard",
  "nav.signOut": "Sign out",
  "nav.signOutNamed": "Sign out ({name})",
  "nav.getStarted": "Get started",
  "nav.createAccount": "Create an account",
  "nav.setLocality": "Set your locality",
  "nav.signedOut": "Signed out. See you soon.",
  "nav.signOutFailed": "Could not sign out — check your connection and try again",
  "footer.about":
    "A community platform for reporting neighbourhood infrastructure problems and tracking their resolution — from potholes to streetlights.",
  "footer.platform": "Platform",
  "footer.exploreComplaints": "Explore complaints",
  "footer.reportIssue": "Report an issue",
  "footer.myComplaints": "My complaints",
  "footer.account": "Account",
  "footer.createAccount": "Create account",
  "footer.mapData": "Map data and imagery ©",
  "footer.contributors": "contributors. Location search by Nominatim.",

  // complaint card / upvote
  "card.supports_one": "{count} support",
  "card.supports_other": "{count} supports",
  "upvote.thanks": "Thanks for adding your support — the ward office weighs supported complaints first.",
  "upvote.signInToSupport": "Sign in to support complaints",
  "upvote.already": "You have already supported this complaint",
  "upvote.failed": "Could not register your support — please try again",
  "upvote.youSupported": "You supported this complaint",
  "upvote.supportThis": "Support this complaint",
  "upvote.supportsSr": "supports",

  // timeline
  "timeline.empty": "No status updates have been recorded yet.",

  // relative time + media errors
  "time.justNow": "just now",
  "time.minAgo": "{count} min ago",
  "time.hoursAgo_one": "{count} hour ago",
  "time.hoursAgo_other": "{count} hours ago",
  "time.daysAgo_one": "{count} day ago",
  "time.daysAgo_other": "{count} days ago",
  "media.onlyImages": "Only image files can be attached",
  "media.tooLarge": "Image is too large — pick one under 10 MB",
  "media.processFail": "Could not process the image in this browser",

  // empty state
  "empty.noPhotoAlt": "No photo",

  // locality picker
  "locality.title": "Choose your locality",
  "locality.description":
    "Complaints are grouped by locality. Search a place, detect your location, or pick from the lists.",
  "locality.searchLabel": "Search any Indian town or neighbourhood",
  "locality.searchPlaceholder": "e.g. Indiranagar, Bengaluru",
  "locality.searching": "Searching places…",
  "locality.noResults": "No matching places found",
  "locality.min3": "Type at least 3 characters to search",
  "locality.state": "State",
  "locality.district": "District",
  "locality.town": "Town / City",
  "locality.localityOptional": "Locality (optional)",
  "locality.selectState": "Select state",
  "locality.selectDistrict": "Select district",
  "locality.selectTown": "Select town",
  "locality.wholeTown": "Whole town",
  "locality.selectTownFirst": "Select town first",
  "locality.detecting": "Detecting…",
  "locality.useCurrent": "Use my current location",
  "locality.apply": "Use this locality",
  "locality.coords": "Map coordinates captured: {lat}, {lng}",
  "locality.noGeo": "Your browser does not support location detection",
  "locality.detected": "Detected your location — pick the matching locality if the name looks off",
  "locality.lookupFailed": "Could not look up your location — choose it from the lists below",
  "locality.permissionDenied": "Location permission denied — choose your locality from the lists",
  "locality.pickFirst": "Pick a state, district and town first",
  "locality.nowShowing": "Now showing reports for {place}",

  // map popup
  "map.supports_one": "{count} support",
  "map.supports_other": "{count} supports",

  // home
  "home.eyebrow": "Community-powered civic reporting",
  "home.heroLine1": "Your neighbourhood's problems,",
  "home.heroLine2": "on the record.",
  "home.heroBody":
    "Report potholes, broken streetlights, overflowing garbage and more — pin it on the map, back reports from your neighbours, and follow every issue until the ward office closes it.",
  "home.reportCta": "Report an issue",
  "home.exploreCta": "Explore the map",
  "home.statTotal": "Reports tracked",
  "home.statActive": "Work in progress",
  "home.statResolved": "Resolved so far",
  "home.currentlyShowing": "Currently showing:",
  "home.everyLocality": "every listed locality",
  "home.liveReports": "Live reports on the map",
  "home.pinsIn": "{count} pins in {place}",
  "home.loadingLive": "Loading live data…",
  "home.whatCanReport": "What can you report?",
  "home.eightCategories": "Eight categories, one accountable trail for each.",
  "home.howTitle": "From complaint to closure",
  "home.howSubtitle": "Every report follows one accountable trail — visible to you at every step.",
  "home.step1Title": "Report it in two minutes",
  "home.step1Body":
    "Pin the exact spot on the map, add photos, pick a category. Done — the complaint is on record with a timestamp.",
  "home.step2Title": "Neighbours add weight",
  "home.step2Body":
    "Each support from a neighbour signals to the ward office that a problem affects the whole street, not one household.",
  "home.step3Title": "Track until resolution",
  "home.step3Body":
    "Follow the official timeline — Under Review, Assigned, In Progress — with remarks from the desk handling your complaint.",
  "home.mostSupported": "Most-supported right now",
  "home.mostSupportedSub": "The complaints your neighbours are rallying behind.",
  "home.viewAll": "View all",
  "home.noReportsTitle": "No reports here yet",
  "home.noReportsBody": "Be the first to put an issue in {place} on the record.",
  "home.reportFirst": "Report the first issue",
  "home.sortedBy": "Sorted by community support in {place}",

  // login
  "login.brandTitle": "Welcome back to the record.",
  "login.brandBody":
    "Sign in to report new issues, support your neighbours' complaints and follow the official timeline on everything you have reported.",
  "login.bullet1": "Track every complaint you filed",
  "login.bullet2": "Support issues in your locality",
  "login.bullet3": "See admin remarks the moment they land",
  "login.subtitle": "Use your CivicConnect account.",
  "login.alreadyAs": "You are already signed in as {name} — proceeding will switch accounts.",
  "login.email": "Email",
  "login.emailPlaceholder": "you@example.com",
  "login.password": "Password",
  "login.passwordPlaceholder": "Your password",
  "login.signingIn": "Signing in…",
  "login.demoAccounts": "Demo accounts",
  "login.roleAdministrator": "Administrator",
  "login.roleCitizen": "Citizen",
  "login.fill": "Fill",
  "login.newHere": "New here?",
  "login.createAccount": "Create an account",
  "login.enterBoth": "Enter your email and password",
  "login.welcomeBack": "Welcome back, {name}",
  "login.invalid": "Invalid email or password",
  "login.failed": "Sign in failed — check your connection and try again",

  // register
  "register.brandTitle": "Two minutes to join. Every report after that counts.",
  "register.brandBody":
    "One account covers it all: pin issues on the map, add photos, support neighbours' complaints and watch the ward office respond — with every status change on your record.",
  "register.privacy":
    "Your email is used only for account access and never shown publicly on complaints. Reports display your display name, nothing else.",
  "register.title": "Create your account",
  "register.subtitle": "Free, and built for your locality.",
  "register.fullName": "Full name",
  "register.namePlaceholder": "e.g. Arjun Rao",
  "register.passwordPlaceholder": "8+ characters",
  "register.confirm": "Confirm password",
  "register.confirmPlaceholder": "Repeat it",
  "register.creating": "Creating account…",
  "register.submit": "Create account",
  "register.already": "Already registered?",
  "register.errName": "Enter your full name",
  "register.errEmail": "Enter a valid email address",
  "register.errPassword": "Use at least 8 characters",
  "register.errConfirm": "Passwords do not match",
  "register.errExists": "An account with this email already exists — sign in instead",
  "register.errCreate": "Could not create the account — check the details and try again",
  "register.errGeneric": "Something went wrong — please try again",
  "register.welcome": "Welcome to CivicConnect, {name}",

  // not found
  "notFound.title": "Page not found",
  "notFound.body":
    "The page you were looking for doesn't exist. The map and every complaint are still right where you left them.",
  "notFound.home": "Back to the homepage",

  // dashboard
  "dashboard.signInTitle": "Sign in to see your complaints",
  "dashboard.signInBody":
    "Your dashboard lists every issue you reported and how the ward office is progressing on each.",
  "dashboard.hello": "Hello, {name}",
  "dashboard.subtitle": "Every issue you have put on the record, with its live official status.",
  "dashboard.reportNew": "Report a new issue",
  "dashboard.statFiled": "Complaints filed",
  "dashboard.statResolved": "Resolved",
  "dashboard.statSupports": "Supports received",
  "dashboard.myComplaints": "My complaints",
  "dashboard.emptyTitle": "You haven't reported anything yet",
  "dashboard.emptyBody":
    "Spot a pothole on your street? It takes two minutes to put it on the record — pin it, photograph it, submit.",
  "dashboard.reportFirst": "Report your first issue",

  // explore
  "explore.title": "Explore complaints",
  "explore.showing": "Showing",
  "explore.issuesIn": "issues in",
  "explore.map": "Map",
  "explore.list": "List",
  "explore.category": "Category",
  "explore.status": "Status",
  "explore.sort": "Sort",
  "explore.allCategories": "All categories",
  "explore.allStatuses": "All statuses",
  "explore.newest": "Newest first",
  "explore.mostSupported": "Most supported",
  "explore.nearMe": "Near my location",
  "explore.nearbyOn": "Nearby filter on — clear",
  "explore.within5": "within 5 km of you",
  "explore.allLocalities": "all localities",
  "explore.noGeo": "Your browser does not support location detection",
  "explore.geoDenied": "Location permission denied — showing your selected locality instead",
  "explore.errTitle": "Could not load complaints",
  "explore.errBody": "The feed is temporarily unavailable. Your data is safe — try again in a moment.",
  "explore.noMatchTitle": "No complaints match these filters",
  "explore.noMatchBody":
    "Nothing reported in {place} for this combination yet. Widen the filters or set a different locality.",
  "explore.resetFilters": "Reset filters",
  "explore.fullDetails": "Full details",

  // complaint detail
  "detail.notFound": "Complaint not found",
  "detail.loadFail": "Could not load this complaint",
  "detail.errBody":
    "The complaint may have been removed, or the link is incorrect. Head back to the map to find what you were looking for.",
  "detail.backExplore": "Back to explore",
  "detail.allComplaints": "All complaints",
  "detail.reported": "Reported {time}",
  "detail.landmark": "Landmark: {address}",
  "detail.supportedThis_one": "neighbour supported this",
  "detail.supportedThis_other": "neighbours supported this",
  "detail.whatHappened": "What happened",
  "detail.beforePhotos": "Before: original complaint photos ({count})",
  "detail.photoAlt": "{title} — photo {n}",
  "detail.photoTitle": "Complaint photo {n}",
  "detail.afterTitle": "After: resolution evidence",
  "detail.resolvedAt": "Resolved {time}",
  "detail.afterAlt": "{title} — after resolution",
  "detail.afterPhotoTitle": "After resolution photo",
  "detail.savedLocation": "Saved location: {coords}",
  "detail.historyTitle": "Official status history",
  "detail.lastUpdated": "Last updated {time}",

  // report
  "report.stepDetails": "Details",
  "report.stepLocation": "Location",
  "report.stepPhotos": "Photos & submit",
  "report.signInTitle": "Sign in to report an issue",
  "report.signInBody":
    "Reporting needs an account so the ward office can follow up with the right person. Browsing the map stays open to everyone.",
  "report.createAccount": "Create account",
  "report.errTitle": "Give the issue a clear title of at least 10 characters",
  "report.errDescription": "Describe the problem in at least 20 characters so the desk can act on it",
  "report.errCategory": "Pick the category that fits best",
  "report.errLocality": "Choose your locality first — it routes the complaint",
  "report.errPosition": "Pin the exact spot on the map: click the map or use your GPS location",
  "report.maxPhotos": "Up to {count} photos per complaint",
  "report.photoReadFail": "Could not read that image",
  "report.submitted": "Complaint submitted — it is now on the public record",
  "report.submittedDesc": "The municipal desk reviews new reports within a few working days.",
  "report.sessionExpired": "Your session expired — sign in again to submit",
  "report.submitFail": "Could not submit the complaint — check your connection and try again",
  "report.noGeo": "Your browser does not support location detection",
  "report.gpsOk": "Location captured from GPS — drag the amber pin if it needs adjusting",
  "report.gpsDenied": "Location permission denied — click the map to place the pin manually",
  "report.backExplore": "Back to explore",
  "report.title": "Report an issue",
  "report.subtitle": "A precise report gets fixed faster. Two minutes is all it takes.",
  "report.fieldTitle": "Title",
  "report.titlePlaceholder": "e.g. Deep pothole on the 100 Feet Road signal crossing",
  "report.fieldDescription": "What exactly is wrong?",
  "report.descriptionPlaceholder": "Describe the problem, since when, and how it affects people passing through…",
  "report.fieldCategory": "Category",
  "report.nextLocation": "Next: pin the location",
  "report.routingTo": "Routing to",
  "report.noLocalityYet": "No locality chosen yet",
  "report.change": "Change",
  "report.chooseLocality": "Choose locality",
  "report.mapHelp": "Click the map to drop the pin, drag it to fine-tune, or use your current GPS position.",
  "report.pinned": "Pinned: {coords}",
  "report.useGps": "Use my current location",
  "report.searchPlace": "Search a place to jump the map there",
  "report.searchPlaceholder": "e.g. Koramangala 5th Block",
  "report.landmark": "Nearest landmark (optional)",
  "report.landmarkPlaceholder": "e.g. Opposite the bus depot gate",
  "report.nextPhotos": "Next: add photos",
  "report.photosLabel": "Photos (up to {count}, optional but powerful)",
  "report.attachment": "Attachment {n}",
  "report.removePhoto": "Remove photo {n}",
  "report.addPhoto": "Add photo",
  "report.photoNote": "Photos are compressed in your browser before upload; nothing over ~1 MB is stored.",
  "report.review": "Review",
  "report.untitled": "Untitled",
  "report.noCategory": "no category",
  "report.pinnedAt": "Pinned at {coords}",
  "report.noPin": "No location pinned",
  "report.routingLine": "Routing to {place} ·",
  "report.noLocality": "no locality",
  "report.photoCount_one": "{count} photo",
  "report.photoCount_other": "{count} photos",
  "report.submitting": "Submitting…",
  "report.submit": "Submit complaint",

  // admin
  "admin.statusUpdated": "Status updated to {status}",
  "admin.errRemark": "Add a remark (at least 3 characters) — it is shown on the public timeline",
  "admin.errPhoto": "Upload an after-resolution photo before resolving this complaint",
  "admin.defaultRemark": "Resolved with photographic evidence.",
  "admin.errAlready": "This complaint is already in that status",
  "admin.errUpdate": "Could not update the status — try again",
  "admin.errCompressed": "Compressed image must be smaller than 1.2 MB",
  "admin.manageTitle": "Manage complaint",
  "admin.by": "by {name}",
  "admin.evidenceAlt": "Evidence {n}",
  "admin.updateStatus": "Update status",
  "admin.newStatus": "New status",
  "admin.officialRemark": "Official remark (visible on the public timeline)",
  "admin.afterPhoto": "After-resolution photograph (required)",
  "admin.previewAlt": "Resolution evidence preview",
  "admin.resolutionRemarks": "Resolution remarks (optional)",
  "admin.remarkPlaceholder":
    "e.g. Work order issued to the zonal engineering section; repair crew scheduled for Thursday.",
  "admin.saving": "Saving…",
  "admin.save": "Save status update",
  "admin.timelineSoFar": "Timeline so far",
  "admin.deniedAdminTitle": "Administrator access required",
  "admin.deniedSignInTitle": "Sign in as an administrator",
  "admin.deniedAdminBody":
    "Your account does not have municipal admin rights. If you believe this is a mistake, contact the platform team.",
  "admin.deniedSignInBody": "The admin console is restricted to authorised municipal accounts.",
  "admin.kpiTotal": "Total complaints",
  "admin.kpiPending": "Pending review",
  "admin.kpiProgress": "In progress",
  "admin.kpiResolved": "Resolved",
  "admin.eyebrow": "Municipal desk",
  "admin.title": "Admin dashboard",
  "admin.signedInAs": "Signed in as {name} · administrator",
  "admin.chartCategory": "Complaints by category",
  "admin.chartDaily": "Reports — last 14 days",
  "admin.town": "Town",
  "admin.allTowns": "All towns",
  "admin.search": "Search",
  "admin.searchPlaceholder": "Title, description or locality",
  "admin.noMatchTitle": "No complaints match these filters",
  "admin.noMatchBody": "Adjust the town, category or status filters to see more of the queue.",
  "admin.colComplaint": "Complaint",
  "admin.colLocality": "Locality",
  "admin.colCategory": "Category",
  "admin.colStatus": "Status",
  "admin.colSupport": "Support",
  "admin.colReported": "Reported",
  "admin.colManage": "Manage",
  "admin.manage": "Manage",
  "admin.inView": "{count} complaints in view",
  "admin.statusAppear": "status changes appear on the public timeline instantly.",
  "admin.backPublic": "Back to public view",
} as const;

type FullKey = keyof typeof en;
// "card.supports" is accepted as shorthand for card.supports_one / card.supports_other
type PluralBase = FullKey extends infer K ? (K extends `${infer B}_one` ? B : never) : never;
export type TranslationKey = FullKey | PluralBase;

// ---------------------------------------------------------------------------------------
// HINDI
// ---------------------------------------------------------------------------------------
const hi: Partial<Record<FullKey, string>> = {
  "common.appName": "CivicConnect",
  "meta.title": "CivicConnect — नागरिक समस्याएँ दर्ज करें, समाधान पर नज़र रखें",
  "common.language": "भाषा",
  "common.signIn": "साइन इन",
  "common.back": "वापस",
  "common.cancel": "रद्द करें",
  "common.retry": "फिर कोशिश करें",
  "common.close": "बंद करें",
  "common.loading": "लोड हो रहा है…",
  "common.noPhoto": "फ़ोटो नहीं",
  "common.municipalDesk": "नगर निगम कार्यालय",

  "voice.start": "बोलें",
  "voice.stop": "रोकें",
  "voice.listening": "सुन रहे हैं…",
  "voice.unsupported": "इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। Chrome, Edge या Safari आज़माएँ।",
  "voice.denied": "माइक्रोफ़ोन की अनुमति रोकी गई है। ब्राउज़र सेटिंग में अनुमति दें और फिर कोशिश करें।",
  "voice.noSpeech": "कुछ सुनाई नहीं दिया — फिर कोशिश करें।",
  "voice.network": "वॉइस इनपुट के लिए इंटरनेट कनेक्शन चाहिए।",
  "voice.error": "वॉइस इनपुट विफल रहा। कृपया फिर कोशिश करें।",

  "category.roads_potholes": "सड़कें और गड्ढे",
  "category.garbage_sanitation": "कचरा और स्वच्छता",
  "category.water_supply": "जल आपूर्ति",
  "category.drainage_sewage": "नाली और सीवेज",
  "category.streetlights": "स्ट्रीट लाइट",
  "category.electricity": "बिजली",
  "category.public_safety": "सार्वजनिक सुरक्षा",
  "category.other": "अन्य बुनियादी ढाँचा",

  "status.reported": "दर्ज की गई",
  "status.under_review": "समीक्षा में",
  "status.assigned": "सौंपी गई",
  "status.in_progress": "कार्य जारी",
  "status.resolved": "हल हो गई",
  "status.rejected": "अस्वीकृत",

  "nav.explore": "खोजें",
  "nav.report": "समस्या दर्ज करें",
  "nav.dashboard": "मेरी शिकायतें",
  "nav.admin": "एडमिन",
  "nav.adminDashboard": "एडमिन डैशबोर्ड",
  "nav.signOut": "साइन आउट",
  "nav.signOutNamed": "साइन आउट ({name})",
  "nav.getStarted": "शुरू करें",
  "nav.createAccount": "खाता बनाएँ",
  "nav.setLocality": "अपना क्षेत्र चुनें",
  "nav.signedOut": "साइन आउट हो गए। फिर मिलेंगे।",
  "nav.signOutFailed": "साइन आउट नहीं हो सका — कनेक्शन जाँचें और फिर कोशिश करें",
  "footer.about":
    "मोहल्ले की बुनियादी ढाँचे की समस्याएँ दर्ज करने और उनके समाधान पर नज़र रखने का सामुदायिक मंच — गड्ढों से लेकर स्ट्रीट लाइट तक।",
  "footer.platform": "प्लेटफ़ॉर्म",
  "footer.exploreComplaints": "शिकायतें देखें",
  "footer.reportIssue": "समस्या दर्ज करें",
  "footer.myComplaints": "मेरी शिकायतें",
  "footer.account": "खाता",
  "footer.createAccount": "खाता बनाएँ",
  "footer.mapData": "मानचित्र डेटा और इमेजरी ©",
  "footer.contributors": "योगदानकर्ता। स्थान खोज Nominatim द्वारा।",

  "card.supports_one": "{count} समर्थन",
  "card.supports_other": "{count} समर्थन",
  "upvote.thanks": "समर्थन जोड़ने के लिए धन्यवाद — वार्ड कार्यालय अधिक समर्थन वाली शिकायतों को पहले देखता है।",
  "upvote.signInToSupport": "शिकायतों का समर्थन करने के लिए साइन इन करें",
  "upvote.already": "आप इस शिकायत का समर्थन पहले ही कर चुके हैं",
  "upvote.failed": "आपका समर्थन दर्ज नहीं हो सका — कृपया फिर कोशिश करें",
  "upvote.youSupported": "आपने इस शिकायत का समर्थन किया है",
  "upvote.supportThis": "इस शिकायत का समर्थन करें",
  "upvote.supportsSr": "समर्थन",

  "timeline.empty": "अभी तक कोई स्थिति अपडेट दर्ज नहीं हुआ है।",

  "time.justNow": "अभी",
  "time.minAgo": "{count} मिनट पहले",
  "time.hoursAgo_one": "{count} घंटा पहले",
  "time.hoursAgo_other": "{count} घंटे पहले",
  "time.daysAgo_one": "{count} दिन पहले",
  "time.daysAgo_other": "{count} दिन पहले",
  "media.onlyImages": "केवल इमेज फ़ाइलें जोड़ी जा सकती हैं",
  "media.tooLarge": "इमेज बहुत बड़ी है — 10 MB से छोटी चुनें",
  "media.processFail": "इस ब्राउज़र में इमेज प्रोसेस नहीं हो सकी",

  "empty.noPhotoAlt": "फ़ोटो नहीं",

  "locality.title": "अपना क्षेत्र चुनें",
  "locality.description":
    "शिकायतें क्षेत्र के अनुसार समूहित हैं। कोई जगह खोजें, अपना स्थान पता करें, या सूची से चुनें।",
  "locality.searchLabel": "भारत का कोई भी शहर या मोहल्ला खोजें",
  "locality.searchPlaceholder": "जैसे इंदिरानगर, बेंगलुरु",
  "locality.searching": "जगहें खोजी जा रही हैं…",
  "locality.noResults": "कोई मिलती-जुलती जगह नहीं मिली",
  "locality.min3": "खोजने के लिए कम से कम 3 अक्षर लिखें",
  "locality.state": "राज्य",
  "locality.district": "ज़िला",
  "locality.town": "कस्बा / शहर",
  "locality.localityOptional": "क्षेत्र (वैकल्पिक)",
  "locality.selectState": "राज्य चुनें",
  "locality.selectDistrict": "ज़िला चुनें",
  "locality.selectTown": "कस्बा चुनें",
  "locality.wholeTown": "पूरा कस्बा",
  "locality.selectTownFirst": "पहले कस्बा चुनें",
  "locality.detecting": "पता लगाया जा रहा है…",
  "locality.useCurrent": "मेरा वर्तमान स्थान इस्तेमाल करें",
  "locality.apply": "यह क्षेत्र चुनें",
  "locality.coords": "मानचित्र निर्देशांक मिले: {lat}, {lng}",
  "locality.noGeo": "आपका ब्राउज़र स्थान पहचान का समर्थन नहीं करता",
  "locality.detected": "आपका स्थान मिल गया — नाम गलत लगे तो सही क्षेत्र चुनें",
  "locality.lookupFailed": "आपका स्थान नहीं मिल सका — नीचे की सूचियों से चुनें",
  "locality.permissionDenied": "स्थान की अनुमति नहीं मिली — सूचियों से अपना क्षेत्र चुनें",
  "locality.pickFirst": "पहले राज्य, ज़िला और कस्बा चुनें",
  "locality.nowShowing": "अब {place} की शिकायतें दिखाई जा रही हैं",

  "map.supports_one": "{count} समर्थन",
  "map.supports_other": "{count} समर्थन",

  "home.eyebrow": "समुदाय की ताकत से नागरिक शिकायतें",
  "home.heroLine1": "आपके मोहल्ले की समस्याएँ,",
  "home.heroLine2": "अब रिकॉर्ड में।",
  "home.heroBody":
    "गड्ढे, खराब स्ट्रीट लाइट, भरा हुआ कचरा और बहुत कुछ दर्ज करें — नक्शे पर जगह चिह्नित करें, पड़ोसियों की शिकायतों का समर्थन करें, और हर समस्या पर तब तक नज़र रखें जब तक वार्ड कार्यालय उसे बंद न कर दे।",
  "home.reportCta": "समस्या दर्ज करें",
  "home.exploreCta": "नक्शा देखें",
  "home.statTotal": "दर्ज शिकायतें",
  "home.statActive": "कार्य जारी",
  "home.statResolved": "अब तक हल",
  "home.currentlyShowing": "अभी दिखा रहे हैं:",
  "home.everyLocality": "सभी सूचीबद्ध क्षेत्र",
  "home.liveReports": "नक्शे पर लाइव शिकायतें",
  "home.pinsIn": "{place} में {count} पिन",
  "home.loadingLive": "लाइव डेटा लोड हो रहा है…",
  "home.whatCanReport": "आप क्या दर्ज कर सकते हैं?",
  "home.eightCategories": "आठ श्रेणियाँ, हर एक के लिए जवाबदेह प्रक्रिया।",
  "home.howTitle": "शिकायत से समाधान तक",
  "home.howSubtitle": "हर शिकायत एक जवाबदेह प्रक्रिया से गुज़रती है — हर चरण आपको दिखता है।",
  "home.step1Title": "दो मिनट में दर्ज करें",
  "home.step1Body":
    "नक्शे पर सही जगह चिह्नित करें, फ़ोटो जोड़ें, श्रेणी चुनें। बस — शिकायत समय के साथ रिकॉर्ड हो गई।",
  "home.step2Title": "पड़ोसी वज़न बढ़ाते हैं",
  "home.step2Body":
    "पड़ोसी का हर समर्थन वार्ड कार्यालय को बताता है कि समस्या पूरी गली की है, सिर्फ़ एक घर की नहीं।",
  "home.step3Title": "समाधान तक नज़र रखें",
  "home.step3Body":
    "आधिकारिक टाइमलाइन देखें — समीक्षा में, सौंपी गई, कार्य जारी — साथ में आपकी शिकायत देख रहे कार्यालय की टिप्पणियाँ।",
  "home.mostSupported": "अभी सबसे ज़्यादा समर्थन वाली",
  "home.mostSupportedSub": "वे शिकायतें जिनके पीछे आपके पड़ोसी खड़े हैं।",
  "home.viewAll": "सभी देखें",
  "home.noReportsTitle": "यहाँ अभी कोई शिकायत नहीं",
  "home.noReportsBody": "{place} की पहली समस्या रिकॉर्ड में दर्ज करने वाले बनें।",
  "home.reportFirst": "पहली समस्या दर्ज करें",
  "home.sortedBy": "{place} में सामुदायिक समर्थन के अनुसार क्रमबद्ध",

  "login.brandTitle": "रिकॉर्ड में आपका स्वागत है।",
  "login.brandBody":
    "नई समस्याएँ दर्ज करने, पड़ोसियों की शिकायतों का समर्थन करने और अपनी हर शिकायत की आधिकारिक टाइमलाइन देखने के लिए साइन इन करें।",
  "login.bullet1": "अपनी दर्ज की हर शिकायत पर नज़र रखें",
  "login.bullet2": "अपने क्षेत्र की समस्याओं का समर्थन करें",
  "login.bullet3": "एडमिन की टिप्पणियाँ आते ही देखें",
  "login.subtitle": "अपने CivicConnect खाते का उपयोग करें।",
  "login.alreadyAs": "आप पहले से {name} के रूप में साइन इन हैं — आगे बढ़ने पर खाता बदल जाएगा।",
  "login.email": "ईमेल",
  "login.emailPlaceholder": "aap@example.com",
  "login.password": "पासवर्ड",
  "login.passwordPlaceholder": "आपका पासवर्ड",
  "login.signingIn": "साइन इन हो रहा है…",
  "login.demoAccounts": "डेमो खाते",
  "login.roleAdministrator": "प्रशासक",
  "login.roleCitizen": "नागरिक",
  "login.fill": "भरें",
  "login.newHere": "नए हैं?",
  "login.createAccount": "खाता बनाएँ",
  "login.enterBoth": "अपना ईमेल और पासवर्ड दर्ज करें",
  "login.welcomeBack": "वापसी पर स्वागत है, {name}",
  "login.invalid": "ईमेल या पासवर्ड गलत है",
  "login.failed": "साइन इन विफल रहा — कनेक्शन जाँचें और फिर कोशिश करें",

  "register.brandTitle": "जुड़ने में दो मिनट। उसके बाद हर शिकायत मायने रखती है।",
  "register.brandBody":
    "एक खाता सब कुछ करता है: नक्शे पर समस्याएँ चिह्नित करें, फ़ोटो जोड़ें, पड़ोसियों की शिकायतों का समर्थन करें और वार्ड कार्यालय की प्रतिक्रिया देखें — हर स्थिति बदलाव आपके रिकॉर्ड में।",
  "register.privacy":
    "आपका ईमेल केवल खाते तक पहुँच के लिए है और शिकायतों पर सार्वजनिक रूप से कभी नहीं दिखता। रिपोर्ट में केवल आपका प्रदर्शित नाम दिखता है।",
  "register.title": "अपना खाता बनाएँ",
  "register.subtitle": "मुफ़्त, और आपके क्षेत्र के लिए बना।",
  "register.fullName": "पूरा नाम",
  "register.namePlaceholder": "जैसे अर्जुन राव",
  "register.passwordPlaceholder": "8+ अक्षर",
  "register.confirm": "पासवर्ड की पुष्टि करें",
  "register.confirmPlaceholder": "दोबारा लिखें",
  "register.creating": "खाता बन रहा है…",
  "register.submit": "खाता बनाएँ",
  "register.already": "पहले से पंजीकृत हैं?",
  "register.errName": "अपना पूरा नाम दर्ज करें",
  "register.errEmail": "सही ईमेल पता दर्ज करें",
  "register.errPassword": "कम से कम 8 अक्षर रखें",
  "register.errConfirm": "पासवर्ड मेल नहीं खाते",
  "register.errExists": "इस ईमेल से खाता पहले से मौजूद है — साइन इन करें",
  "register.errCreate": "खाता नहीं बन सका — विवरण जाँचें और फिर कोशिश करें",
  "register.errGeneric": "कुछ गड़बड़ हो गई — कृपया फिर कोशिश करें",
  "register.welcome": "CivicConnect में स्वागत है, {name}",

  "notFound.title": "पेज नहीं मिला",
  "notFound.body": "आप जो पेज ढूँढ रहे थे वह मौजूद नहीं है। नक्शा और हर शिकायत वहीं हैं जहाँ आपने छोड़ी थीं।",
  "notFound.home": "होमपेज पर वापस जाएँ",

  "dashboard.signInTitle": "अपनी शिकायतें देखने के लिए साइन इन करें",
  "dashboard.signInBody":
    "आपके डैशबोर्ड में आपकी दर्ज की हर समस्या और उस पर वार्ड कार्यालय की प्रगति दिखती है।",
  "dashboard.hello": "नमस्ते, {name}",
  "dashboard.subtitle": "आपकी दर्ज की हर समस्या, उसकी लाइव आधिकारिक स्थिति के साथ।",
  "dashboard.reportNew": "नई समस्या दर्ज करें",
  "dashboard.statFiled": "दर्ज शिकायतें",
  "dashboard.statResolved": "हल हुईं",
  "dashboard.statSupports": "मिले समर्थन",
  "dashboard.myComplaints": "मेरी शिकायतें",
  "dashboard.emptyTitle": "आपने अभी तक कुछ दर्ज नहीं किया",
  "dashboard.emptyBody":
    "अपनी गली में गड्ढा दिखा? रिकॉर्ड में लाने में दो मिनट लगते हैं — जगह चिह्नित करें, फ़ोटो लें, भेजें।",
  "dashboard.reportFirst": "अपनी पहली समस्या दर्ज करें",

  "explore.title": "शिकायतें खोजें",
  "explore.showing": "कुल",
  "explore.issuesIn": "शिकायतें दिख रही हैं, क्षेत्र:",
  "explore.map": "नक्शा",
  "explore.list": "सूची",
  "explore.category": "श्रेणी",
  "explore.status": "स्थिति",
  "explore.sort": "क्रम",
  "explore.allCategories": "सभी श्रेणियाँ",
  "explore.allStatuses": "सभी स्थितियाँ",
  "explore.newest": "सबसे नई पहले",
  "explore.mostSupported": "सबसे ज़्यादा समर्थन",
  "explore.nearMe": "मेरे पास",
  "explore.nearbyOn": "नज़दीकी फ़िल्टर चालू — हटाएँ",
  "explore.within5": "आपसे 5 किमी के भीतर",
  "explore.allLocalities": "सभी क्षेत्र",
  "explore.noGeo": "आपका ब्राउज़र स्थान पहचान का समर्थन नहीं करता",
  "explore.geoDenied": "स्थान की अनुमति नहीं मिली — आपका चुना हुआ क्षेत्र दिखा रहे हैं",
  "explore.errTitle": "शिकायतें लोड नहीं हो सकीं",
  "explore.errBody": "फ़ीड अभी उपलब्ध नहीं है। आपका डेटा सुरक्षित है — थोड़ी देर में फिर कोशिश करें।",
  "explore.noMatchTitle": "इन फ़िल्टर से कोई शिकायत नहीं मिली",
  "explore.noMatchBody":
    "इस संयोजन में {place} में अभी कुछ दर्ज नहीं है। फ़िल्टर बढ़ाएँ या दूसरा क्षेत्र चुनें।",
  "explore.resetFilters": "फ़िल्टर रीसेट करें",
  "explore.fullDetails": "पूरा विवरण",

  "detail.notFound": "शिकायत नहीं मिली",
  "detail.loadFail": "यह शिकायत लोड नहीं हो सकी",
  "detail.errBody":
    "हो सकता है शिकायत हटा दी गई हो, या लिंक गलत हो। जो ढूँढ रहे थे उसके लिए नक्शे पर वापस जाएँ।",
  "detail.backExplore": "खोज पर वापस",
  "detail.allComplaints": "सभी शिकायतें",
  "detail.reported": "दर्ज किया गया {time}",
  "detail.landmark": "पहचान स्थल: {address}",
  "detail.supportedThis_one": "पड़ोसी ने इसका समर्थन किया",
  "detail.supportedThis_other": "पड़ोसियों ने इसका समर्थन किया",
  "detail.whatHappened": "क्या हुआ",
  "detail.beforePhotos": "पहले: शिकायत की मूल फ़ोटो ({count})",
  "detail.photoAlt": "{title} — फ़ोटो {n}",
  "detail.photoTitle": "शिकायत की फ़ोटो {n}",
  "detail.afterTitle": "बाद में: समाधान का प्रमाण",
  "detail.resolvedAt": "हल हुई {time}",
  "detail.afterAlt": "{title} — समाधान के बाद",
  "detail.afterPhotoTitle": "समाधान के बाद की फ़ोटो",
  "detail.savedLocation": "सहेजा गया स्थान: {coords}",
  "detail.historyTitle": "आधिकारिक स्थिति इतिहास",
  "detail.lastUpdated": "अंतिम अपडेट {time}",

  "report.stepDetails": "विवरण",
  "report.stepLocation": "स्थान",
  "report.stepPhotos": "फ़ोटो और जमा करें",
  "report.signInTitle": "समस्या दर्ज करने के लिए साइन इन करें",
  "report.signInBody":
    "शिकायत दर्ज करने के लिए खाता चाहिए ताकि वार्ड कार्यालय सही व्यक्ति से संपर्क कर सके। नक्शा देखना सबके लिए खुला है।",
  "report.createAccount": "खाता बनाएँ",
  "report.errTitle": "समस्या का साफ़ शीर्षक कम से कम 10 अक्षरों का दें",
  "report.errDescription": "समस्या को कम से कम 20 अक्षरों में बताएँ ताकि कार्यालय कार्रवाई कर सके",
  "report.errCategory": "सबसे उपयुक्त श्रेणी चुनें",
  "report.errLocality": "पहले अपना क्षेत्र चुनें — इसी से शिकायत आगे जाती है",
  "report.errPosition": "नक्शे पर सही जगह चिह्नित करें: नक्शे पर क्लिक करें या GPS स्थान इस्तेमाल करें",
  "report.maxPhotos": "हर शिकायत में अधिकतम {count} फ़ोटो",
  "report.photoReadFail": "वह इमेज पढ़ी नहीं जा सकी",
  "report.submitted": "शिकायत जमा हो गई — अब यह सार्वजनिक रिकॉर्ड में है",
  "report.submittedDesc": "नगर निगम कार्यालय नई शिकायतों की कुछ कार्यदिवसों में समीक्षा करता है।",
  "report.sessionExpired": "आपका सत्र समाप्त हो गया — जमा करने के लिए फिर साइन इन करें",
  "report.submitFail": "शिकायत जमा नहीं हो सकी — कनेक्शन जाँचें और फिर कोशिश करें",
  "report.noGeo": "आपका ब्राउज़र स्थान पहचान का समर्थन नहीं करता",
  "report.gpsOk": "GPS से स्थान मिल गया — ज़रूरत हो तो नारंगी पिन खींचकर ठीक करें",
  "report.gpsDenied": "स्थान की अनुमति नहीं मिली — पिन हाथ से लगाने के लिए नक्शे पर क्लिक करें",
  "report.backExplore": "खोज पर वापस",
  "report.title": "समस्या दर्ज करें",
  "report.subtitle": "सटीक शिकायत जल्दी सुलझती है। बस दो मिनट लगते हैं।",
  "report.fieldTitle": "शीर्षक",
  "report.titlePlaceholder": "जैसे 100 फ़ीट रोड सिग्नल चौराहे पर गहरा गड्ढा",
  "report.fieldDescription": "ठीक-ठीक क्या खराबी है?",
  "report.descriptionPlaceholder": "समस्या बताएँ, कब से है, और आने-जाने वालों पर क्या असर पड़ता है…",
  "report.fieldCategory": "श्रेणी",
  "report.nextLocation": "आगे: स्थान चिह्नित करें",
  "report.routingTo": "भेजी जाएगी:",
  "report.noLocalityYet": "अभी कोई क्षेत्र नहीं चुना",
  "report.change": "बदलें",
  "report.chooseLocality": "क्षेत्र चुनें",
  "report.mapHelp": "पिन लगाने के लिए नक्शे पर क्लिक करें, ठीक करने के लिए खींचें, या अपनी GPS स्थिति इस्तेमाल करें।",
  "report.pinned": "चिह्नित: {coords}",
  "report.useGps": "मेरा वर्तमान स्थान इस्तेमाल करें",
  "report.searchPlace": "नक्शे को वहाँ ले जाने के लिए जगह खोजें",
  "report.searchPlaceholder": "जैसे कोरमंगला 5वाँ ब्लॉक",
  "report.landmark": "नज़दीकी पहचान स्थल (वैकल्पिक)",
  "report.landmarkPlaceholder": "जैसे बस डिपो के गेट के सामने",
  "report.nextPhotos": "आगे: फ़ोटो जोड़ें",
  "report.photosLabel": "फ़ोटो (अधिकतम {count}, वैकल्पिक पर बहुत मददगार)",
  "report.attachment": "संलग्न फ़ोटो {n}",
  "report.removePhoto": "फ़ोटो {n} हटाएँ",
  "report.addPhoto": "फ़ोटो जोड़ें",
  "report.photoNote": "अपलोड से पहले फ़ोटो आपके ब्राउज़र में छोटी की जाती हैं; लगभग 1 MB से बड़ी कुछ भी सहेजी नहीं जाती।",
  "report.review": "समीक्षा",
  "report.untitled": "बिना शीर्षक",
  "report.noCategory": "कोई श्रेणी नहीं",
  "report.pinnedAt": "यहाँ चिह्नित: {coords}",
  "report.noPin": "कोई स्थान चिह्नित नहीं",
  "report.routingLine": "भेजी जाएगी: {place} ·",
  "report.noLocality": "कोई क्षेत्र नहीं",
  "report.photoCount_one": "{count} फ़ोटो",
  "report.photoCount_other": "{count} फ़ोटो",
  "report.submitting": "जमा हो रहा है…",
  "report.submit": "शिकायत जमा करें",

  "admin.statusUpdated": "स्थिति बदलकर {status} कर दी गई",
  "admin.errRemark": "टिप्पणी जोड़ें (कम से कम 3 अक्षर) — यह सार्वजनिक टाइमलाइन पर दिखती है",
  "admin.errPhoto": "इस शिकायत को हल करने से पहले समाधान के बाद की फ़ोटो अपलोड करें",
  "admin.defaultRemark": "फ़ोटो प्रमाण के साथ हल किया गया।",
  "admin.errAlready": "यह शिकायत पहले से इसी स्थिति में है",
  "admin.errUpdate": "स्थिति अपडेट नहीं हो सकी — फिर कोशिश करें",
  "admin.errCompressed": "छोटी की गई इमेज 1.2 MB से कम होनी चाहिए",
  "admin.manageTitle": "शिकायत प्रबंधित करें",
  "admin.by": "द्वारा {name}",
  "admin.evidenceAlt": "प्रमाण {n}",
  "admin.updateStatus": "स्थिति अपडेट करें",
  "admin.newStatus": "नई स्थिति",
  "admin.officialRemark": "आधिकारिक टिप्पणी (सार्वजनिक टाइमलाइन पर दिखेगी)",
  "admin.afterPhoto": "समाधान के बाद की फ़ोटो (अनिवार्य)",
  "admin.previewAlt": "समाधान प्रमाण का पूर्वावलोकन",
  "admin.resolutionRemarks": "समाधान की टिप्पणियाँ (वैकल्पिक)",
  "admin.remarkPlaceholder":
    "जैसे ज़ोनल इंजीनियरिंग विभाग को कार्य आदेश जारी; मरम्मत दल गुरुवार के लिए निर्धारित।",
  "admin.saving": "सहेज रहे हैं…",
  "admin.save": "स्थिति अपडेट सहेजें",
  "admin.timelineSoFar": "अब तक की टाइमलाइन",
  "admin.deniedAdminTitle": "प्रशासक पहुँच आवश्यक है",
  "admin.deniedSignInTitle": "प्रशासक के रूप में साइन इन करें",
  "admin.deniedAdminBody":
    "आपके खाते के पास नगर प्रशासन के अधिकार नहीं हैं। अगर आपको लगता है यह गलती है, तो प्लेटफ़ॉर्म टीम से संपर्क करें।",
  "admin.deniedSignInBody": "एडमिन कंसोल केवल अधिकृत नगर खातों के लिए है।",
  "admin.kpiTotal": "कुल शिकायतें",
  "admin.kpiPending": "समीक्षा लंबित",
  "admin.kpiProgress": "कार्य जारी",
  "admin.kpiResolved": "हल हुईं",
  "admin.eyebrow": "नगर निगम कार्यालय",
  "admin.title": "एडमिन डैशबोर्ड",
  "admin.signedInAs": "{name} के रूप में साइन इन · प्रशासक",
  "admin.chartCategory": "श्रेणी के अनुसार शिकायतें",
  "admin.chartDaily": "शिकायतें — पिछले 14 दिन",
  "admin.town": "कस्बा",
  "admin.allTowns": "सभी कस्बे",
  "admin.search": "खोजें",
  "admin.searchPlaceholder": "शीर्षक, विवरण या क्षेत्र",
  "admin.noMatchTitle": "इन फ़िल्टर से कोई शिकायत नहीं मिली",
  "admin.noMatchBody": "कतार में और देखने के लिए कस्बा, श्रेणी या स्थिति के फ़िल्टर बदलें।",
  "admin.colComplaint": "शिकायत",
  "admin.colLocality": "क्षेत्र",
  "admin.colCategory": "श्रेणी",
  "admin.colStatus": "स्थिति",
  "admin.colSupport": "समर्थन",
  "admin.colReported": "दर्ज",
  "admin.colManage": "प्रबंधन",
  "admin.manage": "प्रबंधित करें",
  "admin.inView": "{count} शिकायतें दिख रही हैं",
  "admin.statusAppear": "स्थिति बदलाव सार्वजनिक टाइमलाइन पर तुरंत दिखते हैं।",
  "admin.backPublic": "सार्वजनिक दृश्य पर वापस",
};

// ---------------------------------------------------------------------------------------
// TAMIL
// ---------------------------------------------------------------------------------------
const ta: Partial<Record<FullKey, string>> = {
  "common.appName": "CivicConnect",
  "meta.title": "CivicConnect — குடிமைச் சிக்கல்களைப் புகாரளியுங்கள், தீர்வைக் கண்காணியுங்கள்",
  "common.language": "மொழி",
  "common.signIn": "உள்நுழை",
  "common.back": "பின்செல்",
  "common.cancel": "ரத்து செய்",
  "common.retry": "மீண்டும் முயற்சி",
  "common.close": "மூடு",
  "common.loading": "ஏற்றப்படுகிறது…",
  "common.noPhoto": "புகைப்படம் இல்லை",
  "common.municipalDesk": "நகராட்சி அலுவலகம்",

  "voice.start": "பேசுங்கள்",
  "voice.stop": "நிறுத்து",
  "voice.listening": "கேட்கிறது…",
  "voice.unsupported": "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. Chrome, Edge அல்லது Safari முயற்சிக்கவும்.",
  "voice.denied": "மைக்ரோஃபோன் அணுகல் தடுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் அனுமதித்து மீண்டும் முயற்சிக்கவும்.",
  "voice.noSpeech": "எதுவும் கேட்கவில்லை — மீண்டும் முயற்சிக்கவும்.",
  "voice.network": "குரல் உள்ளீட்டிற்கு இணைய இணைப்பு தேவை.",
  "voice.error": "குரல் உள்ளீடு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.",

  "category.roads_potholes": "சாலைகள் & குழிகள்",
  "category.garbage_sanitation": "குப்பை & சுகாதாரம்",
  "category.water_supply": "குடிநீர் வழங்கல்",
  "category.drainage_sewage": "வடிகால் & கழிவுநீர்",
  "category.streetlights": "தெருவிளக்குகள்",
  "category.electricity": "மின்சாரம்",
  "category.public_safety": "பொதுப் பாதுகாப்பு",
  "category.other": "பிற உள்கட்டமைப்பு",

  "status.reported": "புகார் செய்யப்பட்டது",
  "status.under_review": "பரிசீலனையில்",
  "status.assigned": "ஒதுக்கப்பட்டது",
  "status.in_progress": "பணி நடைபெறுகிறது",
  "status.resolved": "தீர்க்கப்பட்டது",
  "status.rejected": "நிராகரிக்கப்பட்டது",

  "nav.explore": "ஆராய்க",
  "nav.report": "சிக்கலைப் புகாரளி",
  "nav.dashboard": "என் புகார்கள்",
  "nav.admin": "நிர்வாகி",
  "nav.adminDashboard": "நிர்வாகி டாஷ்போர்டு",
  "nav.signOut": "வெளியேறு",
  "nav.signOutNamed": "வெளியேறு ({name})",
  "nav.getStarted": "தொடங்குங்கள்",
  "nav.createAccount": "கணக்கை உருவாக்கு",
  "nav.setLocality": "உங்கள் பகுதியை அமைக்கவும்",
  "nav.signedOut": "வெளியேறினீர்கள். மீண்டும் சந்திப்போம்.",
  "nav.signOutFailed": "வெளியேற முடியவில்லை — இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்",
  "footer.about":
    "குழிகள் முதல் தெருவிளக்குகள் வரை — உங்கள் பகுதியின் உள்கட்டமைப்புச் சிக்கல்களைப் புகாரளித்து, அவற்றின் தீர்வைக் கண்காணிக்கும் சமூகத் தளம்.",
  "footer.platform": "தளம்",
  "footer.exploreComplaints": "புகார்களை ஆராய்க",
  "footer.reportIssue": "சிக்கலைப் புகாரளி",
  "footer.myComplaints": "என் புகார்கள்",
  "footer.account": "கணக்கு",
  "footer.createAccount": "கணக்கை உருவாக்கு",
  "footer.mapData": "வரைபடத் தரவு மற்றும் படங்கள் ©",
  "footer.contributors": "பங்களிப்பாளர்கள். இடத் தேடல்: Nominatim.",

  "card.supports_one": "{count} ஆதரவு",
  "card.supports_other": "{count} ஆதரவுகள்",
  "upvote.thanks": "ஆதரவைச் சேர்த்ததற்கு நன்றி — வார்டு அலுவலகம் அதிக ஆதரவுள்ள புகார்களை முதலில் பார்க்கும்.",
  "upvote.signInToSupport": "புகார்களை ஆதரிக்க உள்நுழையவும்",
  "upvote.already": "இந்தப் புகாரை நீங்கள் ஏற்கெனவே ஆதரித்துள்ளீர்கள்",
  "upvote.failed": "உங்கள் ஆதரவைப் பதிவு செய்ய முடியவில்லை — மீண்டும் முயற்சிக்கவும்",
  "upvote.youSupported": "இந்தப் புகாரை நீங்கள் ஆதரித்தீர்கள்",
  "upvote.supportThis": "இந்தப் புகாரை ஆதரிக்கவும்",
  "upvote.supportsSr": "ஆதரவுகள்",

  "timeline.empty": "இதுவரை நிலை புதுப்பிப்புகள் எதுவும் பதிவாகவில்லை.",

  "time.justNow": "இப்போதுதான்",
  "time.minAgo": "{count} நிமிடங்களுக்கு முன்",
  "time.hoursAgo_one": "{count} மணி நேரத்திற்கு முன்",
  "time.hoursAgo_other": "{count} மணி நேரத்திற்கு முன்",
  "time.daysAgo_one": "{count} நாளுக்கு முன்",
  "time.daysAgo_other": "{count} நாட்களுக்கு முன்",
  "media.onlyImages": "படக் கோப்புகளை மட்டுமே இணைக்க முடியும்",
  "media.tooLarge": "படம் மிகப் பெரியது — 10 MB-க்குள் உள்ளதைத் தேர்ந்தெடுக்கவும்",
  "media.processFail": "இந்த உலாவியில் படத்தைச் செயலாக்க முடியவில்லை",

  "empty.noPhotoAlt": "புகைப்படம் இல்லை",

  "locality.title": "உங்கள் பகுதியைத் தேர்ந்தெடுக்கவும்",
  "locality.description":
    "புகார்கள் பகுதி வாரியாகத் தொகுக்கப்படுகின்றன. இடத்தைத் தேடலாம், உங்கள் இருப்பிடத்தைக் கண்டறியலாம் அல்லது பட்டியலிலிருந்து தேர்வு செய்யலாம்.",
  "locality.searchLabel": "இந்தியாவின் எந்த ஊரையும் பகுதியையும் தேடுங்கள்",
  "locality.searchPlaceholder": "எ.கா. இந்திரா நகர், பெங்களூரு",
  "locality.searching": "இடங்கள் தேடப்படுகின்றன…",
  "locality.noResults": "பொருந்தும் இடங்கள் இல்லை",
  "locality.min3": "தேட குறைந்தது 3 எழுத்துகளை உள்ளிடவும்",
  "locality.state": "மாநிலம்",
  "locality.district": "மாவட்டம்",
  "locality.town": "நகரம் / ஊர்",
  "locality.localityOptional": "பகுதி (விருப்பம்)",
  "locality.selectState": "மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
  "locality.selectDistrict": "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
  "locality.selectTown": "ஊரைத் தேர்ந்தெடுக்கவும்",
  "locality.wholeTown": "முழு ஊர்",
  "locality.selectTownFirst": "முதலில் ஊரைத் தேர்ந்தெடுக்கவும்",
  "locality.detecting": "கண்டறிகிறது…",
  "locality.useCurrent": "என் தற்போதைய இருப்பிடத்தைப் பயன்படுத்து",
  "locality.apply": "இந்தப் பகுதியைப் பயன்படுத்து",
  "locality.coords": "வரைபட ஆயத்தொலைவுகள் பெறப்பட்டன: {lat}, {lng}",
  "locality.noGeo": "உங்கள் உலாவி இருப்பிடக் கண்டறிதலை ஆதரிக்கவில்லை",
  "locality.detected": "உங்கள் இருப்பிடம் கண்டறியப்பட்டது — பெயர் தவறாகத் தெரிந்தால் சரியான பகுதியைத் தேர்ந்தெடுக்கவும்",
  "locality.lookupFailed": "உங்கள் இருப்பிடத்தைக் கண்டறிய முடியவில்லை — கீழே உள்ள பட்டியல்களிலிருந்து தேர்ந்தெடுக்கவும்",
  "locality.permissionDenied": "இருப்பிட அனுமதி மறுக்கப்பட்டது — பட்டியல்களிலிருந்து உங்கள் பகுதியைத் தேர்ந்தெடுக்கவும்",
  "locality.pickFirst": "முதலில் மாநிலம், மாவட்டம், ஊரைத் தேர்ந்தெடுக்கவும்",
  "locality.nowShowing": "இப்போது {place} புகார்கள் காட்டப்படுகின்றன",

  "map.supports_one": "{count} ஆதரவு",
  "map.supports_other": "{count} ஆதரவுகள்",

  "home.eyebrow": "சமூக பலத்தால் குடிமைப் புகார்கள்",
  "home.heroLine1": "உங்கள் பகுதியின் சிக்கல்கள்,",
  "home.heroLine2": "இனி பதிவில்.",
  "home.heroBody":
    "குழிகள், பழுதான தெருவிளக்குகள், நிரம்பி வழியும் குப்பை என எதையும் புகாரளியுங்கள் — வரைபடத்தில் குறியிடுங்கள், அண்டை வீட்டார் புகார்களை ஆதரியுங்கள், வார்டு அலுவலகம் முடித்து வைக்கும் வரை ஒவ்வொரு சிக்கலையும் பின்தொடருங்கள்.",
  "home.reportCta": "சிக்கலைப் புகாரளி",
  "home.exploreCta": "வரைபடத்தை ஆராய்க",
  "home.statTotal": "கண்காணிக்கப்படும் புகார்கள்",
  "home.statActive": "பணி நடைபெறுகிறது",
  "home.statResolved": "இதுவரை தீர்க்கப்பட்டவை",
  "home.currentlyShowing": "தற்போது காட்டுவது:",
  "home.everyLocality": "பட்டியலிலுள்ள எல்லாப் பகுதிகளும்",
  "home.liveReports": "வரைபடத்தில் நேரடிப் புகார்கள்",
  "home.pinsIn": "{place}-ல் {count} குறியீடுகள்",
  "home.loadingLive": "நேரடித் தரவு ஏற்றப்படுகிறது…",
  "home.whatCanReport": "நீங்கள் எதைப் புகாரளிக்கலாம்?",
  "home.eightCategories": "எட்டு வகைகள், ஒவ்வொன்றுக்கும் பொறுப்புடைய தடம்.",
  "home.howTitle": "புகாரிலிருந்து தீர்வு வரை",
  "home.howSubtitle": "ஒவ்வொரு புகாரும் பொறுப்புடைய ஒரே தடத்தில் செல்கிறது — ஒவ்வொரு படியிலும் உங்களுக்குத் தெரியும்.",
  "home.step1Title": "இரண்டு நிமிடங்களில் புகாரளியுங்கள்",
  "home.step1Body":
    "வரைபடத்தில் சரியான இடத்தைக் குறியிடுங்கள், புகைப்படங்களைச் சேர்க்கவும், வகையைத் தேர்ந்தெடுக்கவும். முடிந்தது — புகார் நேரப்பதிவுடன் பதிவாகிவிட்டது.",
  "home.step2Title": "அண்டை வீட்டார் பலம் சேர்க்கிறார்கள்",
  "home.step2Body":
    "அண்டை வீட்டாரின் ஒவ்வொரு ஆதரவும், இது ஒரு வீட்டின் சிக்கல் அல்ல, முழுத் தெருவின் சிக்கல் என்று வார்டு அலுவலகத்துக்குத் தெரிவிக்கிறது.",
  "home.step3Title": "தீர்வு வரை கண்காணியுங்கள்",
  "home.step3Body":
    "அதிகாரப்பூர்வ காலவரிசையைப் பின்தொடருங்கள் — பரிசீலனையில், ஒதுக்கப்பட்டது, பணி நடைபெறுகிறது — உங்கள் புகாரைக் கையாளும் அலுவலகத்தின் குறிப்புகளுடன்.",
  "home.mostSupported": "இப்போது அதிக ஆதரவுள்ளவை",
  "home.mostSupportedSub": "உங்கள் அண்டை வீட்டார் ஆதரிக்கும் புகார்கள்.",
  "home.viewAll": "அனைத்தும் காண்க",
  "home.noReportsTitle": "இங்கே இன்னும் புகார்கள் இல்லை",
  "home.noReportsBody": "{place} பகுதியின் சிக்கலை முதலில் பதிவு செய்பவராக இருங்கள்.",
  "home.reportFirst": "முதல் சிக்கலைப் புகாரளி",
  "home.sortedBy": "{place}-ல் சமூக ஆதரவு அடிப்படையில் வரிசைப்படுத்தப்பட்டது",

  "login.brandTitle": "பதிவுக்கு மீண்டும் வரவேற்கிறோம்.",
  "login.brandBody":
    "புதிய சிக்கல்களைப் புகாரளிக்க, அண்டை வீட்டாரின் புகார்களை ஆதரிக்க, நீங்கள் புகாரளித்த அனைத்தின் அதிகாரப்பூர்வ காலவரிசையைப் பின்தொடர உள்நுழையுங்கள்.",
  "login.bullet1": "நீங்கள் பதிவு செய்த ஒவ்வொரு புகாரையும் கண்காணிக்கவும்",
  "login.bullet2": "உங்கள் பகுதியின் சிக்கல்களை ஆதரிக்கவும்",
  "login.bullet3": "நிர்வாகி குறிப்புகளை வந்தவுடன் பாருங்கள்",
  "login.subtitle": "உங்கள் CivicConnect கணக்கைப் பயன்படுத்தவும்.",
  "login.alreadyAs": "நீங்கள் ஏற்கெனவே {name} ஆக உள்நுழைந்துள்ளீர்கள் — தொடர்ந்தால் கணக்கு மாறும்.",
  "login.email": "மின்னஞ்சல்",
  "login.emailPlaceholder": "neengal@example.com",
  "login.password": "கடவுச்சொல்",
  "login.passwordPlaceholder": "உங்கள் கடவுச்சொல்",
  "login.signingIn": "உள்நுழைகிறது…",
  "login.demoAccounts": "டெமோ கணக்குகள்",
  "login.roleAdministrator": "நிர்வாகி",
  "login.roleCitizen": "குடிமகன்",
  "login.fill": "நிரப்பு",
  "login.newHere": "புதியவரா?",
  "login.createAccount": "கணக்கை உருவாக்குங்கள்",
  "login.enterBoth": "உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லை உள்ளிடவும்",
  "login.welcomeBack": "மீண்டும் வருக, {name}",
  "login.invalid": "மின்னஞ்சல் அல்லது கடவுச்சொல் தவறு",
  "login.failed": "உள்நுழைவு தோல்வியடைந்தது — இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்",

  "register.brandTitle": "சேர இரண்டு நிமிடங்கள். அதன் பிறகு ஒவ்வொரு புகாரும் முக்கியம்.",
  "register.brandBody":
    "ஒரே கணக்கில் அனைத்தும்: வரைபடத்தில் சிக்கல்களைக் குறியிடுங்கள், புகைப்படங்களைச் சேர்க்கவும், அண்டை வீட்டார் புகார்களை ஆதரிக்கவும், வார்டு அலுவலகத்தின் பதிலைப் பாருங்கள் — ஒவ்வொரு நிலை மாற்றமும் உங்கள் பதிவில்.",
  "register.privacy":
    "உங்கள் மின்னஞ்சல் கணக்கு அணுகலுக்கு மட்டுமே பயன்படுத்தப்படும்; புகார்களில் பொதுவில் காட்டப்படாது. புகார்களில் உங்கள் காட்சிப் பெயர் மட்டுமே தெரியும்.",
  "register.title": "உங்கள் கணக்கை உருவாக்குங்கள்",
  "register.subtitle": "இலவசம், உங்கள் பகுதிக்காக உருவாக்கப்பட்டது.",
  "register.fullName": "முழுப் பெயர்",
  "register.namePlaceholder": "எ.கா. அர்ஜுன் ராவ்",
  "register.passwordPlaceholder": "8+ எழுத்துகள்",
  "register.confirm": "கடவுச்சொல்லை உறுதிசெய்",
  "register.confirmPlaceholder": "மீண்டும் உள்ளிடவும்",
  "register.creating": "கணக்கு உருவாகிறது…",
  "register.submit": "கணக்கை உருவாக்கு",
  "register.already": "ஏற்கெனவே பதிவு செய்துள்ளீர்களா?",
  "register.errName": "உங்கள் முழுப் பெயரை உள்ளிடவும்",
  "register.errEmail": "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்",
  "register.errPassword": "குறைந்தது 8 எழுத்துகள் பயன்படுத்தவும்",
  "register.errConfirm": "கடவுச்சொற்கள் பொருந்தவில்லை",
  "register.errExists": "இந்த மின்னஞ்சலில் ஏற்கெனவே கணக்கு உள்ளது — உள்நுழையவும்",
  "register.errCreate": "கணக்கை உருவாக்க முடியவில்லை — விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்",
  "register.errGeneric": "ஏதோ தவறு நடந்துவிட்டது — மீண்டும் முயற்சிக்கவும்",
  "register.welcome": "CivicConnect-க்கு வரவேற்கிறோம், {name}",

  "notFound.title": "பக்கம் கிடைக்கவில்லை",
  "notFound.body": "நீங்கள் தேடிய பக்கம் இல்லை. வரைபடமும் ஒவ்வொரு புகாரும் நீங்கள் விட்ட இடத்திலேயே உள்ளன.",
  "notFound.home": "முகப்புப் பக்கத்திற்குத் திரும்பு",

  "dashboard.signInTitle": "உங்கள் புகார்களைக் காண உள்நுழையவும்",
  "dashboard.signInBody":
    "நீங்கள் புகாரளித்த ஒவ்வொரு சிக்கலும், அதில் வார்டு அலுவலகத்தின் முன்னேற்றமும் உங்கள் டாஷ்போர்டில் காட்டப்படும்.",
  "dashboard.hello": "வணக்கம், {name}",
  "dashboard.subtitle": "நீங்கள் பதிவு செய்த ஒவ்வொரு சிக்கலும், அதன் நேரடி அதிகாரப்பூர்வ நிலையுடன்.",
  "dashboard.reportNew": "புதிய சிக்கலைப் புகாரளி",
  "dashboard.statFiled": "பதிவு செய்த புகார்கள்",
  "dashboard.statResolved": "தீர்க்கப்பட்டவை",
  "dashboard.statSupports": "பெற்ற ஆதரவுகள்",
  "dashboard.myComplaints": "என் புகார்கள்",
  "dashboard.emptyTitle": "நீங்கள் இன்னும் எதையும் புகாரளிக்கவில்லை",
  "dashboard.emptyBody":
    "உங்கள் தெருவில் குழி பார்த்தீர்களா? பதிவு செய்ய இரண்டு நிமிடங்கள் போதும் — குறியிடுங்கள், புகைப்படம் எடுங்கள், சமர்ப்பியுங்கள்.",
  "dashboard.reportFirst": "உங்கள் முதல் சிக்கலைப் புகாரளியுங்கள்",

  "explore.title": "புகார்களை ஆராய்க",
  "explore.showing": "மொத்தம்",
  "explore.issuesIn": "புகார்கள் காட்டப்படுகின்றன, பகுதி:",
  "explore.map": "வரைபடம்",
  "explore.list": "பட்டியல்",
  "explore.category": "வகை",
  "explore.status": "நிலை",
  "explore.sort": "வரிசை",
  "explore.allCategories": "அனைத்து வகைகள்",
  "explore.allStatuses": "அனைத்து நிலைகள்",
  "explore.newest": "புதியவை முதலில்",
  "explore.mostSupported": "அதிக ஆதரவு",
  "explore.nearMe": "என் அருகில்",
  "explore.nearbyOn": "அருகாமை வடிகட்டி இயக்கத்தில் — நீக்கு",
  "explore.within5": "உங்களிடமிருந்து 5 கி.மீ-க்குள்",
  "explore.allLocalities": "எல்லாப் பகுதிகளும்",
  "explore.noGeo": "உங்கள் உலாவி இருப்பிடக் கண்டறிதலை ஆதரிக்கவில்லை",
  "explore.geoDenied": "இருப்பிட அனுமதி மறுக்கப்பட்டது — நீங்கள் தேர்ந்தெடுத்த பகுதி காட்டப்படுகிறது",
  "explore.errTitle": "புகார்களை ஏற்ற முடியவில்லை",
  "explore.errBody": "ஊட்டம் தற்காலிகமாகக் கிடைக்கவில்லை. உங்கள் தரவு பாதுகாப்பாக உள்ளது — சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.",
  "explore.noMatchTitle": "இந்த வடிகட்டிகளுக்குப் பொருந்தும் புகார்கள் இல்லை",
  "explore.noMatchBody":
    "இந்தச் சேர்க்கைக்கு {place}-ல் இன்னும் எதுவும் பதிவாகவில்லை. வடிகட்டிகளை விரிவாக்குங்கள் அல்லது வேறு பகுதியைத் தேர்ந்தெடுங்கள்.",
  "explore.resetFilters": "வடிகட்டிகளை மீட்டமை",
  "explore.fullDetails": "முழு விவரம்",

  "detail.notFound": "புகார் கிடைக்கவில்லை",
  "detail.loadFail": "இந்தப் புகாரை ஏற்ற முடியவில்லை",
  "detail.errBody":
    "புகார் நீக்கப்பட்டிருக்கலாம் அல்லது இணைப்பு தவறாக இருக்கலாம். நீங்கள் தேடியதைக் காண வரைபடத்துக்குத் திரும்புங்கள்.",
  "detail.backExplore": "ஆராய்வுக்குத் திரும்பு",
  "detail.allComplaints": "அனைத்துப் புகார்கள்",
  "detail.reported": "புகார் செய்தது {time}",
  "detail.landmark": "அடையாளம்: {address}",
  "detail.supportedThis_one": "அண்டை வீட்டார் இதை ஆதரித்தார்",
  "detail.supportedThis_other": "அண்டை வீட்டார் இதை ஆதரித்தனர்",
  "detail.whatHappened": "என்ன நடந்தது",
  "detail.beforePhotos": "முன்: அசல் புகார் புகைப்படங்கள் ({count})",
  "detail.photoAlt": "{title} — புகைப்படம் {n}",
  "detail.photoTitle": "புகார் புகைப்படம் {n}",
  "detail.afterTitle": "பின்: தீர்வுக்கான சான்று",
  "detail.resolvedAt": "தீர்க்கப்பட்டது {time}",
  "detail.afterAlt": "{title} — தீர்வுக்குப் பின்",
  "detail.afterPhotoTitle": "தீர்வுக்குப் பின் புகைப்படம்",
  "detail.savedLocation": "சேமிக்கப்பட்ட இடம்: {coords}",
  "detail.historyTitle": "அதிகாரப்பூர்வ நிலை வரலாறு",
  "detail.lastUpdated": "கடைசியாகப் புதுப்பித்தது {time}",

  "report.stepDetails": "விவரங்கள்",
  "report.stepLocation": "இடம்",
  "report.stepPhotos": "புகைப்படங்கள் & சமர்ப்பி",
  "report.signInTitle": "சிக்கலைப் புகாரளிக்க உள்நுழையவும்",
  "report.signInBody":
    "வார்டு அலுவலகம் சரியான நபரைத் தொடர்புகொள்ள புகாரளிக்கக் கணக்கு தேவை. வரைபடத்தைப் பார்ப்பது அனைவருக்கும் திறந்தே உள்ளது.",
  "report.createAccount": "கணக்கை உருவாக்கு",
  "report.errTitle": "சிக்கலுக்குக் குறைந்தது 10 எழுத்துகளில் தெளிவான தலைப்பு கொடுக்கவும்",
  "report.errDescription": "அலுவலகம் நடவடிக்கை எடுக்க, சிக்கலைக் குறைந்தது 20 எழுத்துகளில் விவரிக்கவும்",
  "report.errCategory": "மிகப் பொருத்தமான வகையைத் தேர்ந்தெடுக்கவும்",
  "report.errLocality": "முதலில் உங்கள் பகுதியைத் தேர்ந்தெடுக்கவும் — அதன்படியே புகார் அனுப்பப்படும்",
  "report.errPosition": "வரைபடத்தில் சரியான இடத்தைக் குறியிடுங்கள்: வரைபடத்தைக் கிளிக் செய்யவும் அல்லது GPS இருப்பிடத்தைப் பயன்படுத்தவும்",
  "report.maxPhotos": "ஒரு புகாருக்கு அதிகபட்சம் {count} புகைப்படங்கள்",
  "report.photoReadFail": "அந்தப் படத்தைப் படிக்க முடியவில்லை",
  "report.submitted": "புகார் சமர்ப்பிக்கப்பட்டது — இப்போது பொதுப் பதிவில் உள்ளது",
  "report.submittedDesc": "நகராட்சி அலுவலகம் புதிய புகார்களை சில வேலை நாட்களுக்குள் பரிசீலிக்கும்.",
  "report.sessionExpired": "உங்கள் அமர்வு முடிந்தது — சமர்ப்பிக்க மீண்டும் உள்நுழையவும்",
  "report.submitFail": "புகாரைச் சமர்ப்பிக்க முடியவில்லை — இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்",
  "report.noGeo": "உங்கள் உலாவி இருப்பிடக் கண்டறிதலை ஆதரிக்கவில்லை",
  "report.gpsOk": "GPS மூலம் இடம் பெறப்பட்டது — தேவைப்பட்டால் ஆரஞ்சு குறியீட்டை இழுத்துச் சரிசெய்யவும்",
  "report.gpsDenied": "இருப்பிட அனுமதி மறுக்கப்பட்டது — குறியீட்டைக் கைமுறையாக வைக்க வரைபடத்தைக் கிளிக் செய்யவும்",
  "report.backExplore": "ஆராய்வுக்குத் திரும்பு",
  "report.title": "சிக்கலைப் புகாரளி",
  "report.subtitle": "துல்லியமான புகார் விரைவில் சரிசெய்யப்படும். இரண்டு நிமிடங்களே போதும்.",
  "report.fieldTitle": "தலைப்பு",
  "report.titlePlaceholder": "எ.கா. 100 அடி சாலை சிக்னல் சந்திப்பில் ஆழமான குழி",
  "report.fieldDescription": "சரியாக என்ன பிரச்சினை?",
  "report.descriptionPlaceholder": "சிக்கலை, எப்போதிலிருந்து, அவ்வழியே செல்வோரை எப்படிப் பாதிக்கிறது என்பதை விவரிக்கவும்…",
  "report.fieldCategory": "வகை",
  "report.nextLocation": "அடுத்து: இடத்தைக் குறியிடு",
  "report.routingTo": "அனுப்பப்படும் இடம்:",
  "report.noLocalityYet": "இன்னும் பகுதி தேர்ந்தெடுக்கப்படவில்லை",
  "report.change": "மாற்று",
  "report.chooseLocality": "பகுதியைத் தேர்ந்தெடு",
  "report.mapHelp": "குறியீட்டை வைக்க வரைபடத்தைக் கிளிக் செய்யவும், சரிசெய்ய இழுக்கவும் அல்லது தற்போதைய GPS இருப்பிடத்தைப் பயன்படுத்தவும்.",
  "report.pinned": "குறியிடப்பட்டது: {coords}",
  "report.useGps": "என் தற்போதைய இருப்பிடத்தைப் பயன்படுத்து",
  "report.searchPlace": "வரைபடத்தை அங்கே கொண்டு செல்ல இடத்தைத் தேடுங்கள்",
  "report.searchPlaceholder": "எ.கா. கோரமங்களா 5வது பிளாக்",
  "report.landmark": "அருகிலுள்ள அடையாளம் (விருப்பம்)",
  "report.landmarkPlaceholder": "எ.கா. பேருந்து நிலைய வாயிலுக்கு எதிரில்",
  "report.nextPhotos": "அடுத்து: புகைப்படங்களைச் சேர்",
  "report.photosLabel": "புகைப்படங்கள் (அதிகபட்சம் {count}, விருப்பம் ஆனால் மிகவும் உதவும்)",
  "report.attachment": "இணைப்பு {n}",
  "report.removePhoto": "புகைப்படம் {n}-ஐ நீக்கு",
  "report.addPhoto": "புகைப்படம் சேர்",
  "report.photoNote": "பதிவேற்றத்துக்கு முன் புகைப்படங்கள் உங்கள் உலாவியில் சுருக்கப்படும்; சுமார் 1 MB-க்கு மேல் சேமிக்கப்படாது.",
  "report.review": "மதிப்பாய்வு",
  "report.untitled": "தலைப்பு இல்லை",
  "report.noCategory": "வகை இல்லை",
  "report.pinnedAt": "குறியிடப்பட்ட இடம்: {coords}",
  "report.noPin": "இடம் குறியிடப்படவில்லை",
  "report.routingLine": "அனுப்பப்படும் இடம்: {place} ·",
  "report.noLocality": "பகுதி இல்லை",
  "report.photoCount_one": "{count} புகைப்படம்",
  "report.photoCount_other": "{count} புகைப்படங்கள்",
  "report.submitting": "சமர்ப்பிக்கிறது…",
  "report.submit": "புகாரைச் சமர்ப்பி",

  "admin.statusUpdated": "நிலை {status} ஆக மாற்றப்பட்டது",
  "admin.errRemark": "குறிப்பைச் சேர்க்கவும் (குறைந்தது 3 எழுத்துகள்) — இது பொதுக் காலவரிசையில் காட்டப்படும்",
  "admin.errPhoto": "இந்தப் புகாரைத் தீர்க்கும் முன் தீர்வுக்குப் பின் புகைப்படத்தைப் பதிவேற்றவும்",
  "admin.defaultRemark": "புகைப்பட ஆதாரத்துடன் தீர்க்கப்பட்டது.",
  "admin.errAlready": "இந்தப் புகார் ஏற்கெனவே அந்த நிலையில் உள்ளது",
  "admin.errUpdate": "நிலையைப் புதுப்பிக்க முடியவில்லை — மீண்டும் முயற்சிக்கவும்",
  "admin.errCompressed": "சுருக்கப்பட்ட படம் 1.2 MB-க்குள் இருக்க வேண்டும்",
  "admin.manageTitle": "புகாரை நிர்வகி",
  "admin.by": "{name} மூலம்",
  "admin.evidenceAlt": "ஆதாரம் {n}",
  "admin.updateStatus": "நிலையைப் புதுப்பி",
  "admin.newStatus": "புதிய நிலை",
  "admin.officialRemark": "அதிகாரப்பூர்வ குறிப்பு (பொதுக் காலவரிசையில் தெரியும்)",
  "admin.afterPhoto": "தீர்வுக்குப் பின் புகைப்படம் (கட்டாயம்)",
  "admin.previewAlt": "தீர்வு ஆதாரத்தின் முன்னோட்டம்",
  "admin.resolutionRemarks": "தீர்வுக் குறிப்புகள் (விருப்பம்)",
  "admin.remarkPlaceholder":
    "எ.கா. மண்டலப் பொறியியல் பிரிவுக்குப் பணி ஆணை வழங்கப்பட்டது; பழுதுபார்க்கும் குழு வியாழக்கிழமைக்கு நிர்ணயம்.",
  "admin.saving": "சேமிக்கிறது…",
  "admin.save": "நிலைப் புதுப்பிப்பைச் சேமி",
  "admin.timelineSoFar": "இதுவரையிலான காலவரிசை",
  "admin.deniedAdminTitle": "நிர்வாகி அணுகல் தேவை",
  "admin.deniedSignInTitle": "நிர்வாகியாக உள்நுழையவும்",
  "admin.deniedAdminBody":
    "உங்கள் கணக்குக்கு நகராட்சி நிர்வாக உரிமைகள் இல்லை. இது தவறு என்று நினைத்தால் தளக் குழுவைத் தொடர்பு கொள்ளவும்.",
  "admin.deniedSignInBody": "நிர்வாகிக் கட்டுப்பாட்டகம் அங்கீகரிக்கப்பட்ட நகராட்சிக் கணக்குகளுக்கு மட்டுமே.",
  "admin.kpiTotal": "மொத்தப் புகார்கள்",
  "admin.kpiPending": "பரிசீலனைக்குக் காத்திருப்பவை",
  "admin.kpiProgress": "பணி நடைபெறுகிறது",
  "admin.kpiResolved": "தீர்க்கப்பட்டவை",
  "admin.eyebrow": "நகராட்சி அலுவலகம்",
  "admin.title": "நிர்வாகி டாஷ்போர்டு",
  "admin.signedInAs": "{name} ஆக உள்நுழைந்துள்ளீர்கள் · நிர்வாகி",
  "admin.chartCategory": "வகை வாரியாகப் புகார்கள்",
  "admin.chartDaily": "புகார்கள் — கடந்த 14 நாட்கள்",
  "admin.town": "ஊர்",
  "admin.allTowns": "அனைத்து ஊர்கள்",
  "admin.search": "தேடு",
  "admin.searchPlaceholder": "தலைப்பு, விவரம் அல்லது பகுதி",
  "admin.noMatchTitle": "இந்த வடிகட்டிகளுக்குப் பொருந்தும் புகார்கள் இல்லை",
  "admin.noMatchBody": "வரிசையில் மேலும் காண ஊர், வகை அல்லது நிலை வடிகட்டிகளை மாற்றுங்கள்.",
  "admin.colComplaint": "புகார்",
  "admin.colLocality": "பகுதி",
  "admin.colCategory": "வகை",
  "admin.colStatus": "நிலை",
  "admin.colSupport": "ஆதரவு",
  "admin.colReported": "புகார் செய்தது",
  "admin.colManage": "நிர்வாகம்",
  "admin.manage": "நிர்வகி",
  "admin.inView": "{count} புகார்கள் காட்டப்படுகின்றன",
  "admin.statusAppear": "நிலை மாற்றங்கள் பொதுக் காலவரிசையில் உடனே தெரியும்.",
  "admin.backPublic": "பொதுப் பார்வைக்குத் திரும்பு",
};

const DICTS: Record<Lang, Dict> = { en, hi: hi as Dict, ta: ta as Dict };

// ---------------------------------------------------------------------------------------
// Core lookup (usable outside React) — current language is kept in a module variable
// ---------------------------------------------------------------------------------------
function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "hi" || stored === "ta") return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (nav === "hi" || nav === "ta") return nav;
  } catch {
    // private mode etc. — fall back to English
  }
  return "en";
}

let currentLang: Lang = readStoredLang();

export function getLang(): Lang {
  return currentLang;
}

export function getLocale(): string {
  return LANGUAGES.find((l) => l.code === currentLang)?.locale ?? "en-IN";
}

export type TParams = Record<string, string | number>;

export function translate(key: TranslationKey, params?: TParams, lang: Lang = currentLang): string {
  let resolved: string = key;
  if (params && typeof params.count === "number") {
    const plural = `${key}_${params.count === 1 ? "one" : "other"}`;
    if (plural in en) resolved = plural;
  }
  const dict = DICTS[lang];
  let text = dict[resolved] ?? (en as Dict)[resolved] ?? String(key);
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

// Appends dictated text to an existing field value (adds a space, respects maxLength).
export function appendSpeech(previous: string, spoken: string, maxLength?: number): string {
  const joined = (previous.trim() ? `${previous.trimEnd()} ` : "") + spoken;
  return maxLength ? joined.slice(0, maxLength) : joined;
}

// ---------------------------------------------------------------------------------------
// React side
// ---------------------------------------------------------------------------------------
interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  speechLang: string;
  locale: string;
  t: (key: TranslationKey, params?: TParams) => string;
  categoryLabel: (category: string) => string;
  statusLabel: (status: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  const setLang = useCallback((next: Lang) => {
    currentLang = next;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // choice just won't persist
    }
  }, []);

  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.title = translate("meta.title", undefined, lang);
  }, [lang]);

  const value = useMemo<I18nContextValue>(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
    const t = (key: TranslationKey, params?: TParams) => translate(key, params, lang);
    return {
      lang,
      setLang,
      speechLang: meta.speech,
      locale: meta.locale,
      t,
      categoryLabel: (category) => (`category.${category}` in en ? t(`category.${category}` as TranslationKey) : category),
      statusLabel: (status) => (`status.${status}` in en ? t(`status.${status}` as TranslationKey) : status),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
