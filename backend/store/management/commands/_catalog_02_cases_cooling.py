"""Catálogo parte 2: gabinetes y refrigeración.

Precios en USD aproximados. Las medidas máximas (GPU / cooler / radiadores) son las
publicadas por cada fabricante, redondeadas: valídalas antes de usarlas para bloquear compras.
"""
from ._helpers import CASE, COOLER, p

PRODUCTS = []

# ================================================================== GABINETES
ATX = ["ATX", "mATX", "Mini-ITX"]
MATX = ["mATX", "Mini-ITX"]
ITX = ["Mini-ITX"]
R360 = [120, 140, 240, 280, 360]


def case(name, price, tier, year, size, boards, gpu_mm, cooler_mm, rads, psu="ATX"):
    return p(CASE, name, price, tier, year, case_size=size, supported_boards=boards,
             max_gpu_mm=gpu_mm, max_cpu_cooler_mm=cooler_mm,
             radiator_support_mm=rads, psu_form_factor=psu)


PRODUCTS += [
    case("Corsair 3000D Airflow", 75, "baja", 2022, "Mid Tower", ATX, 360, 170, R360),
    case("Corsair 4000D Airflow", 105, "media", 2020, "Mid Tower", ATX, 360, 170, R360),
    case("Corsair 3500X ARGB", 129, "media-alta", 2024, "Mid Tower", ATX, 400, 170, R360),
    case("Corsair 6500X", 199, "alta", 2024, "Mid Tower", ATX, 400, 170, R360),
    case("NZXT H5 Flow (2024)", 90, "media-baja", 2024, "Mid Tower", ATX, 365, 165, [120, 140, 240, 280]),
    case("NZXT H6 Flow RGB", 120, "media", 2023, "Mid Tower", ATX, 365, 163, R360),
    case("NZXT H7 Flow (2024)", 130, "media-alta", 2024, "Mid Tower", ATX, 400, 185, R360),
    case("Lian Li Lancool 216", 109, "media-alta", 2022, "Mid Tower", ATX, 392, 180, R360),
    case("Lian Li Lancool 217", 120, "media-alta", 2024, "Mid Tower", ATX, 420, 180, R360),
    case("Lian Li O11 Dynamic EVO RGB", 180, "alta", 2023, "Mid Tower", ATX, 426, 167, R360),
    case("Lian Li A3-mATX", 90, "media", 2023, "Mini Tower", MATX, 415, 165, [120, 240, 280, 360]),
    case("Fractal Design North", 149, "media-alta", 2022, "Mid Tower", ATX, 355, 170, R360),
    case("Fractal Design Pop Air", 89, "media-baja", 2021, "Mid Tower", ATX, 405, 170, R360),
    case("Fractal Design Torrent", 199, "alta", 2021, "Mid Tower", ATX, 423, 188, R360 + [420]),
    case("HYTE Y70", 225, "alta", 2022, "Mid Tower", ATX, 422, 180, R360),
    case("Montech Air 903 Max", 60, "baja", 2023, "Mid Tower", ATX, 400, 166, R360),
    case("DeepCool CH560", 89, "media", 2024, "Mid Tower", ATX, 380, 175, R360),
    case("Cooler Master NR200P V2", 120, "media-alta", 2023, "SFF", ITX, 336, 155, [120, 240, 280], "SFX"),
]

# ================================================================ REFRIGERACIÓN
SK = ["AM5", "AM4", "LGA1700", "LGA1851"]


def air(name, price, tier, year, height, sockets=SK):
    return p(COOLER, name, price, tier, year, cooler_type="aire", height_mm=height,
             supported_sockets=sockets)


def aio(name, price, tier, year, rad, sockets=SK):
    return p(COOLER, name, price, tier, year, cooler_type="AIO", radiator_mm=rad,
             supported_sockets=sockets)


PRODUCTS += [
    # Aire
    air("Noctua NH-D15 G2", 149, "entusiasta", 2024, 168),
    air("Noctua NH-L9i-17xx", 50, "media-alta", 2022, 37, ["LGA1700", "LGA1851"]),
    air("Noctua NH-L9a-AM5", 50, "media-alta", 2022, 37, ["AM5", "AM4"]),
    air("Thermalright Peerless Assassin 120 SE", 38, "media", 2022, 155),
    air("Thermalright Phantom Spirit 120 SE", 45, "media-alta", 2023, 157),
    air("Thermalright Assassin X 120 Refined SE", 20, "baja", 2023, 148),
    air("DeepCool AK400", 30, "baja", 2021, 155),
    air("DeepCool AK620", 65, "media-alta", 2021, 160),
    air("Cooler Master Hyper 212 Black Edition", 30, "baja", 2023, 159),
    air("Arctic Freezer 36", 30, "media-baja", 2024, 159),
    # AIO
    aio("Arctic Liquid Freezer III 240", 85, "media", 2023, 240),
    aio("Arctic Liquid Freezer III 280", 95, "media-alta", 2023, 280),
    aio("Arctic Liquid Freezer III 360", 110, "alta", 2023, 360),
    aio("Corsair Nautilus 240 RS ARGB", 90, "media", 2024, 240),
    aio("Corsair Nautilus 360 RS", 110, "media-alta", 2024, 360),
    aio("Corsair iCUE LINK H150i RGB 360", 250, "alta", 2024, 360),
    aio("Corsair iCUE LINK TITAN 360 RX RGB", 230, "alta", 2024, 360),
    aio("NZXT Kraken 240 (2024)", 150, "media-alta", 2024, 240),
    aio("NZXT Kraken Elite 360 RGB (2024)", 280, "entusiasta", 2024, 360),
    aio("Lian Li Galahad II Trinity 360 SL-INF", 150, "alta", 2023, 360),
    aio("DeepCool LT520", 90, "media", 2023, 240),
    aio("DeepCool LT720", 120, "alta", 2023, 360),
    aio("Thermalright Frozen Warframe 360", 75, "media-alta", 2024, 360),
    aio("Cooler Master MasterLiquid 240 Atmos", 110, "media-alta", 2023, 240),
    aio("Cooler Master MasterLiquid 360 Atmos", 150, "alta", 2023, 360),
    aio("ASUS ROG Ryujin III 360 ARGB", 300, "entusiasta", 2024, 360),
]