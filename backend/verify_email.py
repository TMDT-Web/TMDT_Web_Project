import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_email_config():
    print("Checking Email Configuration...")
    
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    print(f"SMTP_HOST: {smtp_host}")
    print(f"SMTP_PORT: {smtp_port}")
    print(f"SMTP_USER: {smtp_user}")
    print(f"SMTP_PASSWORD: {'*' * 8 if smtp_password else 'NOT SET'}")
    print(f"ADMIN_EMAIL: {admin_email}")
    
    if not smtp_user or not smtp_password:
        print("\n❌ Error: SMTP_USER or SMTP_PASSWORD is not set in .env file.")
        return
        
    print("\nAttempting to connect to SMTP server...")
    
    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.set_debuglevel(1)  # Show SMTP debug output
        server.starttls()
        print("✓ Connected and TLS started.")
        
        print("Attempting login...")
        server.login(smtp_user, smtp_password)
        print("✓ Login successful.")
        
        # Send test email
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = admin_email or smtp_user
        msg['Subject'] = "Test Email from LuxeFurniture Debugger"
        
        body = "This is a test email to verify SMTP configuration."
        msg.attach(MIMEText(body, 'plain'))
        
        print(f"Sending test email to {msg['To']}...")
        server.send_message(msg)
        print("✓ Test email sent successfully!")
        
        server.quit()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    verify_email_config()
