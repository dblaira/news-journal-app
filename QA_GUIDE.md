# QA Guide — Understood App

This is a reference for reporting bugs and logging test results. Don't try to learn this from the doc alone — your first few reports should be done together with Adam so you can calibrate what level of detail is useful.

---

## How to report a bug

1. Go to **https://github.com/dblaira/news-journal-app/issues**
2. Click the green **New issue** button
3. Pick **Bug Report**
4. Fill in the form:
   - **What happened** — describe what you saw
   - **What should have happened** — what you expected
   - **Steps to reproduce** — walk through exactly what you did, numbered
   - **Device and browser** — pick from the dropdown
   - **How bad is it** — pick the closest severity
   - **Screenshot** — drag and drop an image if you have one (very helpful)
   - **Anything else** — optional extra context
5. Click **Submit new issue**

That's it. The issue gets tracked automatically.

---

## How to log a test result

Use this when you're intentionally testing a feature (not just stumbling on a bug).

1. Same URL: **https://github.com/dblaira/news-journal-app/issues**
2. Click **New issue** → pick **Test Result**
3. Fill in:
   - **Feature tested** — what you were checking
   - **Result** — Pass, Partial, or Fail
   - **Device and browser**
   - **What did you observe** — describe what happened
4. Submit

---

## How to add a screenshot

On Mac: **Cmd + Shift + 4** to capture a selection, or **Cmd + Shift + 5** for more options. The screenshot saves to your desktop.

On iPhone: **Side button + Volume Up** at the same time.

Then drag the image into the screenshot field on GitHub, or tap the field and select the file.

---

## How to verify a fix

When a bug you reported gets fixed:

1. Open the issue (you'll get an email notification, or find it in the Issues list)
2. Test the fix on the live app
3. If it works: leave a comment saying "Verified" and close the issue
4. If it's not fully fixed: leave a comment describing what's still wrong

---

## Labels you'll see on issues

| Label | Meaning |
|-------|---------|
| **bug** | Something is broken |
| **qa** | Reported through QA testing |
| **ux** | Design or usability issue |
| **verified** | Fix confirmed by tester |
| **needs-info** | More detail needed — check the issue for questions |

---

## Tips

- **Screenshots are worth 100 words.** Always include one if you can.
- **Exact steps matter.** "It didn't work" is hard to fix. "I tapped Save on the compose screen on iPhone Safari and the entry disappeared" is easy to fix.
- **Don't worry about duplicates.** If you're not sure whether something was already reported, report it anyway.
- **Severity is your judgment call.** There's no wrong answer — it just helps prioritize.
