# Bug & Fix Log

Every bug/error we hit goes here, newest on top. One entry per bug.
Format:

```
## [YYYY-MM-DD] Short title (Step N)
- **Symptom:** what we saw (error message, wrong behavior)
- **Cause:** what was actually wrong
- **Fix:** what we changed
- **Lesson:** (optional) how to avoid it next time
```

---

## [2026-08-25] 🍺 emoji rendered as boxed "?" in simulator (Step 0)
- **Symptom:** The beer emoji in the title showed as a missing-glyph box on iPhone 17 / iOS 26.3 simulator.
- **Cause:** File encoding verified correct (UTF-8 `f0 9f 8d ba`) — a fresh-simulator font/rendering quirk, not our code.
- **Fix:** Removed the emoji from the title; real branding comes from the design pass anyway.
- **Lesson:** Verify encoding at the byte level before blaming code; don't fight simulator quirks on cosmetic details.

## [2026-08-25] Expo Go failed to install in simulator — disk full (Step 0)
- **Symptom:** `npx expo start --ios` crashed with `Error: ENOSPC: no space left on device` while "Fetching Expo Go".
- **Cause:** Disk had only 244 MB free after installing Xcode (~10 GB) + iOS simulator runtime (~8 GB).
- **Fix:** `npm cache clean --force` freed 4.2 GB (npm re-downloads packages on demand); retried and it worked.
- **Lesson:** Keep an eye on free disk space — Mac still at ~77% capacity; free up more before Step 1 if possible.

## [2026-08-25] First `expo start --ios` opened before simulator finished booting (Step 0)
- **Symptom:** Expo printed "Opening … on iPhone 17" but nothing appeared; Expo Go was never installed.
- **Cause:** The simulator was still on its first-boot Apple-logo screen when Expo tried to open the app.
- **Fix:** Waited for `xcrun simctl bootstatus -b` to finish, then restarted `npx expo start --ios`.
- **Lesson:** Boot the simulator fully (first boot is slow) before pointing Expo at it.
