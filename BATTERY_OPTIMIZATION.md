# Battery Optimization & MIUI Compatibility

## Why Reminders Need Whitelisting

On MIUI devices (Xiaomi, Redmi, Poco), the system is aggressively tuned to save battery. App reminders and background tasks are heavily restricted unless whitelisted.

## Setup Instructions

### For MIUI Users

To ensure reminders work reliably:

1. **Settings → Battery & device care → Battery Saver**
   - Tap **Protected apps**
   - Add **QuantumHabits** to the list

2. **Settings → Apps → App Management → QuantumHabits → Startup**
   - Set to **Allow**

3. **Settings → Apps → Permissions → Device health → QuantumHabits**
   - Grant all requested permissions

### Recommended Reminder Intervals

To minimize battery impact:

- **Best:** 1 reminder per day
- **Good:** 2-3 reminders per day
- **Acceptable:** Up to 5 reminders per day
- **Not recommended:** More than 5 reminders per day (may impact battery perception)

## How We Minimize Battery Drain

- **5-second wake lock** - Just enough time to post notification, then releases immediately
- **Inexact alarms** - Allows the system to batch with other alarms instead of waking independently
- **No background services** - Reminders only run when triggered, not continuously
- **Efficient notification posting** - No heavy operations, just displays notification

## Common Issues

### Reminders Not Firing After Fresh Install

This is normal. MIUI needs to "learn" that your app is trustworthy:

1. Set a reminder while the app is open
2. Close the app (swipe from recents)
3. After 2-3 successful reminder fires, MIUI will stop flagging it as suspicious

### "Battery drain" Warnings

If you see battery warnings about QuantumHabits:

1. Add to Protected apps (see above)
2. Check that you don't have an excessive number of reminders (see interval recommendations)
3. Consider using just 1 reminder per day instead of many

## Other Android Versions

**Stock Android, OnePlus, Samsung (OneUI):** No whitelisting needed. Battery impact is minimal.

**MIUI/POCO ROM:** Follow the setup instructions above. This is the main limitation.

