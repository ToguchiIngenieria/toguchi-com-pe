# Tablero 380/220 V — lista de piezas y plan del mundo

Figura de `figuras/tablero/`. Números de prueba, no de obra real; la tabla vive
en [model.mjs](model.mjs) y todo número que la figura muestre sale de ahí.

## El objeto es la explicación

No hay que inventar una metáfora: el objeto **es** un tablero. El mecanismo que
explica el concepto es el reparto de fases — el peine trifásico muerde una
pletina distinta por derivación, y por eso las tres fases no cargan igual.

**Qué se mueve y qué significa:** la tapa frontal se levanta y deja ver los
rieles; al pasar sobre una derivación se resalta su recorrido completo, del
diente del peine a su borne de salida, y el readout cambia de resumen
(corriente instalada por fase y desequilibrio) al detalle de ese circuito.

**La pieza `lit`** es el recorrido resaltado: diente del peine → pletina →
tramo de fase → cuerpo del aparato → borne. Una sola, y se mueve con el hover.

## Plan del mundo

- 1 unidad = 1 mm. Caja 300 (x) × 500 (y) × 120 (z).
- El tablero se mira **tumbado sobre su plano de montaje**: la chapa de fondo es
  el piso, los rieles corren en x, los módulos se alinean en x y la tapa se
  levanta en +z. Es la vista que deja ver el interior sin cortar nada.
- Cámara: azimut 45°, elevación 38° — más alta que el default de 30° porque hay
  que mirar *dentro* de la caja abierta, como el ripple tank a 44°.
- `fitProjection` sobre las esquinas de la ceja y la tapa levantada.
- Tonos: caja y chapa de fondo `lo`; rieles, barras y canaleta `mid`; aparatos
  `hi`; el recorrido resaltado `lit`. Monocromo: sin color de marca.

## Piezas

Conteo de sólidos. Las filas repetidas (tornillos, bornes) cuentan como una.

### Gabinete y tapa — 14
1. Cuerpo de la caja, chapa doblada, 300 × 500 × 120
2. Ceja perimetral de empotrar
3. Chapa de fondo perforada (placa de montaje)
4. Tapa frontal (se levanta al hover)
5. Recorte de la ventana de la tapa, con las paredes del rebaje dibujadas
6. Burlete de la ventana
7. Nudillo de bisagra inferior
8. Nudillo de bisagra superior
9. Pasador de bisagra
10. Pestillo de cierre
11. Tirador
12. Tapa ciega del riel 3 (reserva)
13. Placa de datos grabada, 3 líneas de regla — **la única palabra en el dibujo**
14. Fila de 4 tornillos de esquina (dots de 0.5 con anillo)

### Entrada — 9
15. Cuerpo hexagonal del prensaestopa PG29
16. Tuerca de apriete
17. Boquilla pasacables
18. Cable NYY 3x10 + 10, tubo con anillos de armadura
19–21. Tres conductores de fase saliendo del cable, a los bornes del general
22. Conductor de neutro, a la barra de neutro
23. Brida de amarre del cable de entrada

### Estructura — 24
24–26. Tres rieles DIN, perfil omega con sus dos doblados, 210 mm
27–32. Seis soportes de riel, dos por riel
33. Fila de tornillos de soporte
34. Canaleta vertical lateral
35. Tapa de la canaleta
36. Cuerpo aislante del peine trifásico
37–39. Tres pletinas del peine, una por fase, con sus dientes
40. Pletina de la barra de tierra
41–42. Dos soportes aislantes de la barra de tierra
43. Pletina de la barra de neutro
44–45. Dos soportes aislantes de la barra de neutro
46. Fila de 12 bornes de tierra
47. Fila de 12 bornes de neutro

### Aparatos — 27
48–51. General 3P: cuerpo de 3 módulos, palanca, ventana de estado, filas de bornes
52–53. Relé de tensión: cuerpo de 1 módulo, ventana del display
54. LED del relé
55–57. DPS 3P+N: cuerpo de 4 módulos, fila de 4 cartuchos, ventanas de testigo
58–60. Diferencial general 4P: cuerpo, palanca, botón de test
61–63. Diferencial de tomacorrientes 2P: cuerpo, palanca, botón de test
64–75. C1…C6: cuerpo y palanca de cada uno (12)

### Cableado THW-90 — 15
76–81. Seis tramos de fase: diente del peine → borne superior de la derivación
82–87. Seis tramos de neutro: borne inferior → barra de neutro
88–89. Dos tramos de tierra: gabinete y tapa → barra de tierra
90. Tres bridas sobre los haces

**Total: 89 sólidos.**

## El conteo no cabe en tramo Figure

Figure son 40–80 piezas y esto son 89. No es inflado: son 11 aparatos reales,
12 tramos de cable que el hover necesita uno por uno, y dos barras de bornes.

Dos salidas, y la decisión es del dueño de la figura:

**A. Recortar a ≤ 80, sin perder el mecanismo.** Los neutros pasan de seis
tramos a un haz único con seis chunks (−5), los cartuchos del DPS y sus
ventanas se unifican en una fila (−1), la canaleta pierde su tapa (−1), la
bisagra pasa de tres piezas a dos (−1) y los tres conductores de fase de la
entrada se dibujan como un haz de tres chunks (−2). Quedan **79**. Se pierde
poder resaltar el neutro de un circuito por separado; el recorrido de fase, que
es lo que el hover explica, queda intacto.

**B. Subir a Hero** (80–150 piezas, 2–4 h): entran los 89 y además la segunda
mitad del detalle a 4× — tornillos de cada aparato, rotulado de pletinas,
peine con sus apoyos, bornes con su tornillo.

Por defecto va **A**, que es lo que mantiene el tramo acordado.
