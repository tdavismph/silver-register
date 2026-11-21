# SILVER Register

A home visit register for the SILVER program (healthy aging through home visitation in the Appalachian High Country of western North Carolina). It follows the pattern of the CBIO Cardiometabolic Disease Register and the CBIO+ Home Visit Register.

**Build 0.2. Example data only.** Every person, worker, clinic and community in the app is fictitious. Nothing is stored and nothing leaves the device; records entered are lost when the page is closed.

A version holding real patients would contain health information covered by HIPAA. Sign-in and a database will be added only after the clinic's compliance officer has confirmed the hosting, the written agreements required, and what congregational volunteers may see.

## Who uses it in this build

| Role | What the role does in the app |
| --- | --- |
| Clinic (billing practitioner) | To-do list (safety concerns, barriers a CHW found that need review, flags sent on by the coordinator, vaccine gaps), the Home-Visit Referral Checklist (version 4) as an intake form with routing and sign-off, patients, monthly billing with a CSV file for the billing office, reports |
| Community health worker (CHW) | Due list with the reason for each line, caseload against the limit of 15, a work record that logs minutes against each barrier, time log with the billable share of paid hours, episode handoff to the volunteer visitor |
| Volunteer visitor | Due list with the reason for each line, My elders, the monthly visit (blood pressure, three questions asked every visit, and the checks that are due), My results |
| Coordinator | Flags to review and route, Care Groups and their monthly meetings, the work list for the church handyman teams, the volunteer tier report with Care Groups compared |
| Administrator | Reports, volunteer tier report, billing, workers, settings |

Quality checklists for home visits come in a later build.

## Rules built in

- **Checklist.** Steps 1 to 7 follow the SILVER Home-Visit Referral Checklist. Yes/no questions start unanswered and are required. A flagged barrier must be linked to an active condition. If the coverage check is not passed, a CHW episode cannot be chosen.
- **Episodes.** About 90 days, six home visits due on days 4, 15, 29, 46, 66 and 84, at most 15 patients per CHW at one time. All editable in Settings.
- **Billing (Medicare Community Health Integration).** G0019 for the first 60 countable minutes in a calendar month and G0022 for each further 30. Only minutes logged against a barrier in the plan count. Minutes on a barrier the CHW found later are held until the practitioner adds it to the plan. Travel, supervision, training and time not tied to a barrier are logged and never counted. Rates are $86.17 and $31.73 (2026 national figures from the SILVER pitch deck, not checked against the fee schedule). Whether the full 60 minutes must be reached before G0019 is billed has not been confirmed: ask the billing office.
- **The volunteer's checks.** Home safety (12 items, from the CDC's Check for Safety), heating (10), cooling (6), vaccines (5), vision (5) and hearing (5), as agreed on November 21, 2026, plus the PHQ-2 mood questions and the Hunger Vital Sign every three months. Yes is the safe answer on every check item except the first hearing question. Each check falls due by season or interval, and the volunteer may defer one to the next visit.
- **Flags.** The volunteer records; the app decides what is passed up. Urgent flags (a very high reading, no heat, a positive mood score, a change in sight, a safety concern) go to the coordinator the same day. The rest wait for the monthly review. Vaccine gaps go straight to the clinic as one table. A routine flag is not repeated while one of the same kind is open, and is not sent to the clinic for a person seen there in the last 30 days.
- **Drafts for clinical review.** The blood pressure lines (140/90 and 180/120), the safety protocol, and the wording of the checks are drafts.

## Files

- `index.html` is the whole app. `build.sh` joins `src/style.css`, `src/data.js` (rules, settings, example data), `src/vol.js` (the volunteer tier) and `src/ui.js` (screens).
- `sw.js` keeps the app available offline. Change `VERSION` in it on every build, or tablets keep the old files.
- `test/run.js` opens every screen for every role at 390, 820 and 1100 pixels and runs the main flows (`PW=<path to playwright> node test/run.js`).

The example data is generated from a seeded random-number generator, so every visitor sees the same fictitious program in its eighth month.
