import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def send_reset_password_email(to_email: str, reset_token: str) -> None:
    """Gửi email đặt lại mật khẩu. Bỏ qua nếu chưa cấu hình SMTP."""
    if not settings.mail_username or not settings.mail_password:
        return

    reset_link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={reset_token}"
    sender = f"{settings.mail_from_name} <{settings.mail_username}>"

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f5f0e8;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:40px 0;">
        <tr><td align="center">
          <table width="520" cellpadding="0" cellspacing="0"
                 style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <!-- Header -->
            <tr>
              <td style="background:#6b3f1f;padding:28px 32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">💪 GymStore</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 32px;">
                <h2 style="margin:0 0 12px;color:#2d1a0e;font-size:18px;">Đặt lại mật khẩu</h2>
                <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.6;">
                  Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{to_email}</strong>.
                  Nhấn nút bên dưới để tiếp tục:
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <a href="{reset_link}"
                     style="background:#6b3f1f;color:#ffffff;text-decoration:none;padding:13px 32px;
                            border-radius:8px;font-size:15px;font-weight:600;display:inline-block;">
                    Đặt lại mật khẩu
                  </a>
                </div>
                <p style="margin:0 0 8px;color:#888;font-size:12px;">
                  Link có hiệu lực trong <strong>30 phút</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.
                </p>
                <p style="margin:0;color:#aaa;font-size:11px;word-break:break-all;">
                  Hoặc copy link: {reset_link}
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#faf7f2;padding:16px 32px;text-align:center;border-top:1px solid #ede8df;">
                <p style="margin:0;color:#aaa;font-size:11px;">© 2025 GymStore. Đây là email tự động, vui lòng không trả lời.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Đặt lại mật khẩu GymStore"
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
        server.login(settings.mail_username, settings.mail_password)
        server.sendmail(settings.mail_username, to_email, msg.as_string())
