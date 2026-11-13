export type ObjectKind =
  | "cpu"
  | "motherboard"
  | "ram"
  | "gpu"
  | "storage"
  | "psu"
  | "case"
  | "cooler"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headset"
  | "microphone"
  | "laptop"
  | "accessory"

export interface ShowcaseItem {
  slug: string 
  name: string
  description: string
  kind: ObjectKind
  tilt: number 
}

export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    slug: "procesadores",
    name: "Procesadores",
    description: "El cerebro de tu equipo. AMD Ryzen e Intel Core Ultra para todas las gamas.",
    kind: "cpu",
    tilt: 0.55,
  },
  {
    slug: "placas-madre",
    name: "Placas Madre",
    description: "La base de todo tu setup. Sockets AM5, AM4, LGA1851 y LGA1700.",
    kind: "motherboard",
    tilt: 0.55,
  },
  {
    slug: "memoria-ram",
    name: "Memoria RAM",
    description: "Memorias DDR5 y DDR4 para que nada se trabe.",
    kind: "ram",
    tilt: 0.2,
  },
  {
    slug: "tarjetas-graficas",
    name: "Tarjetas Gráficas",
    description: "GPUs NVIDIA, AMD e Intel para jugar y crear sin límites.",
    kind: "gpu",
    tilt: 0.45,
  },
  {
    slug: "almacenamiento",
    name: "Almacenamiento",
    description: "SSD NVMe, SATA y discos duros de alta capacidad.",
    kind: "storage",
    tilt: 0.5,
  },
  {
    slug: "fuentes-de-poder",
    name: "Fuentes de Poder",
    description: "Energía estable y certificada 80 Plus para tus componentes.",
    kind: "psu",
    tilt: 0.25,
  },
  {
    slug: "gabinetes",
    name: "Gabinetes",
    description: "El hogar de tu PC: formatos ATX, mATX y Mini-ITX.",
    kind: "case",
    tilt: 0.08,
  },
  {
    slug: "refrigeracion",
    name: "Refrigeración",
    description: "Coolers de aire y líquida para mantener todo fresco.",
    kind: "cooler",
    tilt: 0.1,
  },
  {
    slug: "monitores",
    name: "Monitores",
    description: "Gamer, OLED y de productividad para ver cada detalle.",
    kind: "monitor",
    tilt: 0.05,
  },
  {
    slug: "teclados",
    name: "Teclados",
    description: "Mecánicos y de membrana para escribir y competir.",
    kind: "keyboard",
    tilt: 0.55,
  },
  {
    slug: "mouses",
    name: "Mouses",
    description: "Ligeros, ergonómicos y de máxima precisión.",
    kind: "mouse",
    tilt: 0.35,
  },
  {
    slug: "audifonos",
    name: "Audífonos",
    description: "Headsets gamer y audífonos para trabajo y estudio.",
    kind: "headset",
    tilt: 0.15,
  },
  {
    slug: "microfonos",
    name: "Micrófonos",
    description: "USB y XLR para streaming y podcasting.",
    kind: "microphone",
    tilt: 0.05,
  },
  {
    slug: "laptops",
    name: "Laptops",
    description: "Gamer, ultrabooks y equipos para trabajo y estudio.",
    kind: "laptop",
    tilt: 0.3,
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    description: "Webcams, mousepads, ventiladores y todo lo que completa tu setup.",
    kind: "accessory",
    tilt: 0.2,
  },
]