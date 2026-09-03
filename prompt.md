# Internship Documentation Build Plan

**Purpose of this file:** hand this to any AI assistant (with access to my project
source files) so it can produce my final internship report (.docx) and
presentation (.pptx) without needing the original template documents I used
for reference. Everything that AI needs to know is below.

---

## 1. Who this is for

- **Name:** Kotta Venkata Ratna Karthik
- **Roll No.:** 323103383035
- **Branch:** Computer Science & Engineering (Data Science), B.Tech, 4th year, VII Semester (for detail)
- **College:** Gayatri Vidya Parishad College of Engineering (Autonomous),
  Madhurawada, Visakhapatnam – 530048
- **Academic year:** 2026–2027
- **Team status:** SOLO — no team table, no other members' names/roll numbers
  anywhere in the document.
- **Mentor / Course Coordinator names:** NOT CONFIRMED. Insert placeholder
  text `"[MENTOR NAME — FOR REVIEW]"` and `"[COORDINATOR NAME — FOR REVIEW]"`
  wherever those names would appear (certificate page, acknowledgement). Do
  not invent names.
- **HOD:** Dr. Y. Anuradha, Professor & Head of CSE (Data Science) (same department,
  reuse as-is unless told otherwise).
- **Principal:** Dr. A.B. Koteswara Rao (reuse as-is unless told otherwise).

---

## 2. What this internship actually was

- **Certification body:** EduSkills Academy (AICTE / National Internship
  Portal), program **"Python Full Stack Development With Project"**, 8 weeks.
- **Certificate ID:** 2026-67401BE198, issued 16 Jun 2026.
- **Real tech stack:** FastAPI (Python backend) + React (frontend) +
  SQLAlchemy + PostgreSQL/DB integration + Redux/Zustand state management.
- **Cert's own capstone line:** "This content has to be decided or confirmed based on the whole project info and tech stack."

**My actual project (the case study of the report):**
- **Title:** StockPilot — Smart Inventory Management System
- **Detailed case-study content (problem statement, architecture, screenshots,
  results, conclusion) will be supplied separately** as project source files
  (a cleaned-up zip of `frontend/` and `backend/` folders, minus
  `node_modules`, `.venv`, build artifacts, caches — see Section 6 for the
  known clean method). **Do not fabricate case-study specifics — wait for
  that source material before writing Section 8 (Case Study) in detail.**
  Until it arrives, a placeholder outline is acceptable (see Section 5).

---

## 3. Source materials already available (attached separately)

1. `Course_Certificate_1388339.pdf` — my EduSkills internship certificate.
   Use this as the **sole source of truth** for: certificate title, module
   bullet list, issue date, certificate ID, signatory names (Mitu Swain,
   General Manager L&D, EduSkills).
2. `certificate_template.docx` — blank formatting template (fonts/layout
   base) — use for page setup only, not content.
3. `BATCH_13_CSE-2.pdf` — a **different student's** (friend's) full
   internship report on a completely different project ("SilentTalk:
   Real-Time Sign Language Communication System", TensorFlow/OpenCV/object
   detection). **This is a structural reference ONLY** — copy its document
   skeleton (section order, heading styles, ToC layout, certificate-page
   layout, acknowledgement wording style) but **none of its actual content**
   (no TensorFlow, no CNN diagrams, no sign-language material, no other
   student's names/roll numbers/certificates). Every figure, unit, and
   learning outcome in that file is domain-specific to *his* project and
   must be replaced with content relevant to FastAPI/React/StockPilot.
4. Formatting instructions image (from department/HOD) — see Section 4
   below for the extracted rules; the original image doesn't need to
   travel with this plan since the rules are fully captured.

---

## 4. Mandatory formatting rules (from HOD/department instructions)

1. A cover letter (signed by internship mentor after doc + execution
   approval) accompanies submission — separate from the report body.
2. **Font:** Times New Roman throughout.
   - Main headings: 16 pt, bold
   - Side headings: 14 pt, bold
   - Body text: 12 pt
3. Document must follow the structure of the attached sample project
   documentation (see Section 5 for the actual section order to use).
4. First pages (title page through Acknowledgement) must follow the same
   format/order as the sample.
5. **Module content order:** modules/units learned during the internship go
   **first**; the actual project + its execution/results are described
   **only in the Case Study section** near the end. (Reference: "take CSE
   mini project as reference" for this ordering pattern.)
6. Each embedded picture must have a **title and figure number**
   (e.g., "Fig 3.2: ...").
7. **Every paragraph: justified alignment.** Book must look neatly aligned;
   don't write single-line/one-sentence definitions — explain each module
   in proper detail (several sentences/paragraphs per topic).
8. **PPT:** 9–10 slides total.
   - 2–3 slides: introduction + modules learned in the internship
   - Remaining slides: case study (project) + screenshots of
     execution/results
9. **Abstract: exactly one single paragraph** (no sub-bullets, no line
   breaks).

---

## 5. Required document structure (skeleton to build, in order)

1. Title page (project title, "internship report submitted in partial
   fulfilment...", degree, branch, submitted by [solo], college seal/logo,
   mentor/coordinator names as placeholders, academic year)
2. Certificate/Bonafide page (department letterhead style, mentor +
   coordinator + HOD signature blocks — names as placeholders where unknown)
3. Acknowledgement (adapt the tone/structure from the reference doc, but
   write it as a first-person solo acknowledgement — thank mentor,
   coordinator, HOD, Principal, AICTE/EduSkills/Google, department staff;
   no co-author names)
4. Certificate of Internship page — reproduce content from
   `Course_Certificate_1388339.pdf` (EduSkills cert) as an embedded image
   or formatted text block
5. Abstract — ONE paragraph, rewritten for StockPilot / FastAPI+React stack
   (not TensorFlow — do not reuse the reference doc's abstract content)
6. Table of Contents — modules first, case study near the end, matching
   the actual section list below
7. **Modules 1–8 (or as many as needed)** — content must be original,
   written for a Python Full Stack (FastAPI + React) curriculum, but the
   **heading list must map onto the 9 bullet points printed on the actual
   certificate**, specifically:
   - Introduction to Full Stack Development & Project Setup + Python
     Fundamentals for Backend Development
   - Introduction to FastAPI for Backend APIs & Data Validation/Modeling
     with Pydantic
   - Introduction to React and Frontend Fundamentals & React Hooks/State
     Management
   - Building Reusable React Components & Styling + Integrating FastAPI
     Backend with React Frontend
   - Database Integration with FastAPI (SQLAlchemy) & Advanced FastAPI
     Features/Best Practices
   - Advanced React Patterns/State Management (Redux/Zustand) & Frontend
     Routing/Navigation
   - Building Forms in React/Handling User Input + Testing the Full Stack
     App + Deployment Strategies
   - API Design Principles/Best Practices + Frontend Best Practices/
     Performance Optimization
   (The exact number of module "units" and sub-headings does NOT need to
   match the reference doc's unit count — only the heading topics need to
   trace back to the certificate's bullet list above.)
   - Each module needs: objective, content explained in full paragraphs
     (justified, no bare bullet definitions), at least one relevant
     diagram/figure with a numbered caption, and a stated outcome.
8. **Case Study — StockPilot: Smart Inventory Management System**
   (placeholder until real project files arrive; structure to follow once
   supplied):
   - Project challenge & scope
   - Project overview / reasons to build it
   - System architecture & technology stack (FastAPI, React, SQLAlchemy,
     Redux/Zustand, PostgreSQL, etc. — confirm exact stack from source code)
   - Development process phases (mirror the reference doc's phase-by-phase
     style: setup → backend API → DB models → frontend → integration →
     testing → deployment)
   - Screenshots of execution/results (numbered figures) — from the
     project source, not fabricated
   - Limitations & future enhancements
   - Conclusion
9. References — swap out all TensorFlow/OpenCV/LabelImg links for
   equivalents relevant to this stack (official FastAPI docs, React docs,
   SQLAlchemy docs, Redux Toolkit docs, etc.)

---

## 6. Getting the project source to the document-building AI

I have a full-stack project (`frontend/` React app + `backend/` FastAPI app)
whose real code, screenshots, and results need to feed Section 8. The
raw project folder is too large to zip under typical upload limits because
of dependency folders. **Correct cleaning method (already tested and
confirmed to work):**



## 7. Deliverables expected from the document-building AI

1. `StockPilot_Internship_Report.docx` — full report per Sections 4–5 above.
2. `StockPilot_Internship_PPT.pptx` — 9–10 slides per Section 4, rule 8.
3. Both must use only StockPilot/FastAPI/React content — zero residue from
   the SilentTalk/TensorFlow reference document (names, project title,
   screenshots, diagrams, or unit content).

## 8. Open items (need my input before finalizing)

- Confirmed mentor / course coordinator names.
- Final case-study detail: problem statement, architecture diagram,
  screenshots, results, conclusion (from the cleaned project zip).
- Confirmation of exact backend DB (PostgreSQL vs SQLite) and any other
  stack specifics not visible from the certificate alone.