"""
Puebla la base de datos de TechForge con un catálogo de hardware 2024-2026.

Uso (desde la carpeta donde está manage.py):
    python manage.py seed_products
    python manage.py seed_products --dry-run                 # solo valida, no escribe
    python manage.py seed_products --reset                   # recrea los productos del catálogo
    python manage.py seed_products --price-factor 3.6        # usa otro tipo de cambio USD -> soles
    python manage.py seed_products --update-prices           # actualiza precios de productos ya existentes
    python manage.py seed_products --dry-run --update-prices # muestra cuántos precios cambiarían

El catálogo (archivos `_catalog_*.py`) está en USD; el seed lo convierte a SOLES
con USD_TO_PEN y redondea a soles enteros. Para ampliar el catálogo basta con
añadir otro archivo `_catalog_XX_nombre.py`: se detecta solo.
"""
import importlib
import json
import pkgutil
import random
from collections import Counter
from decimal import ROUND_HALF_UP, Decimal
from pathlib import Path
from urllib.parse import quote_plus

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from store.models import Category, Product

from ._helpers import TIERS

# Tipo de cambio por defecto USD -> PEN (el catálogo está escrito en dólares)
USD_TO_PEN = Decimal("3.45")

CATEGORIES = [
    ("procesadores", "Procesadores", "CPUs AMD Ryzen e Intel Core Ultra para todas las gamas."),
    ("placas-madre", "Placas Madre", "Motherboards AM5, AM4, LGA1851 y LGA1700."),
    ("memoria-ram", "Memoria RAM", "Memorias DDR5 y DDR4 para escritorio y laptop."),
    ("tarjetas-graficas", "Tarjetas Gráficas", "GPUs NVIDIA GeForce, AMD Radeon e Intel Arc."),
    ("almacenamiento", "Almacenamiento", "SSD NVMe PCIe 5.0/4.0, SSD SATA y discos duros."),
    ("fuentes-de-poder", "Fuentes de Poder", "Fuentes ATX 3.x y SFX certificadas 80 Plus."),
    ("gabinetes", "Gabinetes", "Cases ATX, mATX y Mini-ITX."),
    ("refrigeracion", "Refrigeración", "Coolers de aire y refrigeración líquida AIO."),
    ("monitores", "Monitores", "Monitores gamer, OLED y de productividad."),
    ("teclados", "Teclados", "Teclados mecánicos y de membrana."),
    ("mouses", "Mouses", "Mouses ligeros, MMO, ergonómicos y de oficina."),
    ("audifonos", "Audífonos", "Headsets gamer y audífonos para estudio/trabajo."),
    ("microfonos", "Micrófonos", "Micrófonos USB y XLR para streaming y podcasting."),
    ("laptops", "Laptops", "Laptops gamer, ultrabooks y equipos para trabajo/estudio."),
    ("accesorios", "Accesorios", "Webcams, mousepads, ventiladores, pasta térmica y más."),
]

# Rango de stock aleatorio (reproducible) según la gama
STOCK_BY_TIER = {
    "baja": (20, 80), "media-baja": (15, 60), "media": (10, 40),
    "media-alta": (6, 25), "alta": (3, 15), "entusiasta": (1, 6),
}
_SKIP_IN_DESCRIPTION = {"brand", "tier", "release_year"}


def to_pen(usd_price, factor):
    """USD -> soles enteros (redondeo half-up, igual que la conversión ya aplicada a la BD)."""
    return (Decimal(str(usd_price)) * factor).quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def load_catalog():
    """Carga todos los archivos _catalog_*.py de esta carpeta, en orden alfabético."""
    folder = Path(__file__).resolve().parent
    modules = sorted(
        m.name for m in pkgutil.iter_modules([str(folder)]) if m.name.startswith("_catalog_")
    )
    if not modules:
        raise CommandError("No se encontró ningún archivo _catalog_*.py junto a seed_products.py")
    items = []
    for name in modules:
        module = importlib.import_module(f".{name}", package=__package__)
        items.extend(module.PRODUCTS)
    return modules, items


def _fmt(value):
    if isinstance(value, bool):
        return "sí" if value else "no"
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value)
    return str(value)


def build_description(item):
    specs = item["specifications"]
    details = "; ".join(
        f"{k.replace('_', ' ')}: {_fmt(v)}"
        for k, v in specs.items()
        if k not in _SKIP_IN_DESCRIPTION and v is not None
    )
    gama = specs["tier"].replace("-", " ")
    return f"{item['name']}. Gama {gama}, lanzamiento {specs['release_year']}. {details}."


def validate(items, valid_categories):
    errors = []
    for i, item in enumerate(items, 1):
        label = f"#{i} {item.get('name', '?')}"
        if item.get("category") not in valid_categories:
            errors.append(f"{label}: categoría desconocida '{item.get('category')}'")
        name = item.get("name") or ""
        if not name or len(name) > 200:
            errors.append(f"{label}: nombre vacío o de más de 200 caracteres")
        if not isinstance(item.get("price"), (int, float)) or item["price"] <= 0:
            errors.append(f"{label}: precio inválido")
        specs = item.get("specifications")
        if not isinstance(specs, dict) or not specs:
            errors.append(f"{label}: specifications debe ser un dict no vacío")
            continue
        if specs.get("tier") not in TIERS:
            errors.append(f"{label}: gama inválida")
        try:
            json.dumps(specs)
        except TypeError as exc:
            errors.append(f"{label}: specifications no es JSON válido ({exc})")
    if errors:
        raise CommandError("Catálogo inválido:\n  " + "\n  ".join(errors))


class Command(BaseCommand):
    help = "Puebla TechForge con categorías y un catálogo de hardware 2024-2026 usando bulk_create."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset", action="store_true",
            help="Borra antes los productos del catálogo que no tengan pedidos y los recrea.",
        )
        parser.add_argument(
            "--price-factor", type=float, default=None,
            help=f"Tipo de cambio USD -> soles. Por defecto {USD_TO_PEN}.",
        )
        parser.add_argument(
            "--update-prices", action="store_true",
            help="Actualiza el precio de los productos del catálogo que ya existen.",
        )
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Valida el catálogo y muestra el resumen sin escribir en la base de datos.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        price_factor = options["price_factor"]
        if price_factor is not None and price_factor <= 0:
            raise CommandError("--price-factor debe ser mayor que 0.")
        factor = USD_TO_PEN if price_factor is None else Decimal(str(price_factor))
        dry_run = options["dry_run"]

        modules, items = load_catalog()
        self.stdout.write(f"Catálogo: {len(items)} productos en {len(modules)} archivo(s).")
        self.stdout.write(f"Tipo de cambio USD -> PEN: {factor}")
        validate(items, {slug for slug, _, _ in CATEGORIES})

        # Slugs únicos (el slug sale del nombre)
        entries, seen, duplicates = [], set(), []
        for item in items:
            slug = slugify(item["name"])[:220]
            if slug in seen:
                duplicates.append(item["name"])
            seen.add(slug)
            entries.append((slug, item))
        if duplicates:
            raise CommandError("Nombres duplicados en el catálogo:\n  " + "\n  ".join(duplicates))

        # Precio en soles de cada producto del catálogo
        price_by_slug = {slug: to_pen(item["price"], factor) for slug, item in entries}

        if dry_run:
            self.stdout.write(self.style.WARNING("--dry-run: no se escribió nada en la base de datos."))
            if options["update_prices"]:
                changes = self._prices_to_update(price_by_slug)
                self.stdout.write(f"--update-prices: cambiarían {len(changes)} precios.")
            self._summary(Counter(item["category"] for _, item in entries), dict(
                (slug, name) for slug, name, _ in CATEGORIES))
            return

        # 1) Categorías (se reutilizan si ya existen por slug o por nombre)
        categories = {}
        for slug, name, description in CATEGORIES:
            cat = (
                Category.objects.filter(slug=slug).first()
                or Category.objects.filter(name=name).first()
            )
            if cat is None:
                cat = Category.objects.create(name=name, slug=slug, description=description)
            categories[slug] = cat

        # 2) Reset opcional (solo productos del catálogo sin pedidos asociados)
        if options["reset"]:
            catalog_slugs = {s for s, _ in entries}
            ids = [
                pk for pk, slug in Product.objects.filter(order_items__isnull=True)
                .values_list("pk", "slug") if slug in catalog_slugs
            ]
            for i in range(0, len(ids), 500):
                Product.objects.filter(pk__in=ids[i:i + 500]).delete()
            self.stdout.write(f"--reset: {len(ids)} productos eliminados.")

        # 3) Productos nuevos (idempotente: se omiten los slugs que ya existen)
        existing = set(Product.objects.values_list("slug", flat=True))
        rng = random.Random(2026)  # stock reproducible
        to_create, skipped = [], 0
        for slug, item in entries:
            if slug in existing:
                skipped += 1
                continue
            specs = item["specifications"]
            to_create.append(Product(
                category=categories[item["category"]],
                name=item["name"],
                slug=slug,
                description=item.get("description") or build_description(item),
                price=price_by_slug[slug],
                stock=rng.randint(*STOCK_BY_TIER[specs["tier"]]),
                image_url=f"https://placehold.co/600x400/png?text={quote_plus(item['name'][:40])}",
                specifications=specs,
                is_active=True,
            ))

        created = Product.objects.bulk_create(to_create, batch_size=100)

        self.stdout.write(self.style.SUCCESS(
            f"Listo: {len(created)} productos creados, {skipped} ya existían (omitidos)."))

        # 4) Actualizar precios de los existentes (solo si se pidió)
        if options["update_prices"]:
            changes = self._prices_to_update(price_by_slug)
            Product.objects.bulk_update(changes, ["price"], batch_size=100)
            self.stdout.write(self.style.SUCCESS(
                f"--update-prices: {len(changes)} precios actualizados."))

        self._summary(
            Counter(p.category.slug for p in created),
            {slug: name for slug, name, _ in CATEGORIES},
        )

    def _prices_to_update(self, price_by_slug):
        """Productos existentes del catálogo cuyo precio difiere del calculado (no guarda nada)."""
        changes = []
        for product in Product.objects.only("slug", "price"):
            new_price = price_by_slug.get(product.slug)
            if new_price is not None and product.price != new_price:
                product.price = new_price
                changes.append(product)
        return changes

    def _summary(self, counter, names):
        self.stdout.write("Productos por categoría:")
        for slug, name in names.items():
            self.stdout.write(f"  {name:<20} {counter.get(slug, 0):>4}")