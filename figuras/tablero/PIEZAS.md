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

## Lo que encontró la auditoría, y por qué mejoró el dibujo

`node build.mjs --audit` mide la geometría registrada: 12 tubos, 69 sólidos,
8 segundos. La primera corrida dio **80 problemas**; la tercera, `audit passed`.

Los cuatro defectos que encontró **no se veían en siete capturas seguidas**,
miradas con atención:

- las seis fases atravesaban **su propio interruptor** — arrancaban 1 mm bajo la
  cara y el primer tramo salía por dentro del cuerpo;
- los seis neutros atravesaban la **barra de tierra entera**, bornes incluidos;
- los neutros se atravesaban **entre sí**: el que bajaba primero cruzaba la
  vertical del siguiente;
- un extremo asentado tiene que **salir perpendicular** de su mount: con 0,00 de
  distancia al borne, el chequeo de terminales seguía fallando hasta que el
  primer tramo fue vertical.

Y lo que importa más que la lista: **el dibujo mejoró obedeciendo a la
auditoría.** Los cables suben del borne, cruzan por encima del aparato y bajan a
la canaleta porque la auditoría forzó cada uno de esos tres tramos — y resulta
que es exactamente como se cablea un tablero de verdad. El instrumento no estaba
peleándose con el dibujo: estaba empujándolo hacia el objeto real.

Dos decisiones de montaje salieron de ahí y se quedan porque también son mejores
en la realidad: la barra de **neutro** va contra los rieles y la de **tierra**
contra el borde —al revés, la de tierra se cruza en el camino de los seis
neutros—, y las paredes de la canaleta se apoyan **sobre** su piso en vez de
hundirse en él.

## El conteo, medido

La lista de arriba cuenta 89 **piezas nombradas**, pero el renderer emite más,
porque las filas (24 bornes, 9 separadores) se expanden. Medido sobre la salida:
**~100 sólidos y 635 líneas**, contra los 53 sólidos y 470 paths del `test-rig`,
que es la vara del skill. Sobran volúmenes y falta línea; por eso el trabajo
pendiente es detalle, no más piezas.

La tapa no se dibuja en reposo: las dos salidas quietas —el `.svg` de la web y
el PNG de papel— necesitan ver el interior, así que levantarla al hover no
mostraría nada que el reposo no muestre. `--tapa` la devuelve.

## Nota histórica: el recorte que no hizo falta

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

**Ninguna de las dos hizo falta.** Medido al escribir el cableado: los seis
neutros como seis entidades son el mismo bucle sobre `M.derivaciones()` que ya
dibuja las fases, mientras que el haz único cuesta **más** —cada neutro termina
en su propio borne, así que un haz necesita el camino del haz *más* seis colas
de abanico—. Y los 5 sólidos que el recorte ahorraba son el 5 % del dibujo.

Cada tramo lleva `data-cable` y `data-tramo`, así que «haz» o «resaltables» es
una regla CSS y no geometría: si mañana se quiere B, no hay nada que reescribir.
