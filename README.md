# Dr. Mariano J. de León Domínguez Romero — `mardom.github.io`

**Live Website:** [https://mardom.github.io/](https://mardom.github.io/)

Personal academic website built as a **zero-build static site** for GitHub Pages. All content is driven by clean JSON files in [`data/`](data/), so you can update any section directly from the GitHub web editor or locally in seconds without Node, Jekyll, or build steps.

---

## Quick Guide: Updating Your Website

You can edit any file under `data/` directly on GitHub (`Edit this file` → `Commit changes`), and GitHub Pages updates automatically within ~30–60 seconds.

| File | What it controls |
| :--- | :--- |
| [`data/profile.json`](data/profile.json) | Name, titles, bio, research interests, NASA/ADS metrics, recent news, email, Google Calendar & external links |
| [`data/missions.json`](data/missions.json) | Astronomical missions/observatories and the interactive global collaboration & visiting map |
| [`data/software.json`](data/software.json) | Featured **Astrophysical Software Review** section + open-source packages (`Pontifex`, `Skykatana`, `νGundam`, `Corral`, etc.) |
| [`data/publications.json`](data/publications.json) | Complete list of submitted and published articles, proceedings, DOIs, arXiv links, and topic tags |
| [`data/career.json`](data/career.json) | Positions, education, grants, honors, governance, visiting scientist appointments, peer review, memberships |
| [`data/academic.json`](data/academic.json) | Teaching, DiploDatos, postdoc/Ph.D./undergraduate mentoring (with alumni current-position links), conferences organized, talks, outreach |
| [`data/showcase.json`](data/showcase.json) | Applied ML & HPC infrastructure projects (TALASA, ULS FRC HPC/AI cluster, etc.) and the Photographs gallery |

---

## Common Customizations

### 1. Update Your Portrait Photo, Photographs Gallery & Downloadable CV (PDF)
- **Portrait photo**: Located at [`assets/images/profile.jpg`](assets/images/profile.jpg) and used as both the hero portrait and navbar emblem.
- **Photographs gallery**: Copy new `.jpg`/`.webp` photos into `assets/images/photos/` and add or update entries in `"photographs"` inside [`data/showcase.json`](data/showcase.json).
- **Applied ML projects**: Add or reorder projects in `"applied_ml_projects"` inside [`data/showcase.json`](data/showcase.json).
- **CV PDF**: Copy your CV PDF to `assets/CV_Mariano_Dominguez.pdf` and set `"cv_pdf": "assets/CV_Mariano_Dominguez.pdf"` in [`data/profile.json`](data/profile.json). A **Download CV (PDF)** button will appear in the hero automatically.

### 2. Update the Astrophysical Software Review
Edit the `"featured_review"` object in [`data/software.json`](data/software.json):
- Add your GitHub repo or preprint link to `"repo_url"` and `"docs_url"`.
- Update `"status"`, `"collaborators"`, `"pillars"`, or `"roadmap"` stages (`"done"`, `"active"`, `"upcoming"`).

### 3. Configure Google Calendar & Booking Link
In [`data/profile.json`](data/profile.json) under `"calendar"`:
- **`embed_url`**: Uses `mariano.dominguez@unc.edu.ar` in timezone `America/Argentina/Cordoba`. Make sure your Google Calendar's public sharing or specific calendar ID is enabled in Google Calendar Settings → *Access permissions for events* if you want visitors to see busy/free blocks inline.
- **`booking_url`**: Currently opens a pre-filled Google Calendar meeting invite to `mariano.dominguez@unc.edu.ar`. If you create a Google Calendar **Appointment Schedule**, simply paste your `https://calendar.app.google/...` link into `"booking_url"`.

### 4. Add Google Scholar / ResearchGate / LinkedIn Links
In [`data/profile.json`](data/profile.json) under `"links"`, paste your full URL into `"google_scholar"`, `"researchgate"`, or `"linkedin"`. Empty links are automatically hidden until filled.

---

## Local Preview & Validation

`index.html` works directly when opened via `file://` (double-clicking the file) thanks to `data/bundle.js`, or via a local HTTP server:

```bash
# Validate all JSON data files and refresh data/bundle.js for file:// preview
python3 scripts/validate_data.py

# Preview locally at http://localhost:8000
python3 -m http.server 8000
```
