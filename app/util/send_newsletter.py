import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# --- CONFIG ---
GMAIL_USER = os.getenv('GMAIL_USER', 'dchisholm125@gmail.com')
GMAIL_PASSWORD = os.getenv('GMAIL_PASSWORD', '')
RECIPIENT = os.getenv('RECIPIENT', 'dchisholm125@gmail.com')

# --- HTML NEWSLETTER TEMPLATE ---
NEWSLETTER_NAME = "Golf Weekly Digest"
COMPANY = "Golf App Co."
ADDRESS = "1234 Fairway Lane, Augusta, GA 30904"
LOGO_FILENAME = os.path.join(os.path.dirname(__file__), 'golf_logo.png')
TODAY = datetime.now().strftime('%B %d, %Y')

NEWSLETTER_CONTENT = """
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu consectetur consectetur, nisl nisi consectetur nisi, eu consectetur nisl nisi euismod nisi.</p>
<ul><li>Section 1: Golf Tips</li><li>Section 2: Upcoming Tournaments</li><li>Section 3: Featured Course</li></ul>
"""

RELEVANT_LINKS = [
    ("USGA", "https://www.usga.org/"),
    ("PGA Tour", "https://www.pgatour.com/"),
    ("Golf Digest", "https://www.golfdigest.com/"),
    ("Golf Channel", "https://www.golfchannel.com/"),
]

OUTLINE = """
<ul>
  <li>Golf Tips</li>
  <li>Upcoming Tournaments</li>
  <li>Featured Course</li>
</ul>
"""

COPYRIGHT = "&copy; 2025 Golf App Co. All rights reserved."

HTML = f"""
<table width='700' cellpadding='10' cellspacing='0' style='border-collapse:collapse; font-family:sans-serif; background:#f8f9fa;'>
  <tr>
    <td align='center' width='33%' style='vertical-align:middle; height:80px;'>
      <div style='display:flex; align-items:center; justify-content:center; height:80px; width:100%;'>
        <img src='cid:golf_logo' alt='Logo' style='max-width:100%; max-height:80px; display:block; margin:auto;'>
      </div>
    </td>
    <td align='center' width='34%' style='font-size:2rem; font-weight:bold;'>{NEWSLETTER_NAME}</td>
    <td align='right' width='33%' style='font-size:1.1rem; color:#888;'>{TODAY}</td>
  </tr>
  <tr>
    <td valign='top' width='33%' style='font-size:1rem;'>
      <ul style='padding-left:1em;'>
        {''.join([f"<li><a href='{url}' style='color:#1976d2;text-decoration:none;'>{name}</a></li>" for name, url in RELEVANT_LINKS])}
      </ul>
    </td>
    <td valign='top' width='34%' style='font-size:1.1rem; background:#fff; border-radius:8px; box-shadow:0 2px 8px #e0e0e0;'>
      {NEWSLETTER_CONTENT}
    </td>
    <td valign='top' width='33%' style='font-size:1rem;'>
      <strong>In This Issue:</strong>
      {OUTLINE}
    </td>
  </tr>
  <tr>
    <td align='left' width='33%' style='font-size:0.9rem; color:#888;'>{COPYRIGHT}</td>
    <td align='center' width='34%' style='font-size:0.95rem; color:#555;'>{COMPANY}<br>{ADDRESS}</td>
    <td align='center' width='33%' style='vertical-align:middle; height:60px;'>
      <div style='display:flex; align-items:center; justify-content:center; height:60px; width:100%;'>
        <img src='cid:golf_logo' alt='Logo' style='max-width:100%; max-height:60px; display:block; margin:auto;'>
      </div>
    </td>
  </tr>
</table>
"""

# --- SEND EMAIL ---
def send_newsletter():
    msg = MIMEMultipart('related')
    msg['Subject'] = f"{NEWSLETTER_NAME} - {TODAY}"
    msg['From'] = GMAIL_USER
    msg['To'] = RECIPIENT

    alt = MIMEMultipart('alternative')
    alt.attach(MIMEText(HTML, 'html'))
    msg.attach(alt)

    # Attach logo image as CID
    try:
        with open(LOGO_FILENAME, 'rb') as img_file:
            img = MIMEImage(img_file.read())
            img.add_header('Content-ID', '<golf_logo>')
            img.add_header('Content-Disposition', 'inline', filename='golf_logo.png')
            msg.attach(img)
    except Exception as e:
        print(f"Warning: Could not attach logo image: {e}")

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_USER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_USER, RECIPIENT, msg.as_string())
        print(f"Newsletter sent to {RECIPIENT}")
    except Exception as e:
        print(f"Failed to send newsletter: {e}")

if __name__ == "__main__":
    send_newsletter()
