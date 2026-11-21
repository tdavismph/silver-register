# SILVER Register

A home visit register for the SILVER program (healthy aging through home visitation in the Appalachian High Country of western North Carolina). It follows the pattern of the CBIO Cardiometabolic Disease Register and the CBIO+ Home Visit Register.

**Build 0.1.1. Example data only.** Every person, worker, clinic and community in the app is fictitious. Nothing is stored and nothing leaves the device; records entered are lost when the page is closed.

A version holding real patients would contain health information covered by HIPAA. Sign-in and a database will be added only after the clinic's compliance officer has confirmed the hosting, the written agreements required, and what congregational volunteers may see.

## Who uses it in this build

| Role | What the role does in the app |
| --- | --- |
| Clinic (billing practitioner) | To-do list (safety concerns, barriers a CHW found that need review, flags from volunteers), the Home-Visit Referral Checklist (version 4) as an intake form with routing and sign-off, patients, monthly billing with a CSV file for the billing office, reports |
| Community health worker (CHW) | Due list with the reason for each line, caseload against the limit of 15, a work record that logs minutes against each barrier, time log with the billable share of paid hours, episode handoff to the volunteer visitor |
| Administrator | Reports, billing, workers, settings |

The coordinator and volunteer visitor screens come in build 0.2, and quality checklists and the comparison of Care Groups after that.

## Rules built in

- **Checklist.** Steps 1 to 7 follow the SILVER Home-Visit Referral Checklist. Yes/no questions start unanswered and are required. A flagged barrier must be linked to an active condition. If the coverage check is not passed, a CHW episode cannot be chosen.
- **Episodes.** About 90 days, six home visits due on days 4, 15, 29, 46, 66 and 84, at most 15 patients per CHW at one time. All editable in Settings.
- **Billing (Medicare Community Health Integration).** G0019 for the first 60 countable minutes in a calendar month and G0022 for each further 30. Only minutes logged against a barrier in the plan count. Minutes on a barrier the CHW found later are held until the practitioner adds it to the plan. Travel, supervision, training and time not tied to a barrier are logged and never counted. Rates are $86.17 and $31.73 (2026 national figures from the SILVER pitch deck, not checked against the fee schedule). Whether the full 60 minutes must be reached before G0019 is billed has not been confirmed: ask the billing office.
- **Drafts for clinical review.** The CHW's blood pressure lines (report at 140/90, call the clinic at 180/120) and the safety protocol are placeholders written for this build.

## Files

- `index.html` is the whole app. `build.sh` joins `src/style.css`, `src/data.js` (rules, settings, example data) and `src/ui.js` (screens).
- `sw.js` keeps the app available offline. Change `VERSION` in it on every build, or tablets keep the old files.
- `test/run.js` opens every screen for every role at 390, 820 and 1100 pixels and runs the main flows (`PW=<path to playwright> node test/run.js`).

The example data is generated from a seeded random-number generator, so every visitor sees the same fictitious program in its eighth month.
