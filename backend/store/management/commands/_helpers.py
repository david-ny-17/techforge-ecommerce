"""Utilidades compartidas por los archivos de catálogo (_catalog_*.py)."""

TIERS = ("baja", "media-baja", "media", "media-alta", "alta", "entusiasta")

# Slugs de categoría (deben existir en CATEGORIES de seed_products.py)
CPU, MB, RAM, GPU, SSD, PSU = (
    "procesadores", "placas-madre", "memoria-ram",
    "tarjetas-graficas", "almacenamiento", "fuentes-de-poder",
)
CASE, COOLER, MONITOR, KEYBOARD, MOUSE, HEADSET, MIC, LAPTOP, ACCESSORY = (
    "gabinetes", "refrigeracion", "monitores", "teclados", "mouses",
    "audifonos", "microfonos", "laptops", "accesorios",
)

_BRAND_PREFIXES = {
    "WD_BLACK": "Western Digital",
    "WD Blue": "Western Digital",
    "WD Red": "Western Digital",
    "Western Digital": "Western Digital",
    "Cooler Master": "Cooler Master",
    "Lian Li": "Lian Li",
    "be quiet!": "be quiet!",
    "Fractal Design": "Fractal Design",
    "Audio-Technica": "Audio-Technica",
}


def brand_of(name):
    """Deduce la marca desde el inicio del nombre del producto."""
    for prefix in sorted(_BRAND_PREFIXES, key=len, reverse=True):
        if name.startswith(prefix):
            return _BRAND_PREFIXES[prefix]
    return name.split()[0]


def p(category, name, price, tier, year, **specs):
    """Crea un producto. `specs` pasa a ser el JSON `specifications`
    (se le añaden automáticamente brand, tier y release_year)."""
    if tier not in TIERS:
        raise ValueError(f"Gama inválida '{tier}' en '{name}'")
    return {
        "category": category,
        "name": name,
        "price": price,  # USD referencial
        "specifications": {
            "brand": brand_of(name),
            "tier": tier,
            "release_year": year,
            **specs,
        },
    }