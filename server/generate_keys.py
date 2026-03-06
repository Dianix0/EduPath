"""
Ejecutar una sola vez para generar el par de llaves RSA necesario para LTI 1.3.
Genera: private.key y public.key en la carpeta server/
"""
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=4096,
    backend=default_backend(),
)

# Guardar llave privada
with open("private.key", "wb") as f:
    f.write(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )

# Guardar llave publica
with open("public.key", "wb") as f:
    f.write(
        private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )

print("Llaves generadas exitosamente:")
print("  - private.key")
print("  - public.key  <-- esta la pegas en Moodle")