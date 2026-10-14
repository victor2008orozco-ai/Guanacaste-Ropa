/* =========================================================
   CATÁLOGO DE PRODUCTOS · SOLO ROPA DE HOMBRE
   Para cambiar una imagen, reemplaza el ID de Unsplash
   o pon la ruta de tu propia foto, por ejemplo: "img/camisa.jpg"
   ========================================================= */

const img = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const CURRENCY = "$";        // Cambia por ₡, €, MXN, etc.
const FREE_SHIPPING = 80;    // Envío gratis desde este monto
const SHIPPING_COST = 6;     // Costo de envío normal
const COUPONS = {            // Códigos de descuento válidos
  MAREA10: 0.10,
  BIENVENIDA: 0.15,
};

const PRODUCTS = [
  {
    id: "p01", name: "Camisa Lino Arena", cat: "superior", price: 54, tags: ["nuevo"],
    img: img("photo-1596755094514-f87e34085b2c"),
    colors: ["#D9C9A8", "#FFFFFF", "#1E3A52"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    desc: "Lino lavado, manga larga que se puede remangar y cuello relajado. Fresca para todo el día.",
  },
  {
    id: "p02", name: "Traje Sastre Azul", cat: "sastreria", price: 210, tags: [],
    img: img("photo-1507679799987-c73779587ccf"),
    colors: ["#22355E", "#3A3A3A"],
    sizes: ["46", "48", "50", "52", "54"],
    desc: "Lana fría de temporada con saco y pantalón. Incluye un ajuste gratis en tienda.",
  },
  {
    id: "p03", name: "Camiseta Esencial", cat: "superior", price: 24, tags: [],
    img: img("photo-1521572163474-6864f9cf17ab"),
    colors: ["#FFFFFF", "#1B2420", "#5E6B3C"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    desc: "Algodón orgánico de 220 g. Cuello reforzado que no se deforma con los lavados.",
  },
  {
    id: "p04", name: "Chaqueta Cuero Noche", cat: "chaquetas", price: 145, oldPrice: 180, tags: ["oferta"],
    img: img("photo-1551028719-00167b16eac5"),
    colors: ["#1E1A1A", "#6B3E2E"],
    sizes: ["S", "M", "L", "XL"],
    desc: "Cuero suave con acabado mate y cierres metálicos. Se adapta a tu forma con el uso.",
  },
  {
    id: "p05", name: "Jeans Recto Índigo", cat: "pantalones", price: 58, tags: [],
    img: img("photo-1542272604-787c3835535d"),
    colors: ["#2E4A7D", "#5B7DB1"],
    sizes: ["28", "30", "32", "34", "36", "38"],
    desc: "Denim rígido de 13 oz con corte recto clásico. Se suaviza con cada puesta.",
  },
  {
    id: "p06", name: "Sudadera Base", cat: "superior", price: 46, tags: ["nuevo"],
    img: img("photo-1556905055-8f358a7a47b2"),
    colors: ["#9AA39A", "#1B2420", "#C2602E"],
    sizes: ["S", "M", "L", "XL"],
    desc: "Felpa francesa ligera con capucha forrada. Ideal para las noches frescas.",
  },
  {
    id: "p07", name: "Bomber Oliva", cat: "chaquetas", price: 88, tags: [],
    img: img("photo-1591047139829-d91aecb6caea"),
    colors: ["#5E6B3C", "#1B2420"],
    sizes: ["M", "L", "XL", "XXL"],
    desc: "Nylon resistente al agua con puños elásticos y bolsillo interior para el teléfono.",
  },
  {
    id: "p08", name: "Chino Slim Arena", cat: "pantalones", price: 52, tags: ["nuevo"],
    img: img("photo-1473966968600-fa801b869a1a"),
    colors: ["#C9B38A", "#1E3A52", "#5E6B3C"],
    sizes: ["28", "30", "32", "34", "36"],
    desc: "Gabardina de algodón con un toque de elasticidad. Va igual con tenis que con mocasines.",
  },
  {
    id: "p09", name: "Traje Gris Ciudad", cat: "sastreria", price: 189, oldPrice: 230, tags: ["oferta"],
    img: img("photo-1594938298603-c8148c4dae35"),
    colors: ["#6E7173", "#2B2F33"],
    sizes: ["46", "48", "50", "52"],
    desc: "Corte entallado en mezcla de lana. El saco también funciona solo con jeans.",
  },
  {
    id: "p10", name: "Tenis Paseo", cat: "accesorios", price: 72, tags: [],
    img: img("photo-1549298916-b41d501d3772"),
    colors: ["#C2602E", "#FFFFFF"],
    sizes: ["39", "40", "41", "42", "43", "44"],
    desc: "Suela de goma natural y plantilla acolchada. Para caminar todo el día.",
  },
  {
    id: "p11", name: "Reloj Clásico", cat: "accesorios", price: 98, oldPrice: 125, tags: ["oferta"],
    img: img("photo-1523170335258-f5ed11844a49"),
    colors: ["#2B2F33", "#B08D57"],
    sizes: ["Única"],
    desc: "Caja de acero de 40 mm, cristal de zafiro y correa de cuero intercambiable.",
  },
  {
    id: "p12", name: "Camisa Oxford", cat: "superior", price: 49, tags: [],
    img: img("photo-1602810318383-e386cc2a3ccf"),
    colors: ["#AFC3D9", "#FFFFFF"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    desc: "Algodón oxford con cuello de botones. La camisa que sirve para la oficina y el fin de semana.",
  },
  {
    id: "p13", name: "Mochila Urbana", cat: "accesorios", price: 64, tags: ["nuevo"],
    img: img("photo-1553062407-98eeb64c6a62"),
    colors: ["#1B2420", "#5E6B3C"],
    sizes: ["Única"],
    desc: "Lona encerada resistente al agua con compartimento acolchado para laptop de 15 pulgadas.",
  },
];

const CATEGORY_LABEL = {
  superior: "Camisas y camisetas",
  pantalones: "Pantalones",
  chaquetas: "Chaquetas",
  sastreria: "Sastrería",
  accesorios: "Accesorios",
};

const money = (n) => `${CURRENCY}${n.toFixed(2)}`;
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);