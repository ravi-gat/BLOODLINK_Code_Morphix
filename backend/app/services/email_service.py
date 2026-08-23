"""
BloodLink Email Service — Real SMTP delivery via Gmail.

Uses Python's standard smtplib with STARTTLS.
Requires Gmail App Password (NOT your regular Gmail password).

Configuration (backend/.env):
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USERNAME=your-address@gmail.com
    SMTP_PASSWORD=xxxx xxxx xxxx xxxx   ← 16-char App Password
    SMTP_FROM_EMAIL=your-address@gmail.com
    SMTP_FROM_NAME=BloodLink Healthcare Network
    FRONTEND_URL=http://localhost:5173

NEVER log SMTP_PASSWORD. NEVER expose credentials in error responses.
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Optional

from ..core.config import settings

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# SMTP configuration helpers
# ---------------------------------------------------------------------------

def _is_smtp_configured() -> bool:
    """
    Return True only if SMTP credentials look real (non-placeholder).
    Does NOT test the actual connection — call _smtp_connect() for that.
    """
    host = (settings.SMTP_HOST or "").strip()
    user = (settings.SMTP_USERNAME or "").strip()
    pwd  = (settings.SMTP_PASSWORD or "").strip()

    placeholders = {
        "", "YOUR_GMAIL_ADDRESS", "your-email@gmail.com",
        "YOUR_GMAIL_APP_PASSWORD", "your_app_password",
    }
    return (
        bool(host) and
        user not in placeholders and
        pwd  not in placeholders and
        "@" in user
    )


def _smtp_connect() -> smtplib.SMTP:
    """
    Open an authenticated SMTP/STARTTLS connection.

    Raises smtplib.SMTPException (or a sub-class) on any failure.
    The caller is responsible for closing the connection.
    """
    host = settings.SMTP_HOST or "smtp.gmail.com"
    port = int(settings.SMTP_PORT or 587)
    user = (settings.SMTP_USERNAME or "").strip()
    pwd  = (settings.SMTP_PASSWORD or "").strip()

    logger.info(
        f"[EmailService] Connecting to {host}:{port} "
        f"(user configured: {bool(user)}, password configured: {bool(pwd)})"
    )

    smtp = smtplib.SMTP(host, port, timeout=15)
    smtp.ehlo()
    smtp.starttls()
    smtp.ehlo()
    smtp.login(user, pwd)
    return smtp


def _send_message(to_email: str, subject: str, html_body: str, text_body: str) -> bool:
    """
    Build and dispatch a multipart email.
    Returns True on success, False on failure.
    Never raises — all exceptions are caught and logged safely.
    """
    from_email = (settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME or "").strip()
    from_name  = (settings.SMTP_FROM_NAME or "BloodLink").strip()

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = formataddr((from_name, from_email))
    msg["To"]      = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html",  "utf-8"))

    try:
        smtp = _smtp_connect()
        try:
            smtp.sendmail(from_email, [to_email], msg.as_bytes())
            logger.info(f"[EmailService] Email accepted by SMTP server for: {to_email}")
            return True
        finally:
            try:
                smtp.quit()
            except Exception:
                pass
    except smtplib.SMTPAuthenticationError:
        logger.error(
            "[EmailService] SMTP authentication failed. "
            "Verify SMTP_USERNAME and SMTP_PASSWORD (App Password required for Gmail). "
            "Credentials not logged for security."
        )
    except smtplib.SMTPConnectError as exc:
        logger.error(f"[EmailService] SMTP connection error to {settings.SMTP_HOST}:{settings.SMTP_PORT}: {exc}")
    except smtplib.SMTPRecipientsRefused:
        logger.error(f"[EmailService] Recipient refused: {to_email}")
    except smtplib.SMTPException as exc:
        logger.error(f"[EmailService] SMTP error: {type(exc).__name__}: {exc}")
    except OSError as exc:
        logger.error(
            f"[EmailService] Network error connecting to "
            f"{settings.SMTP_HOST}:{settings.SMTP_PORT}: {exc}"
        )
    except Exception as exc:
        logger.error(f"[EmailService] Unexpected error sending email: {type(exc).__name__}: {exc}")

    return False


# ---------------------------------------------------------------------------
# HTML email templates
# ---------------------------------------------------------------------------

_BASE_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{subject}</title>
  <style>
    body  {{ font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
             background:#f4f4f5; margin:0; padding:0; }}
    .wrap {{ max-width:560px; margin:32px auto; background:#ffffff;
             border-radius:16px; overflow:hidden;
             box-shadow:0 1px 6px rgba(0,0,0,.08); }}
    .hdr  {{ background:#dc2626; padding:28px 32px; text-align:center; }}
    .hdr h1 {{ color:#fff; margin:0; font-size:22px; letter-spacing:-.3px; }}
    .hdr p  {{ color:rgba(255,255,255,.80); margin:4px 0 0; font-size:13px; }}
    .body {{ padding:32px; }}
    .body h2 {{ font-size:18px; color:#111827; margin:0 0 8px; }}
    .body p  {{ font-size:14px; color:#374151; line-height:1.65; margin:0 0 16px; }}
    .btn  {{ display:inline-block; background:#dc2626; color:#ffffff !important;
             font-weight:700; font-size:15px; padding:14px 32px;
             border-radius:10px; text-decoration:none; margin:8px 0 20px; }}
    .url  {{ font-size:12px; color:#6b7280; word-break:break-all; }}
    .notice {{ background:#fef9c3; border-left:3px solid #eab308;
               border-radius:6px; padding:10px 14px;
               font-size:12px; color:#713f12; margin-top:12px; }}
    .ftr  {{ background:#f9fafb; padding:20px 32px; text-align:center;
             font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb; }}
    .ftr a {{ color:#9ca3af; }}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>&#x1F7E5; BloodLink</h1>
      <p>Healthcare Blood Donation Network</p>
    </div>
    <div class="body">
      {body_content}
    </div>
    <div class="ftr">
      &copy; BloodLink Healthcare Network &nbsp;&bull;&nbsp;
      Powered by <strong>Code Morphix</strong><br />
      This email was sent to {to_email}. If you did not request this, you can safely ignore it.
    </div>
  </div>
</body>
</html>
"""


def _verification_html(name: str, verify_url: str, to_email: str) -> str:
    body = f"""\
      <h2>Verify your BloodLink account</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>
        Thank you for registering with BloodLink Healthcare Network.
        To activate your account and start using the platform, please verify your
        email address by clicking the button below.
      </p>
      <p style="text-align:center">
        <a href="{verify_url}" class="btn">Verify Email Address</a>
      </p>
      <p class="url">Or copy this link into your browser:<br />{verify_url}</p>
      <div class="notice">
        This verification link will expire in <strong>24 hours</strong>.
        If you did not create a BloodLink account, you can safely ignore this email.
      </div>
"""
    return _BASE_HTML.format(
        subject="Verify your BloodLink account",
        body_content=body,
        to_email=to_email,
    )


def _verification_text(name: str, verify_url: str) -> str:
    return f"""\
BloodLink Healthcare Network
─────────────────────────────
Hello {name},

Thank you for registering with BloodLink.
Please verify your email address by visiting:

  {verify_url}

This link expires in 24 hours.

If you did not create a BloodLink account, please ignore this email.

─────────────────────────────
Powered by Code Morphix
"""


def _password_reset_html(name: str, reset_url: str, to_email: str) -> str:
    body = f"""\
      <h2>Reset your BloodLink password</h2>
      <p>Hello <strong>{name}</strong>,</p>
      <p>
        We received a request to reset the password for your BloodLink account.
        Click the button below to create a new password.
      </p>
      <p style="text-align:center">
        <a href="{reset_url}" class="btn">Reset Password</a>
      </p>
      <p class="url">Or copy this link into your browser:<br />{reset_url}</p>
      <div class="notice">
        This link expires in <strong>30 minutes</strong>.
        If you did not request a password reset, your account is safe — ignore this email.
      </div>
"""
    return _BASE_HTML.format(
        subject="Reset your BloodLink password",
        body_content=body,
        to_email=to_email,
    )


def _password_reset_text(name: str, reset_url: str) -> str:
    return f"""\
BloodLink Healthcare Network
─────────────────────────────
Hello {name},

We received a password reset request for your BloodLink account.
Visit this link to reset your password (expires in 30 minutes):

  {reset_url}

If you did not request a password reset, please ignore this email.

─────────────────────────────
Powered by Code Morphix
"""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def send_verification_email(to_email: str, user_name: str, token: str) -> bool:
    """
    Dispatch a real verification email.

    Returns True when the SMTP server accepted the message.
    Returns False (and logs diagnostics) on any failure.

    Logs the verification URL at INFO level when SMTP is not configured,
    so developers can manually verify accounts during local testing.
    """
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    if not _is_smtp_configured():
        logger.warning(
            "[EmailService] SMTP not configured — verification email NOT sent. "
            f"To verify account manually (DEV ONLY), visit: {verify_url}"
        )
        # In development with no SMTP, return True so registration does not
        # fail — the admin can activate the account directly in the DB or
        # via the log URL above.
        return False

    html = _verification_html(user_name, verify_url, to_email)
    text = _verification_text(user_name, verify_url)
    result = _send_message(to_email, "Verify your BloodLink account", html, text)
    if result:
        logger.info(f"[EmailService] Verification email dispatched to {to_email}")
    else:
        logger.error(f"[EmailService] Failed to send verification email to {to_email}")
    return result


def send_password_reset_email(
    to_email: str,
    user_name: str,
    token: str,
    otp_code: Optional[str] = None,
) -> bool:
    """
    Dispatch a real password reset email.

    otp_code parameter is accepted for API compatibility but is not
    used in the current email template (token-based reset is sufficient).
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    if not _is_smtp_configured():
        logger.warning(
            "[EmailService] SMTP not configured — password reset email NOT sent. "
            f"Reset URL (DEV ONLY): {reset_url}"
        )
        return False

    html = _password_reset_html(user_name, reset_url, to_email)
    text = _password_reset_text(user_name, reset_url)
    result = _send_message(to_email, "Reset your BloodLink password", html, text)
    if result:
        logger.info(f"[EmailService] Password reset email dispatched to {to_email}")
    else:
        logger.error(f"[EmailService] Failed to send password reset email to {to_email}")
    return result
