# Standard library imports
import secrets
import datetime
from io import BytesIO
from base64 import b64encode

# Django imports
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

# Third-party imports
import pyotp
import qrcode
from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user):
    """
    Generates JWT tokens for a given user.
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def generate_2fa_code():
    """
    Generates a 6-digit two-factor authentication code.
    """
    return ''.join(secrets.choice('0123456789') for i in range(6))

def send_two_factor_email(user_email, user):
    """
    Sends a two-factor authentication code via email.
    """
    two_factor_code = generate_2fa_code()
    user.two_factor_code = two_factor_code
    user.two_factor_code_expires = timezone.now() + datetime.timedelta(minutes=5)
    user.save()
    send_mail(
        subject='Your 2FA Code',
        message=f'Your 2FA code is: {two_factor_code}',
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user_email],
        fail_silently=False,
    )

def retrieve_stored_2fa_code(user):
    """
    Retrieves a stored two-factor authentication code if it's still valid.
    """
    if user.two_factor_code_expires and timezone.now() < user.two_factor_code_expires:
        return user.two_factor_code
    return None

def generate_qr_code(user):
    """
    Generates a QR code for two-factor authentication.
    """
    totp = pyotp.TOTP(user.totp_secret)
    uri = totp.provisioning_uri(name=user.email, issuer_name="Transcendence")
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img_buffer = BytesIO()
    img.save(img_buffer)
    img_buffer.seek(0)
    img_data = img_buffer.read()
    data_uri = b64encode(img_data).decode('utf-8')
    img_tag = f'data:image/png;base64,{data_uri}'
    return img_tag
