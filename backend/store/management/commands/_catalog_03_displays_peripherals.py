"""Catálogo parte 3: monitores, teclados, mouses, audífonos, micrófonos y accesorios.

Precios en USD aproximados (referenciales).
"""
from ._helpers import ACCESSORY, HEADSET, KEYBOARD, MIC, MONITOR, MOUSE, p

PRODUCTS = []

# ================================================================== MONITORES


def mon(name, price, tier, year, size, res, panel, hz, ms, use="gaming"):
    return p(MONITOR, name, price, tier, year, size_in=size, resolution=res,
             panel_type=panel, refresh_hz=hz, response_ms=ms, use=use)


PRODUCTS += [
    mon("LG UltraGear 24GS60F", 119, "baja", 2024, 24, "1920x1080", "IPS", 180, 1),
    mon("MSI G244F E2", 119, "baja", 2024, 24, "1920x1080", "IPS", 180, 1),
    mon("ASUS TUF Gaming VG249Q3A", 139, "baja", 2023, 24, "1920x1080", "IPS", 180, 1),
    mon("Gigabyte GS27F", 139, "baja", 2024, 27, "1920x1080", "IPS", 180, 1),
    mon("Dell S2425H", 129, "baja", 2024, 24, "1920x1080", "IPS", 100, 4, "oficina"),
    mon("Dell S2725DS", 229, "media-baja", 2024, 27, "2560x1440", "IPS", 100, 4, "productividad"),
    mon("Samsung Odyssey G5 G50D", 249, "media", 2024, 27, "2560x1440", "IPS", 180, 1),
    mon("LG UltraGear 27GS75Q", 239, "media", 2023, 27, "2560x1440", "IPS", 180, 1),
    mon("ASUS TUF Gaming VG27AQ3A", 249, "media", 2023, 27, "2560x1440", "IPS", 180, 1),
    mon("MSI MAG 274QRF QD E2", 289, "media-alta", 2024, 27, "2560x1440", "Rapid IPS", 180, 1),
    mon("ASUS ROG Strix XG27ACS", 299, "media-alta", 2024, 27, "2560x1440", "IPS", 180, 1),
    mon("MSI MAG 274UPF E2", 329, "media-alta", 2024, 27, "3840x2160", "Rapid IPS", 144, 1),
    mon("BenQ ZOWIE XL2546X", 449, "media-alta", 2023, 24.5, "1920x1080", "TN", 240, 0.5, "esports"),
    mon("BenQ MOBIUZ EX270QM", 479, "alta", 2023, 27, "2560x1440", "IPS", 240, 1),
    mon("Dell UltraSharp U2725QE", 629, "alta", 2025, 27, "3840x2160", "IPS Black", 120, 5, "productividad"),
    mon("LG UltraGear OLED 27GS95QE", 649, "alta", 2024, 27, "2560x1440", "OLED", 240, 0.03),
    mon("MSI MPG 271QRX QD-OLED", 699, "alta", 2024, 27, "2560x1440", "QD-OLED", 360, 0.03),
    mon("Samsung Odyssey OLED G6 G60SF", 749, "alta", 2025, 27, "2560x1440", "QD-OLED", 360, 0.03),
    mon("Alienware AW3425DW", 900, "alta", 2024, 34, "3440x1440", "QD-OLED curvo", 240, 0.03),
    mon("ASUS ROG Swift OLED PG27AQDP", 899, "entusiasta", 2024, 27, "2560x1440", "OLED", 480, 0.03),
    mon("Alienware AW3225QF", 1000, "entusiasta", 2024, 32, "3840x2160", "QD-OLED curvo", 240, 0.03),
    mon("Samsung Odyssey OLED G8 G80SD", 1099, "entusiasta", 2024, 32, "3840x2160", "QD-OLED", 240, 0.03),
    mon("ASUS ROG Swift OLED PG32UCDM", 1299, "entusiasta", 2024, 32, "3840x2160", "QD-OLED", 240, 0.03),
    mon("LG UltraGear OLED 45GX950A", 1400, "entusiasta", 2025, 45, "5120x2160", "OLED curvo", 165, 0.03),
]

# =================================================================== TECLADOS


def kb(name, price, tier, year, kind, layout, conn, switch=None):
    return p(KEYBOARD, name, price, tier, year, keyboard_type=kind, layout=layout,
             connectivity=conn, switch=switch)


USB, WL = ["USB"], ["2.4GHz", "Bluetooth", "USB"]

PRODUCTS += [
    # Mecánicos
    kb("Logitech G Pro X TKL Rapid", 199, "alta", 2024, "mecánico", "TKL", USB, "magnético analógico"),
    kb("Logitech G515 Lightspeed TKL", 129, "media-alta", 2024, "mecánico", "TKL", ["2.4GHz", "Bluetooth"], "GL low-profile"),
    kb("Wooting 60HE+", 199, "entusiasta", 2024, "mecánico", "60%", USB, "Lekker (efecto Hall)"),
    kb("Wooting 80HE", 199, "entusiasta", 2024, "mecánico", "TKL", USB, "Lekker (efecto Hall)"),
    kb("Razer Huntsman V3 Pro TKL", 219, "entusiasta", 2024, "mecánico", "TKL", USB, "Analog Optical Gen-2"),
    kb("Razer BlackWidow V4 75%", 189, "alta", 2024, "mecánico", "75%", USB, "Razer Orange (táctil)"),
    kb("SteelSeries Apex Pro TKL Gen 3", 219, "entusiasta", 2024, "mecánico", "TKL", USB, "OmniPoint 3.0 (Hall)"),
    kb("Corsair K70 Core RGB", 89, "media", 2023, "mecánico", "100%", USB, "lineal rojo"),
    kb("Corsair K65 Plus Wireless", 149, "media-alta", 2023, "mecánico", "75%", WL, "MLX Red"),
    kb("Keychron K2 HE", 129, "media-alta", 2024, "mecánico", "75%", WL, "Gateron magnético (Hall)"),
    kb("Keychron V1 Max", 89, "media", 2024, "mecánico", "75%", WL, "K Pro Red"),
    kb("HyperX Alloy Rise 75", 149, "media-alta", 2024, "mecánico", "75%", USB, "HyperX lineal"),
    kb("ASUS ROG Strix Scope II 96 Wireless", 199, "alta", 2024, "mecánico", "96%", WL, "ROG NX Storm"),
    kb("Redragon K552 Kumara", 39, "baja", 2018, "mecánico", "TKL", USB, "Outemu"),
    kb("Redragon K617 Fizz", 35, "baja", 2021, "mecánico", "60%", USB, "Outemu lineal"),
    # Membrana
    kb("Logitech K120", 15, "baja", 2012, "membrana", "100%", USB),
    kb("Logitech MK270 (teclado + mouse)", 30, "baja", 2018, "membrana", "100%", ["2.4GHz"]),
    kb("Logitech G213 Prodigy", 50, "media-baja", 2016, "membrana", "100%", USB, "Mech-Dome"),
    kb("Razer Cynosa V2", 50, "media-baja", 2020, "membrana", "100%", USB),
    kb("Corsair K55 Core RGB", 50, "media-baja", 2022, "membrana", "100%", USB),
    kb("HyperX Alloy Core RGB", 45, "media-baja", 2019, "membrana", "100%", USB),
    kb("Logitech MX Keys S", 109, "media-alta", 2023, "membrana (tijera)", "100%", ["Bluetooth", "Logi Bolt"]),
]

# ===================================================================== MOUSES


def mouse(name, price, tier, year, kind, wireless, weight, dpi):
    return p(MOUSE, name, price, tier, year, mouse_type=kind, wireless=wireless,
             weight_g=weight, max_dpi=dpi)


PRODUCTS += [
    mouse("Logitech G Pro X Superlight 2", 159, "alta", 2023, "ligero", True, 60, 32000),
    mouse("Razer Viper V3 Pro", 159, "alta", 2024, "ligero", True, 54, 35000),
    mouse("Razer Viper V3 HyperSpeed", 70, "media", 2024, "ligero", True, 82, 30000),
    mouse("Razer DeathAdder V3 Pro", 149, "alta", 2022, "ergonómico", True, 63, 30000),
    mouse("Glorious Model O 2 Wireless", 99, "media-alta", 2024, "ligero", True, 68, 26000),
    mouse("Pulsar X2V2", 99, "media-alta", 2023, "ligero", True, 52, 32000),
    mouse("HyperX Pulsefire Haste 2 Wireless", 90, "media", 2023, "ligero", True, 61, 26000),
    mouse("ASUS ROG Harpe Ace Aim Lab Edition", 140, "alta", 2023, "ligero", True, 54, 36000),
    mouse("ASUS ROG Keris Wireless Aimpoint", 100, "media-alta", 2023, "ligero", True, 75, 36000),
    mouse("Logitech G502 X Plus", 159, "alta", 2022, "ergonómico", True, 106, 25600),
    mouse("Logitech G305 Lightspeed", 50, "media-baja", 2018, "inalámbrico", True, 99, 12000),
    mouse("Logitech G203 Lightsync", 30, "baja", 2018, "económico", False, 85, 8000),
    mouse("Logitech MX Master 3S", 99, "media-alta", 2022, "productividad", True, 141, 8000),
    mouse("Logitech Pebble Mouse 2 M350s", 30, "baja", 2024, "oficina", True, None, 4000),
    mouse("Razer Naga V2 Pro", 180, "entusiasta", 2022, "MMO", True, 134, 30000),
    mouse("Razer Naga X", 80, "media", 2021, "MMO", False, 85, 18000),
    mouse("Corsair Scimitar RGB Elite", 60, "media", 2020, "MMO", False, 122, 18000),
    mouse("Corsair Scimitar Elite Wireless SE", 110, "media-alta", 2022, "MMO", True, 122, 26000),
    mouse("Redragon M908 Impact", 40, "baja", 2018, "MMO", False, None, 12400),
    mouse("Redragon M711 Cobra", 20, "baja", 2018, "económico", False, None, 10000),
]

# ================================================================== AUDÍFONOS


def hs(name, price, tier, year, conn, mic=True, kind="gaming", anc=False):
    return p(HEADSET, name, price, tier, year, headset_type=kind, connectivity=conn,
             has_mic=mic, noise_cancelling=anc)


PRODUCTS += [
    hs("Razer BlackShark V2 Pro (2023)", 180, "alta", 2023, ["2.4GHz", "Bluetooth"]),
    hs("Razer Kraken V4", 200, "alta", 2024, ["2.4GHz", "Bluetooth", "USB-C"]),
    hs("Razer Kraken V4 X", 80, "media-baja", 2024, ["USB"]),
    hs("Razer Barracuda X (2022)", 100, "media", 2022, ["2.4GHz", "Bluetooth", "3.5mm"]),
    hs("HyperX Cloud III", 100, "media", 2023, ["3.5mm", "USB"]),
    hs("HyperX Cloud III Wireless", 160, "media-alta", 2024, ["2.4GHz"]),
    hs("HyperX Cloud Stinger 2", 50, "baja", 2022, ["3.5mm"]),
    hs("Logitech G Pro X 2 Lightspeed", 250, "entusiasta", 2023, ["2.4GHz", "Bluetooth", "3.5mm"]),
    hs("Logitech G435 Lightspeed", 60, "media-baja", 2021, ["2.4GHz", "Bluetooth"]),
    hs("SteelSeries Arctis Nova 3", 50, "baja", 2023, ["USB", "3.5mm"]),
    hs("SteelSeries Arctis Nova 5 Wireless", 130, "media-alta", 2024, ["2.4GHz", "Bluetooth"]),
    hs("SteelSeries Arctis Nova 7 Wireless", 180, "alta", 2022, ["2.4GHz", "Bluetooth"]),
    hs("SteelSeries Arctis Nova Pro Wireless", 350, "entusiasta", 2022, ["2.4GHz", "Bluetooth"], anc=True),
    hs("Corsair HS65 Wireless", 80, "media", 2023, ["2.4GHz", "Bluetooth"]),
    hs("Corsair HS80 Max Wireless", 150, "media-alta", 2024, ["2.4GHz", "Bluetooth"]),
    hs("Sony INZONE H5", 100, "media", 2023, ["2.4GHz"]),
    hs("Sony INZONE H9 II", 299, "alta", 2024, ["2.4GHz", "Bluetooth"], anc=True),
    hs("Astro A50 X", 380, "entusiasta", 2024, ["HDMI", "2.4GHz", "Bluetooth"]),
    hs("Redragon H510 Zeus", 45, "baja", 2019, ["USB"]),
    hs("JBL Quantum 100", 35, "baja", 2020, ["3.5mm"]),
    hs("Logitech H390", 40, "baja", 2016, ["USB"], kind="oficina"),
    hs("Sony WH-CH520", 59, "baja", 2023, ["Bluetooth"], kind="estudio"),
    hs("Sony WH-1000XM6", 449, "entusiasta", 2025, ["Bluetooth", "3.5mm"], kind="estudio/trabajo", anc=True),
]

# =================================================================== MICRÓFONOS


def mic(name, price, tier, year, conn, pattern, kind):
    return p(MIC, name, price, tier, year, connection=conn, polar_pattern=pattern, mic_type=kind)


PRODUCTS += [
    mic("Elgato Wave:3", 130, "media-alta", 2020, ["USB"], "cardioide", "condensador"),
    mic("Elgato Wave DX", 99, "media", 2022, ["XLR"], "cardioide", "dinámico"),
    mic("Shure MV7+", 279, "alta", 2024, ["USB", "XLR"], "cardioide", "dinámico"),
    mic("Shure MV6", 119, "media", 2024, ["USB"], "cardioide", "dinámico"),
    mic("Blue Yeti X", 169, "media-alta", 2018, ["USB"], "multipatrón", "condensador"),
    mic("Razer Seiren V3 Mini", 60, "media-baja", 2024, ["USB"], "supercardioide", "condensador"),
    mic("Razer Seiren V3 Chroma", 150, "media-alta", 2024, ["USB"], None, "condensador"),
    mic("HyperX SoloCast", 50, "baja", 2018, ["USB"], "cardioide", "condensador"),
    mic("HyperX QuadCast 2", 140, "media-alta", 2024, ["USB"], "multipatrón", "condensador"),
    mic("HyperX QuadCast 2 S", 160, "media-alta", 2024, ["USB"], "multipatrón", "condensador"),
    mic("Fifine AM8", 50, "baja", 2021, ["USB", "XLR"], "cardioide", "dinámico"),
    mic("Maono PD200X", 70, "media-baja", 2021, ["USB", "XLR"], "cardioide", "dinámico"),
    mic("Rode NT-USB+", 170, "alta", 2022, ["USB"], "cardioide", "condensador"),
    mic("Audio-Technica AT2020USB-X", 150, "media-alta", 2022, ["USB"], "cardioide", "condensador"),
]

# =================================================================== ACCESORIOS


def acc(name, price, tier, year, kind, **specs):
    return p(ACCESSORY, name, price, tier, year, accessory_type=kind, **specs)


PRODUCTS += [
    acc("Logitech Brio 100", 40, "baja", 2023, "webcam", resolution="1080p", fps=30),
    acc("Logitech Brio 500", 130, "media", 2022, "webcam", resolution="1080p", fps=30),
    acc("Elgato Facecam MK.2", 150, "media-alta", 2024, "webcam", resolution="1080p", fps=60),
    acc("Razer Kiyo Pro Ultra", 300, "entusiasta", 2023, "webcam", resolution="4K", fps=30),
    acc("SteelSeries QcK Heavy XXL", 35, "baja", 2012, "mousepad", size_mm="900x400"),
    acc("Razer Gigantus V2 XXL", 30, "baja", 2019, "mousepad", size_mm="940x410"),
    acc("Arctic P12 Pro", 12, "baja", 2023, "ventilador", size_mm=120, connector="4-pin PWM"),
    acc("Noctua NF-A12x25 PWM", 35, "media-alta", 2018, "ventilador", size_mm=120, connector="4-pin PWM"),
    acc("Corsair iCUE LINK RX120 RGB", 28, "media", 2023, "ventilador", size_mm=120, connector="iCUE LINK"),
    acc("Lian Li UNI FAN TL 120", 35, "media-alta", 2022, "ventilador", size_mm=120, connector="4-pin PWM"),
    acc("Arctic MX-6 (4g)", 8, "baja", 2022, "pasta térmica", grams=4),
    acc("Noctua NT-H2 (3.5g)", 10, "media", 2022, "pasta térmica", grams=3.5),
    acc("TP-Link Archer TBE550E (Wi-Fi 7 PCIe)", 60, "media", 2024, "tarjeta de red", interface="PCIe", wifi="Wi-Fi 7"),
]