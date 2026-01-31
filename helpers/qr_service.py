import qrcode
from io import BytesIO
import base64

def generate_qr_base64(url: str) -> str:
    img = qrcode.make(url)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode()
