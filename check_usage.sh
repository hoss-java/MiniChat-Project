#!/bin/bash

# Direct check: What logs are actually available?

DAYS_BACK=7

echo "======================================"
echo "System Log Availability Check"
echo "======================================"
echo ""

# Check 1: Auth logs
echo "=== 1. Check /var/log/auth.log ==="
if [ -f /var/log/auth.log ]; then
    echo "✓ Auth log exists"
    echo "Size: $(wc -l < /var/log/auth.log) lines"
    echo "Date range:"
    head -1 /var/log/auth.log | awk '{print $1, $2, $3}'
    echo "to"
    tail -1 /var/log/auth.log | awk '{print $1, $2, $3}'
    echo ""
else
    echo "✗ No auth.log found"
fi

# Check 2: Syslog
echo "=== 2. Check /var/log/syslog ==="
if [ -f /var/log/syslog ]; then
    echo "✓ Syslog exists"
    echo "Size: $(wc -l < /var/log/syslog) lines"
    echo "Date range:"
    head -1 /var/log/syslog | awk '{print $1, $2, $3}'
    echo "to"
    tail -1 /var/log/syslog | awk '{print $1, $2, $3}'
    echo ""
else
    echo "✗ No syslog found"
fi

# Check 3: Journalctl
echo "=== 3. Check journalctl (systemd logs) ==="
JOURNAL_COUNT=$(journalctl --no-pager 2>/dev/null | wc -l)
echo "Total entries: $JOURNAL_COUNT lines"
journalctl --no-pager 2>/dev/null | head -1
echo "..."
journalctl --no-pager 2>/dev/null | tail -1
echo ""

# Check 4: What data is ACTUALLY in logs for past 7 days?
echo "=== 4. Activity Found in Last 7 Days ==="
echo ""

echo "Suspend/Resume events:"
journalctl --since "$DAYS_BACK days ago" --no-pager 2>/dev/null | grep -iE "suspend|resume|sleep|wake" | wc -l

echo "Input/Keyboard events:"
journalctl --since "$DAYS_BACK days ago" --no-pager 2>/dev/null | grep -iE "input|EV_KEY|keyboard|mouse" | wc -l

echo "Session events:"
grep "session" /var/log/auth.log 2>/dev/null | tail -5

echo ""
echo "=== 5. System Uptime (Last Boot) ==="
uptime -s
echo ""
uptime -p
echo ""

echo "======================================"
echo "RECOMMENDATION:"
echo "======================================"
echo ""
echo "Your logs are NOT capturing detailed user activity."
echo "Try one of these SOLUTIONS:"
echo ""
echo "Option A: Enable detailed logging"
echo "  sudo systemctl set-environment SYSTEMD_LOG_LEVEL=debug"
echo ""
echo "Option B: Use a proper activity tracker"
echo "  sudo apt install activitywatch"
echo "  OR"
echo "  sudo apt install gnome-usage"
echo ""
echo "Option C: Manual tracking with timestamp"
echo "  Create file: ~/.work_log"
echo "  Each session add: echo 'START: \$(date)' >> ~/.work_log"
echo "  When done: echo 'END: \$(date)' >> ~/.work_log"
echo ""
