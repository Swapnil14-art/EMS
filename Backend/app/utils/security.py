import secrets
import string
import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False

def get_password_hash(password: str) -> str:
    """Returns a bcrypt hash of the provided password."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def generate_temporary_password(length: int = 12) -> str:
    """
    Generates a cryptographically secure random password containing at least:
    - 1 uppercase letter
    - 1 lowercase letter
    - 1 digit
    - 1 special character
    """
    alphabet = string.ascii_letters + string.digits + string.punctuation
    
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (any(c.islower() for c in password) and 
            any(c.isupper() for c in password) and 
            any(c.isdigit() for c in password) and 
            any(c in string.punctuation for c in password)):
            return password
