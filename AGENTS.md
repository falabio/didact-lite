<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Canonical Database Architecture
- **Single Source of Truth**: `lesson-planner-app/questions.db` (synchronized with `lesson-planner-lite/questions.db`).
- **Total Verified Questions**: 8,519 records across 19 subjects.
- **Year Coverage**: Continuous 2018–2025 without gaps (Latest year: 2025 with 1,265 questions).
- **Prohibition**: Never query or create outdated `.bak` partial databases.
- **Verification**: Run `python ../verify_database.py` to audit database integrity.

