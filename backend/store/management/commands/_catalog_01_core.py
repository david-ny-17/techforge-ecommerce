"""Catálogo parte 1: procesadores, placas madre, RAM, GPUs, almacenamiento y fuentes.

Precios: USD aproximados de mercado (referenciales, verifícalos antes de producción).
release_year: año de lanzamiento del modelo. Se incluyen algunas líneas "legacy"
(AM4, LGA1700, DDR4) porque siguen vendiéndose en 2024-2026 para armados económicos.
"""
from ._helpers import CPU, GPU, MB, PSU, RAM, SSD, p

PRODUCTS = []

# =============================================================== PROCESADORES
D5, D4, D45 = ("DDR5",), ("DDR4",), ("DDR4", "DDR5")


def cpu(name, price, tier, year, cores, threads, tdp, socket, ram, igpu=True):
    return p(CPU, name, price, tier, year, socket=socket, cores=cores, threads=threads,
             tdp=tdp, ram_type=list(ram), igpu=igpu)


PRODUCTS += [
    # AMD Ryzen 9000 (AM5)
    cpu("AMD Ryzen 9 9950X3D", 699, "entusiasta", 2025, 16, 32, 170, "AM5", D5),
    cpu("AMD Ryzen 9 9900X3D", 599, "entusiasta", 2025, 12, 24, 120, "AM5", D5),
    cpu("AMD Ryzen 9 9950X", 599, "entusiasta", 2024, 16, 32, 170, "AM5", D5),
    cpu("AMD Ryzen 9 9900X", 429, "alta", 2024, 12, 24, 120, "AM5", D5),
    cpu("AMD Ryzen 7 9800X3D", 479, "alta", 2024, 8, 16, 120, "AM5", D5),
    cpu("AMD Ryzen 7 9700X", 329, "media-alta", 2024, 8, 16, 65, "AM5", D5),
    cpu("AMD Ryzen 5 9600X", 279, "media", 2024, 6, 12, 65, "AM5", D5),
    cpu("AMD Ryzen 5 9600", 229, "media", 2025, 6, 12, 65, "AM5", D5),
    # AMD APUs con gráficos integrados potentes (AM5)
    cpu("AMD Ryzen 7 8700G", 299, "media-alta", 2024, 8, 16, 65, "AM5", D5),
    cpu("AMD Ryzen 5 8600G", 209, "media", 2024, 6, 12, 65, "AM5", D5),
    cpu("AMD Ryzen 5 8500G", 169, "media-baja", 2024, 6, 12, 65, "AM5", D5),
    # AMD AM4 (económico)
    cpu("AMD Ryzen 7 5700X3D", 229, "media", 2024, 8, 16, 105, "AM4", D4, igpu=False),
    cpu("AMD Ryzen 5 5600GT", 125, "baja", 2024, 6, 12, 65, "AM4", D4),
    cpu("AMD Ryzen 5 5500GT", 105, "baja", 2024, 6, 12, 65, "AM4", D4),
    # Intel Core Ultra 200S (LGA1851)
    cpu("Intel Core Ultra 9 285K", 589, "entusiasta", 2024, 24, 24, 125, "LGA1851", D5),
    cpu("Intel Core Ultra 7 265K", 394, "alta", 2024, 20, 20, 125, "LGA1851", D5),
    cpu("Intel Core Ultra 7 265KF", 379, "alta", 2024, 20, 20, 125, "LGA1851", D5, igpu=False),
    cpu("Intel Core Ultra 5 245K", 309, "media-alta", 2024, 14, 14, 125, "LGA1851", D5),
    cpu("Intel Core Ultra 5 245KF", 294, "media-alta", 2024, 14, 14, 125, "LGA1851", D5, igpu=False),
    cpu("Intel Core Ultra 9 285", 549, "alta", 2025, 24, 24, 65, "LGA1851", D5),
    cpu("Intel Core Ultra 7 265", 389, "alta", 2025, 20, 20, 65, "LGA1851", D5),
    cpu("Intel Core Ultra 5 245", 270, "media", 2025, 14, 14, 65, "LGA1851", D5),
    cpu("Intel Core Ultra 5 235", 230, "media", 2025, 14, 14, 65, "LGA1851", D5),
    cpu("Intel Core Ultra 5 225F", 190, "media-baja", 2025, 10, 10, 65, "LGA1851", D5, igpu=False),
    cpu("Intel Core Ultra 5 225", 205, "media-baja", 2025, 10, 10, 65, "LGA1851", D5),
    # Intel 14.ª gen (LGA1700, DDR4/DDR5)
    cpu("Intel Core i7-14700F", 299, "media-alta", 2024, 20, 28, 65, "LGA1700", D45, igpu=False),
    cpu("Intel Core i5-14400F", 175, "media-baja", 2024, 10, 16, 65, "LGA1700", D45, igpu=False),
    cpu("Intel Core i3-14100F", 105, "baja", 2024, 4, 8, 58, "LGA1700", D45, igpu=False),
]

# ================================================================ PLACAS MADRE


def mb(name, price, tier, year, socket, chipset, ff, ram="DDR5", wifi=True, pcie="5.0"):
    return p(MB, name, price, tier, year, socket=socket, chipset=chipset, form_factor=ff,
             ram_type=ram, ram_slots=2 if ff == "Mini-ITX" else 4, wifi=wifi, pcie_gpu=pcie)


PRODUCTS += [
    # AM5 - X870E / X870
    mb("ASUS ROG Crosshair X870E Hero", 699, "entusiasta", 2024, "AM5", "X870E", "ATX"),
    mb("ASUS ROG Strix X870E-E Gaming WiFi", 499, "alta", 2024, "AM5", "X870E", "ATX"),
    mb("MSI MPG X870E Carbon WiFi", 499, "alta", 2024, "AM5", "X870E", "ATX"),
    mb("Gigabyte X870E Aorus Master", 499, "alta", 2024, "AM5", "X870E", "ATX"),
    mb("ASUS TUF Gaming X870-Plus WiFi", 299, "media-alta", 2024, "AM5", "X870", "ATX"),
    mb("MSI MAG X870 Tomahawk WiFi", 299, "media-alta", 2024, "AM5", "X870", "ATX"),
    mb("Gigabyte X870 Aorus Elite WiFi7", 289, "media-alta", 2024, "AM5", "X870", "ATX"),
    mb("ASUS ROG Strix X870-I Gaming WiFi", 399, "alta", 2024, "AM5", "X870", "Mini-ITX"),
    # AM5 - B850 / B840
    mb("ASUS ROG Strix B850-F Gaming WiFi", 259, "media-alta", 2025, "AM5", "B850", "ATX"),
    mb("ASUS TUF Gaming B850-Plus WiFi", 209, "media", 2025, "AM5", "B850", "ATX"),
    mb("MSI MAG B850 Tomahawk Max WiFi", 239, "media-alta", 2025, "AM5", "B850", "ATX"),
    mb("MSI PRO B850-P WiFi", 169, "media", 2025, "AM5", "B850", "ATX"),
    mb("Gigabyte B850 Aorus Elite WiFi7", 229, "media-alta", 2025, "AM5", "B850", "ATX"),
    mb("Gigabyte B850M Aorus Elite WiFi6E Ice", 199, "media", 2025, "AM5", "B850", "mATX"),
    mb("MSI MAG B850M Mortar WiFi", 199, "media", 2025, "AM5", "B850", "mATX"),
    mb("ASRock B850M Pro RS WiFi", 169, "media", 2025, "AM5", "B850", "mATX"),
    mb("MSI PRO B840-P WiFi", 129, "media-baja", 2025, "AM5", "B840", "ATX", pcie="4.0"),
    mb("ASUS Prime B840M-A WiFi", 129, "media-baja", 2025, "AM5", "B840", "mATX", pcie="4.0"),
    # AM4 (legacy económico)
    mb("Gigabyte B550M DS3H", 85, "baja", 2020, "AM4", "B550", "mATX", "DDR4", False, "4.0"),
    mb("ASUS TUF Gaming B550-Plus WiFi II", 150, "media-baja", 2021, "AM4", "B550", "ATX", "DDR4", True, "4.0"),
    # Intel LGA1851 - Z890 / B860
    mb("ASUS ROG Maximus Z890 Hero", 629, "entusiasta", 2024, "LGA1851", "Z890", "ATX"),
    mb("ASUS ROG Strix Z890-E Gaming WiFi", 499, "alta", 2024, "LGA1851", "Z890", "ATX"),
    mb("MSI MPG Z890 Carbon WiFi", 479, "alta", 2024, "LGA1851", "Z890", "ATX"),
    mb("MSI MAG Z890 Tomahawk WiFi", 329, "media-alta", 2024, "LGA1851", "Z890", "ATX"),
    mb("Gigabyte Z890 Aorus Elite WiFi7", 289, "media-alta", 2024, "LGA1851", "Z890", "ATX"),
    mb("MSI MAG B860 Tomahawk WiFi", 229, "media-alta", 2025, "LGA1851", "B860", "ATX"),
    mb("MSI PRO B860-P WiFi", 169, "media", 2025, "LGA1851", "B860", "ATX"),
    mb("ASUS Prime B860M-A WiFi", 159, "media", 2025, "LGA1851", "B860", "mATX"),
    # Intel LGA1700 (legacy)
    mb("MSI MAG B760 Tomahawk WiFi", 189, "media", 2023, "LGA1700", "B760", "ATX"),
    mb("ASUS Prime B760M-K D4", 99, "baja", 2023, "LGA1700", "B760", "mATX", "DDR4", False, "4.0"),
]

# ===================================================================== RAM


def ram(name, price, tier, year, rtype, gb, mods, mhz, cl, prof, rgb=False, form="DIMM"):
    return p(RAM, name, price, tier, year, ram_type=rtype, capacity_gb=gb, modules=mods,
             speed_mhz=mhz, cas_latency=cl, profile=prof, form_factor=form, rgb=rgb)


PRODUCTS += [
    ram("Corsair Vengeance DDR5 32GB (2x16GB) 6000MHz CL30 EXPO", 114, "media-alta", 2024, "DDR5", 32, 2, 6000, 30, "EXPO"),
    ram("Corsair Vengeance RGB DDR5 32GB (2x16GB) 6000MHz CL36", 105, "media", 2024, "DDR5", 32, 2, 6000, 36, "XMP", True),
    ram("Corsair Vengeance DDR5 64GB (2x32GB) 6000MHz CL30", 229, "alta", 2024, "DDR5", 64, 2, 6000, 30, "XMP"),
    ram("Corsair Vengeance DDR5 96GB (2x48GB) 6000MHz CL30", 329, "alta", 2024, "DDR5", 96, 2, 6000, 30, "XMP"),
    ram("Corsair Dominator Titanium RGB DDR5 64GB (2x32GB) 6600MHz CL32", 359, "entusiasta", 2024, "DDR5", 64, 2, 6600, 32, "XMP", True),
    ram("G.Skill Trident Z5 RGB DDR5 32GB (2x16GB) 6000MHz CL30", 124, "media-alta", 2023, "DDR5", 32, 2, 6000, 30, "XMP", True),
    ram("G.Skill Trident Z5 Neo RGB DDR5 32GB (2x16GB) 6000MHz CL30 EXPO", 129, "media-alta", 2023, "DDR5", 32, 2, 6000, 30, "EXPO", True),
    ram("G.Skill Trident Z5 RGB DDR5 64GB (2x32GB) 6400MHz CL32", 259, "alta", 2024, "DDR5", 64, 2, 6400, 32, "XMP", True),
    ram("G.Skill Ripjaws S5 DDR5 32GB (2x16GB) 6000MHz CL30", 109, "media", 2023, "DDR5", 32, 2, 6000, 30, "XMP"),
    ram("G.Skill Flare X5 DDR5 32GB (2x16GB) 6000MHz CL30 EXPO", 109, "media", 2023, "DDR5", 32, 2, 6000, 30, "EXPO"),
    ram("Kingston Fury Beast DDR5 16GB (1x16GB) 5600MHz CL40", 58, "baja", 2023, "DDR5", 16, 1, 5600, 40, "XMP"),
    ram("Kingston Fury Beast DDR5 32GB (2x16GB) 6000MHz CL36", 99, "media-baja", 2023, "DDR5", 32, 2, 6000, 36, "XMP"),
    ram("Kingston Fury Renegade DDR5 32GB (2x16GB) 6400MHz CL32", 149, "media-alta", 2023, "DDR5", 32, 2, 6400, 32, "XMP"),
    ram("Kingston Fury Renegade RGB DDR5 32GB (2x16GB) 7200MHz CL38", 169, "alta", 2024, "DDR5", 32, 2, 7200, 38, "XMP", True),
    ram("Crucial Pro DDR5 32GB (2x16GB) 6000MHz CL36", 99, "media", 2024, "DDR5", 32, 2, 6000, 36, "XMP+EXPO"),
    ram("Crucial Pro DDR5 64GB (2x32GB) 6000MHz CL36", 189, "alta", 2024, "DDR5", 64, 2, 6000, 36, "XMP+EXPO"),
    ram("Crucial DDR5 16GB (1x16GB) 5600MHz CL46", 48, "baja", 2023, "DDR5", 16, 1, 5600, 46, "JEDEC"),
    ram("Crucial DDR5 32GB (2x16GB) 5600MHz CL46", 89, "media-baja", 2023, "DDR5", 32, 2, 5600, 46, "JEDEC"),
    ram("TeamGroup T-Force Delta RGB DDR5 32GB (2x16GB) 6000MHz CL30", 114, "media-alta", 2023, "DDR5", 32, 2, 6000, 30, "XMP", True),
    ram("Lexar Ares RGB DDR5 32GB (2x16GB) 6000MHz CL30", 109, "media", 2024, "DDR5", 32, 2, 6000, 30, "XMP", True),
    ram("Patriot Viper Venom DDR5 32GB (2x16GB) 6000MHz CL30", 104, "media", 2023, "DDR5", 32, 2, 6000, 30, "XMP"),
    ram("XPG Lancer RGB DDR5 32GB (2x16GB) 6000MHz CL30", 109, "media", 2023, "DDR5", 32, 2, 6000, 30, "XMP+EXPO", True),
    ram("Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz CL16", 42, "baja", 2020, "DDR4", 16, 2, 3200, 16, "XMP"),
    ram("Corsair Vengeance LPX DDR4 32GB (2x16GB) 3200MHz CL16", 72, "baja", 2020, "DDR4", 32, 2, 3200, 16, "XMP"),
    ram("G.Skill Ripjaws V DDR4 32GB (2x16GB) 3600MHz CL18", 68, "media-baja", 2020, "DDR4", 32, 2, 3600, 18, "XMP"),
    ram("Kingston Fury Impact DDR5 SO-DIMM 32GB (2x16GB) 5600MHz CL40", 114, "media", 2023, "DDR5", 32, 2, 5600, 40, "XMP", form="SO-DIMM"),
    ram("Crucial DDR5 SO-DIMM 16GB (1x16GB) 5600MHz CL46", 52, "baja", 2023, "DDR5", 16, 1, 5600, 46, "JEDEC", form="SO-DIMM"),
]

# ============================================================ TARJETAS GRÁFICAS
# Datos comunes por chip. psu_w = fuente recomendada por el fabricante del chip.
CHIPS = {
    "5090": dict(vendor="NVIDIA", chip="GeForce RTX 5090", vram_gb=32, vram_type="GDDR7", tdp=575, psu_w=1000, power="1x 12V-2x6", pcie="5.0 x16", tier="entusiasta", year=2025),
    "5080": dict(vendor="NVIDIA", chip="GeForce RTX 5080", vram_gb=16, vram_type="GDDR7", tdp=360, psu_w=850, power="1x 12V-2x6", pcie="5.0 x16", tier="alta", year=2025),
    "5070ti": dict(vendor="NVIDIA", chip="GeForce RTX 5070 Ti", vram_gb=16, vram_type="GDDR7", tdp=300, psu_w=750, power="1x 12V-2x6", pcie="5.0 x16", tier="alta", year=2025),
    "5070": dict(vendor="NVIDIA", chip="GeForce RTX 5070", vram_gb=12, vram_type="GDDR7", tdp=250, psu_w=650, power="1x 12V-2x6", pcie="5.0 x16", tier="media-alta", year=2025),
    "5060ti16": dict(vendor="NVIDIA", chip="GeForce RTX 5060 Ti", vram_gb=16, vram_type="GDDR7", tdp=180, psu_w=600, power="1x 8-pin", pcie="5.0 x8", tier="media", year=2025),
    "5060ti8": dict(vendor="NVIDIA", chip="GeForce RTX 5060 Ti", vram_gb=8, vram_type="GDDR7", tdp=180, psu_w=600, power="1x 8-pin", pcie="5.0 x8", tier="media", year=2025),
    "5060": dict(vendor="NVIDIA", chip="GeForce RTX 5060", vram_gb=8, vram_type="GDDR7", tdp=145, psu_w=550, power="1x 8-pin", pcie="5.0 x8", tier="media-baja", year=2025),
    "5050": dict(vendor="NVIDIA", chip="GeForce RTX 5050", vram_gb=8, vram_type="GDDR6", tdp=130, psu_w=550, power="1x 8-pin", pcie="5.0 x8", tier="baja", year=2025),
    "4080s": dict(vendor="NVIDIA", chip="GeForce RTX 4080 Super", vram_gb=16, vram_type="GDDR6X", tdp=320, psu_w=750, power="12VHPWR", pcie="4.0 x16", tier="alta", year=2024),
    "4070tis": dict(vendor="NVIDIA", chip="GeForce RTX 4070 Ti Super", vram_gb=16, vram_type="GDDR6X", tdp=285, psu_w=700, power="12VHPWR", pcie="4.0 x16", tier="alta", year=2024),
    "4070s": dict(vendor="NVIDIA", chip="GeForce RTX 4070 Super", vram_gb=12, vram_type="GDDR6X", tdp=220, psu_w=650, power="12VHPWR", pcie="4.0 x16", tier="media-alta", year=2024),
    "9070xt": dict(vendor="AMD", chip="Radeon RX 9070 XT", vram_gb=16, vram_type="GDDR6", tdp=304, psu_w=750, power="2x 8-pin", pcie="5.0 x16", tier="alta", year=2025),
    "9070": dict(vendor="AMD", chip="Radeon RX 9070", vram_gb=16, vram_type="GDDR6", tdp=220, psu_w=650, power="2x 8-pin", pcie="5.0 x16", tier="media-alta", year=2025),
    "9060xt16": dict(vendor="AMD", chip="Radeon RX 9060 XT", vram_gb=16, vram_type="GDDR6", tdp=160, psu_w=450, power="1x 8-pin", pcie="5.0 x16", tier="media", year=2025),
    "9060xt8": dict(vendor="AMD", chip="Radeon RX 9060 XT", vram_gb=8, vram_type="GDDR6", tdp=150, psu_w=450, power="1x 8-pin", pcie="5.0 x16", tier="media-baja", year=2025),
    "7600xt": dict(vendor="AMD", chip="Radeon RX 7600 XT", vram_gb=16, vram_type="GDDR6", tdp=190, psu_w=600, power="1x 8-pin", pcie="4.0 x8", tier="media-baja", year=2024),
    "b580": dict(vendor="Intel", chip="Arc B580", vram_gb=12, vram_type="GDDR6", tdp=190, psu_w=600, power="1x 8-pin", pcie="4.0 x8", tier="media-baja", year=2024),
    "b570": dict(vendor="Intel", chip="Arc B570", vram_gb=10, vram_type="GDDR6", tdp=150, psu_w=550, power="1x 8-pin", pcie="4.0 x8", tier="baja", year=2025),
}


def gpu(name, price, key, **override):
    spec = {**CHIPS[key], **override}
    tier, year = spec.pop("tier"), spec.pop("year")
    return p(GPU, name, price, tier, year, **spec)


PRODUCTS += [
    gpu("NVIDIA GeForce RTX 5090 Founders Edition 32GB", 1999, "5090"),
    gpu("ASUS ROG Astral GeForce RTX 5090 OC Edition 32GB", 2799, "5090"),
    gpu("NVIDIA GeForce RTX 5080 Founders Edition 16GB", 999, "5080"),
    gpu("ASUS Prime GeForce RTX 5080 OC 16GB", 1099, "5080"),
    gpu("MSI GeForce RTX 5080 16G Ventus 3X OC", 1149, "5080"),
    gpu("ASUS TUF Gaming GeForce RTX 5070 Ti OC 16GB", 899, "5070ti"),
    gpu("MSI GeForce RTX 5070 Ti 16G Ventus 3X OC", 819, "5070ti"),
    gpu("Gigabyte GeForce RTX 5070 Ti Windforce OC SFF 16GB", 779, "5070ti"),
    gpu("NVIDIA GeForce RTX 5070 Founders Edition 12GB", 549, "5070"),
    gpu("MSI GeForce RTX 5070 12G Ventus 2X OC", 569, "5070"),
    gpu("ASUS Prime GeForce RTX 5070 OC 12GB", 599, "5070"),
    gpu("MSI GeForce RTX 5060 Ti 16G Ventus 2X OC", 449, "5060ti16"),
    gpu("Gigabyte GeForce RTX 5060 Ti Windforce OC 16GB", 439, "5060ti16"),
    gpu("ZOTAC Gaming GeForce RTX 5060 Ti Twin Edge OC 8GB", 399, "5060ti8"),
    gpu("MSI GeForce RTX 5060 8G Ventus 2X OC", 309, "5060"),
    gpu("Gigabyte GeForce RTX 5060 Windforce OC 8GB", 309, "5060"),
    gpu("ASUS Dual GeForce RTX 5050 8GB", 259, "5050"),
    gpu("Sapphire Nitro+ Radeon RX 9070 XT 16GB", 849, "9070xt", power="1x 12V-2x6"),
    gpu("Sapphire Pulse Radeon RX 9070 XT 16GB", 739, "9070xt"),
    gpu("PowerColor Hellhound Radeon RX 9070 XT 16GB", 699, "9070xt"),
    gpu("Sapphire Pulse Radeon RX 9070 16GB", 599, "9070"),
    gpu("PowerColor Reaper Radeon RX 9070 16GB", 579, "9070"),
    gpu("Sapphire Pulse Radeon RX 9060 XT 16GB", 389, "9060xt16"),
    gpu("XFX Swift Radeon RX 9060 XT 16GB", 379, "9060xt16"),
    gpu("PowerColor Reaper Radeon RX 9060 XT 8GB", 309, "9060xt8"),
    gpu("Intel Arc B580 Limited Edition 12GB", 249, "b580"),
    gpu("ASRock Arc B580 Challenger OC 12GB", 269, "b580"),
    gpu("Intel Arc B570 Limited Edition 10GB", 219, "b570"),
    gpu("ASUS TUF Gaming GeForce RTX 4080 Super OC 16GB", 1199, "4080s"),
    gpu("Gigabyte GeForce RTX 4070 Ti Super Windforce OC 16GB", 849, "4070tis"),
    gpu("MSI GeForce RTX 4070 Super 12G Ventus 2X OC", 599, "4070s"),
    gpu("Sapphire Pulse Radeon RX 7600 XT 16GB", 329, "7600xt"),
]

# ============================================================== ALMACENAMIENTO


def ssd(name, price, tier, year, iface, gb, read, kind="NVMe SSD", ff="M.2 2280"):
    return p(SSD, name, price, tier, year, storage_type=kind, interface=iface,
             form_factor=ff, capacity_gb=gb, read_mbs=read)


G5, G4, SATA = "PCIe 5.0 x4", "PCIe 4.0 x4", "SATA III"

PRODUCTS += [
    # PCIe 5.0
    ssd("Samsung 9100 Pro 1TB", 179, "alta", 2025, G5, 1000, 14700),
    ssd("Samsung 9100 Pro 2TB", 299, "alta", 2025, G5, 2000, 14700),
    ssd("Crucial T705 1TB", 189, "alta", 2024, G5, 1000, 13600),
    ssd("Crucial T705 2TB", 329, "entusiasta", 2024, G5, 2000, 14500),
    ssd("WD_BLACK SN8100 2TB", 349, "entusiasta", 2025, G5, 2000, 14900),
    ssd("Corsair MP700 PRO SE 2TB", 319, "entusiasta", 2024, G5, 2000, 14000),
    ssd("Kingston Fury Renegade G5 2TB", 299, "alta", 2025, G5, 2000, 14800),
    # PCIe 4.0
    ssd("Samsung 990 EVO Plus 1TB", 79, "media-baja", 2024, G4, 1000, 7150),
    ssd("Samsung 990 EVO Plus 2TB", 139, "media", 2024, G4, 2000, 7250),
    ssd("Samsung 990 Pro 2TB", 169, "media-alta", 2022, G4, 2000, 7450),
    ssd("WD_BLACK SN7100 1TB", 89, "media", 2025, G4, 1000, 7250),
    ssd("WD_BLACK SN7100 2TB", 149, "media-alta", 2025, G4, 2000, 7250),
    ssd("WD_BLACK SN850X 2TB", 149, "media-alta", 2022, G4, 2000, 7300),
    ssd("Crucial T500 1TB", 99, "media", 2023, G4, 1000, 7300),
    ssd("Crucial P310 1TB", 74, "media-baja", 2024, G4, 1000, 7100),
    ssd("Kingston NV3 1TB", 62, "baja", 2023, G4, 1000, 6000),
    ssd("Lexar NM790 1TB", 69, "media-baja", 2023, G4, 1000, 7400),
    ssd("Lexar NM790 2TB", 119, "media", 2023, G4, 2000, 7400),
    ssd("Crucial P3 Plus 1TB", 59, "baja", 2022, G4, 1000, 5000),
    ssd("WD Blue SN5000 1TB", 74, "media-baja", 2024, G4, 1000, 5150),
    # SATA y HDD
    ssd("Samsung 870 EVO 1TB", 94, "media-baja", 2021, SATA, 1000, 560, "SATA SSD", '2.5"'),
    ssd("Kingston A400 480GB", 36, "baja", 2019, SATA, 480, 500, "SATA SSD", '2.5"'),
    p(SSD, "Seagate BarraCuda 2TB 7200rpm", 59, "baja", 2019, storage_type="HDD",
      interface=SATA, form_factor='3.5"', capacity_gb=2000, rpm=7200, read_mbs=220),
    p(SSD, "WD Red Plus 4TB 5400rpm NAS", 105, "media-baja", 2023, storage_type="HDD",
      interface=SATA, form_factor='3.5"', capacity_gb=4000, rpm=5400, read_mbs=180),
    p(SSD, "Seagate IronWolf 8TB 7200rpm NAS", 175, "media", 2023, storage_type="HDD",
      interface=SATA, form_factor='3.5"', capacity_gb=8000, rpm=7200, read_mbs=250),
]

# ============================================================ FUENTES DE PODER


def psu(name, price, tier, watts, eff, atx="ATX 3.1", mod="full", ff="ATX", year=2024):
    return p(PSU, name, price, tier, year, watts=watts, efficiency=eff, modular=mod,
             atx_standard=atx, native_12v_2x6=atx in ("ATX 3.0", "ATX 3.1"), form_factor=ff)


G, B, PL = "80+ Gold", "80+ Bronze", "80+ Platinum"

PRODUCTS += [
    psu("Corsair RM1000x (2024) 1000W", 189, "alta", 1000, G),
    psu("Corsair RM850x (2024) 850W", 154, "media-alta", 850, G),
    psu("Corsair RM750e (2025) 750W", 109, "media", 750, G, year=2025),
    psu("Corsair RM650e (2025) 650W", 94, "media-baja", 650, G, year=2025),
    psu("Corsair CX650 650W", 74, "baja", 650, B, "ATX 2.x", "no", year=2023),
    psu("Corsair HX1200i (2025) 1200W", 259, "entusiasta", 1200, PL, year=2025),
    psu("Corsair HX1500i (2025) 1500W", 329, "entusiasta", 1500, PL, year=2025),
    psu("Corsair SF750 Platinum 750W", 169, "alta", 750, PL, "ATX 3.0", ff="SFX"),
    psu("MSI MAG A850GL PCIE5 850W", 119, "media-alta", 850, G, "ATX 3.0", year=2023),
    psu("MSI MPG A1000G PCIE5 1000W", 189, "alta", 1000, G, "ATX 3.0", year=2023),
    psu("MSI MAG A750BN PCIE5 750W", 79, "media-baja", 750, B, "ATX 3.0", "no", year=2023),
    psu("MSI MAG A650BN 650W", 59, "baja", 650, B, "ATX 2.x", "no", year=2021),
    psu("Seasonic Focus GX-850 850W", 149, "media-alta", 850, G, "ATX 3.0", year=2023),
    psu("Seasonic Vertex GX-1000 1000W", 219, "alta", 1000, G, "ATX 3.0"),
    psu("be quiet! Pure Power 12 M 750W", 109, "media", 750, G, "ATX 3.0", year=2023),
    psu("be quiet! Straight Power 12 1000W", 239, "alta", 1000, PL, "ATX 3.0", year=2023),
    psu("Thermaltake Toughpower GF A3 850W", 129, "media-alta", 850, G, "ATX 3.0"),
    psu("DeepCool PN850M 850W", 99, "media", 850, G),
    psu("NZXT C1000 Gold 1000W (2024)", 199, "alta", 1000, G),
    psu("Gigabyte UD850GM PG5 850W", 109, "media-alta", 850, G, "ATX 3.0", year=2023),
    psu("Cooler Master V850 SFX Gold 850W", 169, "alta", 850, G, "ATX 3.0", ff="SFX", year=2023),
]