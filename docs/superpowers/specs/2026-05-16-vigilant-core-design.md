# Design Specification: Operation VIGILANT CORE

**Date:** 2026-05-16  
**Project:** JARVIS Semi-Autonomous Intelligence (Phase 1)  
**Codename:** VIGILANT CORE  
**Status:** DESIGN  

## 1. Executive Summary
Operation VIGILANT CORE introduces the first layer of proactive intelligence into the JARVIS ecosystem. It establishes a background monitoring service designed to identify technical debt, security risks, and system anomalies in real-time. By operating independently of the main command-line loop, it ensures constant guardianship over Sir's infrastructure without impacting performance or focus.

## 2. Architecture & Lifecycle
The system utilizes a **Core-Managed Subprocess** architecture to ensure isolation and stability.

- **Module:** `JARVIS/core/vigilant_core.py`
- **Execution:** Spawned by the central `jarvis.py` core during initiation.
- **Persistence:** Runs as a non-blocking background process.
- **Interval:** Executes a comprehensive system audit every **30 minutes**.
- **Shutdown:** Receives a termination signal from the parent core during the `/exit` protocol to ensure clean resource cleanup.

## 3. Monitoring Intelligence
The audit intelligence is divided into three distinct sectors:

### Sector 1: Security Audit
- **Credential Scanning:** Constant vigilance for hardcoded API keys, secrets, or tokens in the `JARVIS/` and `Websites/` directories.
- **Policy Verification:** Auditing Supabase SQL policies (RLS) to ensure no unshielded tables are exposed.
- **Vulnerability Detection:** Identifying known vulnerable patterns or antiquated logic in both Python and JavaScript modules.

### Sector 2: Architectural Integrity
- **Complexity Analysis:** Identifying files exceeding the 500-line complexity threshold or containing excessive "TODO/FIXME" debt.
- **Redundancy Detection:** Mapping module dependencies to identify unused components or redundant logic branches.
- **Convention Enforcement:** Ensuring all modules adhere to the JARVIS OS Persona Mandates.

### Sector 3: System Health
- **Resource Profiling:** Monitoring CPU and RAM usage to identify memory leaks or runaway processes.
- **Log Analysis:** Scanning `JARVIS/logs/` for recurring critical anomalies or failure patterns.

## 4. Alerting & Communication
Communication of detected risks is governed by Sir's preference for **Immediate Vocal Alerting**.

- **Priority:** High-priority anomalies trigger an immediate vocal transmission via the `SILENT VELOCITY` protocol.
- **Synchronization:** Detailed findings are logged to the current session log and synchronized as console status updates.
- **Categorization:**
    - `⚠ ADVISORY`: Non-critical debt or health warnings.
    - `✖ CRITICAL`: Security risks or imminent system threats requiring Sir's immediate intervention.

## 5. Performance Constraints
- **Low Priority:** The subprocess is executed with reduced system priority to ensure zero latency impact on Sir's active development.
- **Asynchronous Execution:** All audit tasks are performed asynchronously to minimize the footprint of the monitoring cycle.

## 6. Success Criteria
- [ ] VIGILANT CORE spawns successfully alongside the main core.
- [ ] 30-minute periodic audit executes without blocking user input.
- [ ] Detection of a simulated security risk triggers a vocal alert within 5 seconds of the audit cycle.
- [ ] All findings are accurately serialized to the session logs.
