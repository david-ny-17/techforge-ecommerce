"""Catálogo parte 4: laptops gaming, ultrabooks y equipos de trabajo/estudio.

Precios en USD aproximados (varían mucho por configuración y país).
Las GPUs de laptop tienen menos VRAM que sus versiones de escritorio (ej. RTX 5070 Ti Laptop = 12GB).
"""
from ._helpers import LAPTOP, p

PRODUCTS = []


def lap(name, price, tier, year, use, cpu, gpu, ram, rtype, ssd, screen, res, hz, kg, panel="IPS"):
    return p(LAPTOP, name, price, tier, year, use=use, cpu=cpu, gpu=gpu, ram_gb=ram,
             ram_type=rtype, storage_gb=ssd, screen_in=screen, resolution=res,
             refresh_hz=hz, panel_type=panel, weight_kg=kg)


IGPU = "Gráficos integrados"

PRODUCTS += [
    # ------------------------------------------------------------- Gaming
    lap("ASUS ROG Strix SCAR 16 (2025)", 3499, "entusiasta", 2025, "gaming", "Intel Core Ultra 9 275HX", "NVIDIA GeForce RTX 5080 Laptop 16GB", 32, "DDR5", 2000, 16, "2560x1600", 240, 2.65, "OLED"),
    lap("ASUS ROG Zephyrus G16 (2025)", 2499, "alta", 2025, "gaming", "Intel Core Ultra 9 285H", "NVIDIA GeForce RTX 5070 Ti Laptop 12GB", 32, "LPDDR5X", 1000, 16, "2560x1600", 240, 1.95, "OLED"),
    lap("ASUS ROG Zephyrus G14 (2025)", 2049, "alta", 2025, "gaming", "AMD Ryzen AI 9 HX 370", "NVIDIA GeForce RTX 5070 Ti Laptop 12GB", 32, "LPDDR5X", 1000, 14, "2880x1800", 120, 1.5, "OLED"),
    lap("ASUS ROG Flow Z13 (2025)", 2199, "alta", 2025, "gaming", "AMD Ryzen AI Max+ 395", "AMD Radeon 8060S (integrada)", 32, "LPDDR5X", 1000, 13.4, "2560x1600", 180, 1.2),
    lap("ASUS TUF Gaming A14 (2024)", 1399, "media-alta", 2024, "gaming", "AMD Ryzen AI 9 HX 370", "NVIDIA GeForce RTX 4060 Laptop 8GB", 16, "LPDDR5X", 1000, 14, "2560x1600", 165, 1.46),
    lap("Lenovo Legion Pro 7i Gen 10 (2025)", 3199, "entusiasta", 2025, "gaming", "Intel Core Ultra 9 275HX", "NVIDIA GeForce RTX 5080 Laptop 16GB", 32, "DDR5", 1000, 16, "2560x1600", 240, 2.7, "OLED"),
    lap("Lenovo Legion 5i Gen 10 (2025)", 1599, "media-alta", 2025, "gaming", "Intel Core Ultra 7 255HX", "NVIDIA GeForce RTX 5070 Laptop 8GB", 16, "DDR5", 1000, 16, "2560x1600", 165, 2.4),
    lap("Lenovo LOQ 15IAX9 (2024)", 799, "media-baja", 2024, "gaming", "Intel Core i5-12450HX", "NVIDIA GeForce RTX 3050 Laptop 6GB", 12, "DDR5", 512, 15.6, "1920x1080", 144, 2.38),
    lap("MSI Titan 18 HX AI (2025)", 5300, "entusiasta", 2025, "gaming", "Intel Core Ultra 9 285HX", "NVIDIA GeForce RTX 5090 Laptop 24GB", 64, "DDR5", 2000, 18, "3840x2400", 120, 3.6, "Mini-LED"),
    lap("MSI Cyborg 15 AI (2024)", 1099, "media", 2024, "gaming", "Intel Core Ultra 7 155H", "NVIDIA GeForce RTX 4060 Laptop 8GB", 16, "DDR5", 512, 15.6, "1920x1080", 144, 2.0),
    lap("Acer Predator Helios Neo 16 AI (2025)", 1899, "media-alta", 2025, "gaming", "Intel Core Ultra 9 275HX", "NVIDIA GeForce RTX 5070 Laptop 8GB", 16, "DDR5", 1000, 16, "2560x1600", 240, 2.5),
    lap("Acer Nitro V 15 (2024)", 799, "media-baja", 2024, "gaming", "Intel Core i5-13420H", "NVIDIA GeForce RTX 4050 Laptop 6GB", 16, "DDR5", 512, 15.6, "1920x1080", 144, 2.1),
    lap("HP OMEN MAX 16 (2025)", 2800, "alta", 2025, "gaming", "Intel Core Ultra 9 275HX", "NVIDIA GeForce RTX 5080 Laptop 16GB", 32, "DDR5", 1000, 16, "2560x1600", 240, 2.7),
    lap("HP Victus 15 (2024)", 899, "media-baja", 2024, "gaming", "AMD Ryzen 5 8645HS", "NVIDIA GeForce RTX 4050 Laptop 6GB", 16, "DDR5", 512, 15.6, "1920x1080", 144, 2.3),
    lap("Alienware 16 Area-51 (2025)", 3199, "entusiasta", 2025, "gaming", "Intel Core Ultra 9 275HX", "NVIDIA GeForce RTX 5080 Laptop 16GB", 32, "DDR5", 2000, 16, "2560x1600", 240, 3.1),
    lap("Razer Blade 16 (2025)", 2999, "alta", 2025, "gaming", "AMD Ryzen AI 9 HX 370", "NVIDIA GeForce RTX 5070 Ti Laptop 12GB", 32, "LPDDR5X", 1000, 16, "2560x1600", 240, 2.14, "OLED"),
    # --------------------------------------------- Ultrabooks / trabajo / estudio
    lap("Apple MacBook Air 13 M4 (2025)", 999, "media-alta", 2025, "ultrabook", "Apple M4", IGPU + " (10 núcleos)", 16, "Memoria unificada", 256, 13.6, "2560x1664", 60, 1.24, "Liquid Retina"),
    lap("Apple MacBook Air 15 M4 (2025)", 1199, "alta", 2025, "ultrabook", "Apple M4", IGPU + " (10 núcleos)", 16, "Memoria unificada", 256, 15.3, "2880x1864", 60, 1.51, "Liquid Retina"),
    lap("Apple MacBook Pro 14 M4 (2024)", 1599, "alta", 2024, "trabajo", "Apple M4", IGPU + " (10 núcleos)", 16, "Memoria unificada", 512, 14.2, "3024x1964", 120, 1.55, "Liquid Retina XDR"),
    lap("Dell XPS 13 9350 (2024)", 1299, "alta", 2024, "ultrabook", "Intel Core Ultra 7 258V", IGPU + " Intel Arc 140V", 16, "LPDDR5X", 512, 13.4, "1920x1200", 120, 1.19),
    lap("Lenovo ThinkPad X1 Carbon Gen 13 Aura Edition (2025)", 2099, "alta", 2025, "trabajo", "Intel Core Ultra 7 258V", IGPU + " Intel Arc 140V", 32, "LPDDR5X", 1000, 14, "2880x1800", 120, 0.98, "OLED"),
    lap("Lenovo ThinkPad E14 Gen 6 (2024)", 899, "media", 2024, "trabajo", "Intel Core Ultra 5 125U", IGPU, 16, "DDR5", 512, 14, "1920x1200", 60, 1.41),
    lap("Lenovo Yoga Slim 7i Aura Edition (2025)", 1299, "media-alta", 2025, "ultrabook", "Intel Core Ultra 7 258V", IGPU + " Intel Arc 140V", 16, "LPDDR5X", 512, 15.3, "2880x1800", 120, 1.29, "OLED"),
    lap("Lenovo IdeaPad Slim 3 15 (2024)", 479, "baja", 2024, "estudio", "Intel Core i5-13420H", IGPU, 8, "DDR5", 512, 15.6, "1920x1080", 60, 1.62),
    lap("HP OmniBook Ultra 14 (2024)", 1499, "alta", 2024, "ultrabook", "AMD Ryzen AI 9 HX 375", IGPU + " Radeon 890M", 32, "LPDDR5X", 1000, 14, "2880x1800", 120, 1.41, "OLED"),
    lap("HP 15-fd0000 (2024)", 549, "baja", 2024, "estudio", "Intel Core i5-1335U", IGPU, 8, "DDR4", 512, 15.6, "1920x1080", 60, 1.59),
    lap("ASUS Zenbook S 14 UX5406 (2024)", 1499, "alta", 2024, "ultrabook", "Intel Core Ultra 7 258V", IGPU + " Intel Arc 140V", 32, "LPDDR5X", 1000, 14, "2880x1800", 120, 1.2, "OLED"),
    lap("ASUS Zenbook 14 OLED UX3405 (2024)", 1199, "media-alta", 2024, "ultrabook", "Intel Core Ultra 7 155H", IGPU + " Intel Arc", 16, "LPDDR5X", 1000, 14, "2880x1800", 120, 1.2, "OLED"),
    lap("ASUS Vivobook Go 15 (2023)", 499, "baja", 2023, "estudio", "AMD Ryzen 5 7520U", IGPU, 8, "LPDDR5", 512, 15.6, "1920x1080", 60, 1.63),
    lap("Acer Swift Go 14 (2024)", 899, "media", 2024, "ultrabook", "Intel Core Ultra 7 155H", IGPU + " Intel Arc", 16, "LPDDR5X", 512, 14, "2880x1800", 90, 1.32, "OLED"),
    lap("Acer Aspire 5 (2024)", 549, "media-baja", 2024, "estudio", "Intel Core i5-1335U", IGPU, 16, "DDR4", 512, 15.6, "1920x1080", 60, 1.76),
    lap("Microsoft Surface Laptop 7 13.8 (2024)", 1199, "alta", 2024, "ultrabook", "Snapdragon X Plus (10 núcleos)", IGPU + " Adreno", 16, "LPDDR5X", 512, 13.8, "2304x1536", 120, 1.34),
    lap("Samsung Galaxy Book4 Pro 14 (2024)", 1449, "alta", 2024, "ultrabook", "Intel Core Ultra 7 155H", IGPU + " Intel Arc", 16, "LPDDR5X", 512, 14, "2880x1800", 120, 1.23, "AMOLED"),
    lap("LG gram 16 (2024)", 1599, "alta", 2024, "ultrabook", "Intel Core Ultra 7 155H", IGPU + " Intel Arc", 16, "LPDDR5X", 512, 16, "2560x1600", 120, 1.2),
]