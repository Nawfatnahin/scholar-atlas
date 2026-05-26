# Spec: 3D Aesthetic Attendance Subject Cards

**Goal:** Replace the transparent/glassmorphism "backlogger" look of the Attendance Tracker subject cards with a modern, 3D aesthetic box that aligns with the premium Scholar Atlas theme.

**Architecture & Aesthetic:**
- **Base Layer:** Solid background matching the theme's parchment/dark surfaces (no transparency).
- **3D Depth:** Multi-layered box shadows to create a "tactical elevation" effect.
- **Lighting:** Subtle top-lighting gradients to simulate a physical surface.
- **Interactive:** Hover states with vertical translation and shadow expansion to emphasize 3D space.
- **Borders:** High-contrast internal borders and a refined left-accent health indicator.

**Technical Changes:**

1. **File:** `My Websites/scholar-atlas/src/components/attendance/SubjectCard.tsx`
   - Modify the container classes:
     - Remove: `bg-bg-surface/70 backdrop-blur-xl border-y border-r shadow-[0_10px_30px_rgba(0,0,0,0.02)]`
     - Add: `bg-bg-surface dark:bg-bg-elevated border border-border-strong shadow-[0_8px_0_rgba(0,0,0,0.05)] dark:shadow-[0_8px_0_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_12px_0_rgba(0,0,0,0.08)] transition-all duration-300`
   - Refine internal spacing and typography for the "Scholar Atlas" premium look.

2. **Integration:**
   - Ensure the `healthColors` and `dotColors` remain functional but visually integrated with the new solid background.

3. **Git:**
   - Push changes to the repository after verification.

**Verification:**
- Visual inspection of the 3D depth effect in both light and dark modes.
- Verify hover transitions are smooth and tactile.
- Confirm build stability.
