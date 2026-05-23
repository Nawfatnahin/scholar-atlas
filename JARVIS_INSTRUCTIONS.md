# Jarvis — Version Management Instructions

Every time you make a meaningful update to Scholar Atlas, 
you MUST do all of the following before finishing the task:

## Step 1 — Decide the version number
Use semantic versioning (semver):
  MAJOR.MINOR.PATCH
  
  PATCH (e.g. 1.0.0 → 1.0.1): bug fixes, style tweaks, 
    copy changes, no new features
  MINOR (e.g. 1.0.0 → 1.1.0): new feature added, 
    existing feature extended
  MAJOR (e.g. 1.0.0 → 2.0.0): major redesign, breaking 
    database changes, full page rewrites

## Step 2 — Update lib/version.ts
Change the `current` field to the new version number.
Change `releaseDate` to today's date (ISO format).

## Step 3 — Update lib/changelog.ts
Prepend a new VersionEntry object at the TOP of the 
CHANGELOG array (index 0). Fill in all fields accurately.
Do not delete old entries — only add to the top.

## Step 4 — Update CHANGELOG.md
Add a new section at the top following the Keep a Changelog 
format. List every file changed under the correct heading 
(Added / Changed / Fixed / Removed / Technical).

## Step 5 — Create .version-history/v{X.Y.Z}.md
Copy the template from the most recent file in that folder.
Update every section to reflect the NEW state of the app:
  - List ALL current routes (not just new ones)
  - List ALL current DB tables and their columns
  - List ALL key components
  - Write rollback instructions specific to this version
  - Log any known issues discovered during this update

## Step 6 — Git tag (if git is available)
Run: git tag v{X.Y.Z}
Run: git add -A && git commit -m "chore: release v{X.Y.Z}"

## ROLLBACK PROCEDURE
If a version causes errors and needs to be reverted:
1. Open .version-history/ and find the last stable version file
2. Read the "Rollback Instructions" section in that file
3. Run: git checkout v{last-stable-version}
4. Revert lib/version.ts and lib/changelog.ts to match that 
   version's data
5. Do NOT delete the broken version file from .version-history/ 
   — add a "BROKEN" note at the top of that file instead
