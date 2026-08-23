"""
BloodLink SMTP Diagnostic Script.

Run from the backend/ directory:
    python scripts/test_email.py [recipient@example.com]

Prints a safe diagnostic without ever logging passwords or secrets.
Exits with code 0 on success, 1 on failure.
"""
import sys
import os
import smtplib

# Allow importing from app/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.services.email_service import _is_smtp_configured, send_verification_email

OK   = "\033[32m✓ PASS\033[0m"
FAIL = "\033[31m✗ FAIL\033[0m"
WARN = "\033[33m⚠ WARN\033[0m"


def check(label: str, ok: bool, detail: str = "") -> bool:
    icon = OK if ok else FAIL
    line = f"  {icon}  {label}"
    if detail:
        line += f"  [{detail}]"
    print(line)
    return ok


def run():
    print("\nBloodLink SMTP Diagnostic")
    print("=" * 50)

    # 1. Config presence
    host_ok = bool((settings.SMTP_HOST or "").strip())
    port_ok = int(settings.SMTP_PORT or 0) in (587, 465, 25)
    user_ok = bool((settings.SMTP_USERNAME or "").strip()) and "@" in (settings.SMTP_USERNAME or "")
    pass_ok = bool((settings.SMTP_PASSWORD or "").strip()) and \
              (settings.SMTP_PASSWORD or "").strip() not in ("YOUR_GMAIL_APP_PASSWORD", "your_app_password")

    print("\n[1] Configuration")
    check("SMTP_HOST configured",     host_ok, settings.SMTP_HOST or "not set")
    check("SMTP_PORT configured",     port_ok, str(settings.SMTP_PORT))
    check("SMTP_USERNAME configured", user_ok,
          f"{'@' in (settings.SMTP_USERNAME or '') and 'valid format' or 'missing @ sign'}")
    check("SMTP_PASSWORD configured", pass_ok, "value present (not shown)")

    if not all([host_ok, port_ok, user_ok, pass_ok]):
        print(f"\n  {FAIL} SMTP is not fully configured. Fix the above and retry.")
        print("  See backend/.env.example for required variables.")
        sys.exit(1)

    # 2. Network connection
    print("\n[2] SMTP Connection")
    try:
        smtp = smtplib.SMTP(settings.SMTP_HOST, int(settings.SMTP_PORT), timeout=15)
        smtp.ehlo()
        check("TCP connection to SMTP server", True,
              f"{settings.SMTP_HOST}:{settings.SMTP_PORT}")
    except OSError as e:
        check("TCP connection to SMTP server", False, str(e))
        print(f"\n  {FAIL} Cannot reach SMTP server. Check host/port and firewall.")
        sys.exit(1)

    # 3. STARTTLS
    print("\n[3] STARTTLS")
    try:
        smtp.starttls()
        smtp.ehlo()
        check("STARTTLS negotiated", True)
    except smtplib.SMTPException as e:
        check("STARTTLS negotiated", False, str(e))
        smtp.quit()
        sys.exit(1)

    # 4. Authentication
    print("\n[4] Authentication")
    try:
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        check("SMTP login succeeded", True)
    except smtplib.SMTPAuthenticationError as e:
        check("SMTP login succeeded", False,
              "Invalid credentials — use a Gmail App Password, not your normal password")
        print(f"\n  {FAIL} Authentication failed:")
        print("  1. Enable 2-Step Verification on your Google account")
        print("  2. Create an App Password at: https://myaccount.google.com/apppasswords")
        print("  3. Paste the 16-character App Password (without spaces) into SMTP_PASSWORD")
        smtp.quit()
        sys.exit(1)
    except Exception as e:
        check("SMTP login succeeded", False, str(e))
        smtp.quit()
        sys.exit(1)

    # 5. Send test email
    recipient = sys.argv[1] if len(sys.argv) > 1 else settings.SMTP_USERNAME
    print(f"\n[5] Test Email → {recipient}")

    smtp.quit()

    # Use the real service function
    import secrets
    dummy_token = secrets.token_urlsafe(32)
    sent = send_verification_email(recipient, "BloodLink Test", dummy_token)

    if sent:
        check(f"Verification email accepted by SMTP", True, recipient)
        print(f"\n  {OK} Email accepted by SMTP server.")
        print(f"  Check inbox/spam at: {recipient}")
    else:
        check(f"Verification email accepted by SMTP", False, recipient)
        print(f"\n  {FAIL} Email send failed — check backend logs above.")
        sys.exit(1)

    print("\n" + "=" * 50)
    print(f"  {OK} All SMTP checks passed.")
    print()
    sys.exit(0)


if __name__ == "__main__":
    run()
