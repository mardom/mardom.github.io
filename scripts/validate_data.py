#!/usr/bin/env python3
"""Validate all JSON data files for mardom.github.io without external dependencies."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

REQUIRED_FILES = [
    "profile.json",
    "missions.json",
    "software.json",
    "publications.json",
    "career.json",
    "academic.json",
    "showcase.json",
]


def check_url(url: str, label: str, errors: list[str]) -> None:
    if not url:
        return
    if not (url.startswith("https://") or url.startswith("http://")):
        errors.append(f"{label}: URL must start with http:// or https:// (got {url!r})")


def load_json(name: str, errors: list[str]):
    path = DATA_DIR / name
    if not path.exists():
        errors.append(f"Missing required data file: {path}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Invalid JSON in {name}: {exc}")
        return None


def main() -> int:
    errors: list[str] = []
    data = {}

    for filename in REQUIRED_FILES:
        parsed = load_json(filename, errors)
        if parsed is not None:
            data[filename] = parsed

    if errors:
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        return 1

    # Validate profile.json
    profile = data["profile.json"]
    for key in ["name", "titles", "bio_paragraphs", "research_interests", "metrics", "news", "contact", "calendar", "links"]:
        if key not in profile:
            errors.append(f"profile.json missing key: {key}")
    for link_key, link_val in profile.get("links", {}).items():
        if link_key not in {"orcid_id", "twitter_handle"}:
            check_url(link_val, f"profile.links.{link_key}", errors)
    check_url(profile.get("calendar", {}).get("embed_url", ""), "profile.calendar.embed_url", errors)
    check_url(profile.get("calendar", {}).get("booking_url", ""), "profile.calendar.booking_url", errors)

    # Validate missions.json
    missions_data = data["missions.json"]
    missions = missions_data.get("missions", [])
    nodes = missions_data.get("network_nodes", [])
    arcs = missions_data.get("network_arcs", [])
    node_ids = {n.get("id") for n in nodes}
    for m in missions:
        for key in ["id", "name", "category", "period", "role", "summary"]:
            if not m.get(key):
                errors.append(f"missions.json mission {m.get('id', '?')} missing {key}")
        check_url(m.get("url", ""), f"mission {m.get('id')}.url", errors)
    for arc in arcs:
        if arc.get("from") not in node_ids or arc.get("to") not in node_ids:
            errors.append(f"missions.json arc references unknown node: {arc}")

    # Validate software.json
    software = data["software.json"]
    review = software.get("featured_review", {})
    for key in ["title", "subtitle", "status", "summary", "pillars", "roadmap"]:
        if not review.get(key):
            errors.append(f"software.json featured_review missing {key}")
    check_url(review.get("repo_url", ""), "featured_review.repo_url", errors)
    check_url(review.get("docs_url", ""), "featured_review.docs_url", errors)
    packages = software.get("packages", [])
    for pkg in packages:
        for key in ["name", "tagline", "description", "year", "language"]:
            if not pkg.get(key):
                errors.append(f"software.json package {pkg.get('name', '?')} missing {key}")
        check_url(pkg.get("repo_url", ""), f"package {pkg.get('name')}.repo_url", errors)
        check_url(pkg.get("paper_url", ""), f"package {pkg.get('name')}.paper_url", errors)

    # Validate publications.json
    pubs_data = data["publications.json"]
    pubs = pubs_data.get("publications", [])
    seen_ids = set()
    submitted_count = 0
    published_count = 0
    for pub in pubs:
        pid = pub.get("id")
        if not pid:
            errors.append(f"Publication missing id: {pub.get('title', '?')}")
        elif pid in seen_ids:
            errors.append(f"Duplicate publication id: {pid}")
        seen_ids.add(pid)
        for key in ["status", "year", "title", "authors", "venue"]:
            if not pub.get(key):
                errors.append(f"Publication {pid} missing {key}")
        if pub.get("status") == "submitted":
            submitted_count += 1
        elif pub.get("status") == "published":
            published_count += 1
        else:
            errors.append(f"Publication {pid} has invalid status: {pub.get('status')}")
        check_url(pub.get("code_url", ""), f"pub {pid}.code_url", errors)

    # Validate career.json
    career = data["career.json"]
    for key in ["positions", "education", "grants", "honors", "governance", "evaluation", "visiting", "memberships"]:
        if not career.get(key):
            errors.append(f"career.json missing or empty: {key}")

    # Validate academic.json
    academic = data["academic.json"]
    for key in ["teaching", "mentoring", "conferences_organized", "invited_talks", "contributed_talks", "outreach"]:
        if not academic.get(key):
            errors.append(f"academic.json missing or empty: {key}")

    # Validate showcase.json
    showcase = data["showcase.json"]
    ml_projects = showcase.get("applied_ml_projects", [])
    photographs = showcase.get("photographs", [])
    if not ml_projects:
        errors.append("showcase.json missing or empty: applied_ml_projects")
    for proj in ml_projects:
        for key in ["id", "title", "period", "status", "role", "description"]:
            if not proj.get(key):
                errors.append(f"showcase.json applied_ml_projects {proj.get('id', '?')} missing {key}")
        check_url(proj.get("url", ""), f"applied_ml {proj.get('id')}.url", errors)
    for photo in photographs:
        for key in ["id", "title", "category"]:
            if not photo.get(key):
                errors.append(f"showcase.json photograph {photo.get('id', '?')} missing {key}")

    if errors:
        for err in errors:
            print(f"ERROR: {err}", file=sys.stderr)
        return 1

    bundle_path = DATA_DIR / "bundle.js"
    bundle_payload = {
        "profile": profile,
        "missions": missions_data,
        "software": software,
        "publications": pubs_data,
        "career": career,
        "academic": academic,
        "showcase": showcase,
    }
    bundle_content = (
        "// Auto-generated by scripts/validate_data.py for offline file:// viewing\n"
        f"window.__MARDOM_DATA__ = {json.dumps(bundle_payload, ensure_ascii=False)};\n"
    )
    bundle_path.write_text(bundle_content, encoding="utf-8")

    print(
        "Validation OK: "
        f"{len(missions)} missions, {len(nodes)} network nodes, {len(arcs)} arcs, "
        f"{len(packages)} software packages, {len(ml_projects)} applied ML projects, "
        f"{len(photographs)} gallery entries, "
        f"{len(pubs)} publications ({submitted_count} submitted, {published_count} published), "
        f"{len(career['positions'])} positions, {len(career['grants'])} grants, "
        f"{len(academic['teaching'])} teaching entries, {len(academic['invited_talks'])} invited talks. "
        f"Updated {bundle_path.name}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
