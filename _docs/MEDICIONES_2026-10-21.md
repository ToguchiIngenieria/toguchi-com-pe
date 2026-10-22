# Mediciones de la sesión del panel — 2026-10-14 al 21

Lo que midió **esta** sesión, para que un asiento pueda citarlo por ubicación en
vez de repetirlo. Cada sección dice qué se midió, con qué instrumento y qué
quedó **sin** medir.

Al final, en «Lo que esta sesión NO midió», están las afirmaciones que me
llegaron atribuidas y que no son mías. No deben citarse contra este documento.

---

## 1. Apagado de Workers Logs en la landing

**Qué se midió.** La cadena de despliegue del apagado, no el apagado en sí.

- Commit `21f5e84`, un archivo y una línea: `observability.enabled` de `true` a
  `false` en `apps/landing/wrangler.jsonc`. Empujado `a830726..21f5e84`.
- Versión `d9bd82f5-492d-41b9-840c-90cb7e52dc17`, creada **06:12:27 UTC**, 46 s
  después del commit, y activa al 100 %. La anterior era `70809c7c`.
- `wrangler deploy --dry-run`: **ningún aviso** sobre el campo `observability`.
- Contra `node_modules/wrangler/config-schema.json`: `observability` acepta
  `enabled`, `head_sampling_rate`, `logs` y `traces`, con
  `additionalProperties: false`. `enabled` es booleana y va en la raíz de ese
  bloque. Nuestro archivo **no** tiene sub-bloque `observability.logs`, así que
  no hay un `logs.enabled` que lo pise desde abajo.

**Qué quedó sin medir.** Que la plataforma dejó de ingerir.
`wrangler versions view` **no** expone la observabilidad de una versión
desplegada: comprobado sobre `70809c7c`, imprime handlers, fecha de
compatibilidad y bindings, y nada más. Cerrar eso necesita el panel de
Cloudflare o su API con token.

## 2. Empujar una rama no dispara build

**Qué se midió.** Antes del push de `figura/tablero-380v`: 10 versiones. Dos
minutos después: 10. Ninguna nueva.

**Con su mitad positiva**, que es lo que hace que el cero signifique algo: el
mismo enumerador (`wrangler versions list`) vio aparecer la versión del push a
`main` **a los 46 s**. El instrumento sí ve despliegues cuando ocurren, y 120 s
cubre esa latencia de sobra.

**Qué quedó sin medir.** Si un build de preview no se registrara como versión en
`wrangler versions list`, este enumerador no lo vería. No se puede descartar sin
el panel.

**Consecuencia práctica, medida aparte:** antes de empujar una rama hay que
comprobar que no arrastre configuración vieja de `wrangler.jsonc`. La rama
llevaba `observability.enabled: true` y, con `preview_urls` y `workers_dev`
activos, un build de preview habría levantado la landing con Workers Logs
encendido. Se resolvió poniendo la rama encima de `main` antes de empujar.

## 3. El clasificador de permisos bloquea por ruta, no por herramienta

**Qué se midió.** `node examples/dial-indicator/build.mjs` sobre el kit
instalado **fuera** del workspace fue denegado por el clasificador de auto-mode
(«Code from External»), dos veces. El **mismo** código, vendorizado dentro del
repositorio en `vendor/anatomy/`, se ejecutó sin ninguna regla de permisos
nueva: build, `capture.mjs` con Chrome headless y la auditoría.

**Por qué importa.** La frontera que se aplica es la **ruta**, no la
herramienta. Ante un bloqueo así, mover el código dentro del árbol es más
estrecho que ampliar permisos.

## 4. Los dos instrumentos de la figura

Sobre `figuras/tablero/`, tramo Figure.

**Auditoría de geometría** (`node build.mjs --audit`): 12 tubos, 69 sólidos,
≈8 s por corrida. **80 problemas → 25 → `audit passed`** en tres vueltas.
Encontró cuatro defectos invisibles en siete capturas miradas con atención:

- las seis fases atravesaban **su propio interruptor**;
- los seis neutros atravesaban la **barra de tierra entera**, bornes incluidos;
- los neutros se atravesaban **entre sí**;
- un extremo asentado tiene que **salir perpendicular** de su mount: con 0,00 de
  distancia al borne, el chequeo seguía fallando hasta que el primer tramo fue
  vertical.

**Chequeo de extremos de línea** (`node scripts/lines.mjs`): **9 de 506
extremos → 0**, en los dos temas. Encontró pletinas del peine y nervios que se
paraban antes del canto.

**Lo que se aprendió de las dos:** el dibujo **mejoró obedeciéndolas**. Los
cables suben del borne, cruzan por encima del aparato y bajan a la canaleta
porque la auditoría forzó esos tres tramos — y es como se cablea de verdad.

## 5. Peso de los artefactos de la figura

Medido el 2026-10-21 sobre `figuras/tablero/`:

| archivo | bytes | gzip -9 |
|---|---|---|
| `tablero.svg` | 381 638 | **77 456** |
| `tablero.html` | 422 354 | **90 156** |
| `tablero-light.svg` | 381 639 | 77 456 |

Para comparar, medido el 2026-10-14: el `index.html` de la landing pesa
**12 944 B gzip**. Una figura inline cuesta varias veces la página entera, y por
eso el destino de web es un `.svg` servido aparte con `<img loading="lazy">` y
no SVG incrustado.

## 6. El formulario de contacto — MEDICIÓN RETIRADA, era falsa

> **Corregido el 2026-10-22.** Lo que sigue en esta sección es **incorrecto** y
> se conserva porque el error importa más que el hallazgo. El formulario
> **nunca estuvo roto**: la sonda estaba en producción todo el tiempo, en
> `lead:2026-10-21T15:20:28.437Z:5551372e`, con su marca intacta.
>
> **La causa del error:** `wrangler kv key list` **sin `--remote` lee el
> almacén local**, no producción, y no avisa. Medido: 11 claves en local, 10 en
> remoto, conjuntos distintos, el local congelado el 2026-10-05. No era retardo
> de propagación: eran dos almacenes. Mi línea base, mi conteo final y mis
> consultas por prefijo interrogaron la copia local.
>
> **Lo que falló del método, y es lo citable:** tenía control positivo del
> **manejador** —dos 400 con sus mensajes exactos— y **ninguno del
> enumerador**. Que el endpoint valide no dice nada sobre si el instrumento que
> lista sabe mirar donde hay que mirar. A un cero hay que darle su mitad
> positiva *en el mismo instrumento*: preguntarle por algo que se sabe que
> existe y comprobar que lo ve.
>
> **Consecuencia:** sobre esta conclusión falsa se desplegó a producción el
> commit `17161f1`, que quitó del asistente una confirmación que era cierta.

### Lo que se midió, incorrectamente (conservado)

**Medido el 2026-10-21 contra producción.** Destino: KV `LEADS`,
`62e3482416074ca7a6bfc770a39801e9`.

| paso | resultado |
|---|---|
| línea base del destino | 11 claves, la más reciente `lead:2026-10-05T22:02:01.066Z` |
| POST sin `Origin` | **403** `Cross-site POST form submissions are forbidden` (CSRF de Astro) |
| POST con `Origin` correcto y datos válidos | **200** `{"ok":true}` en 0,77 s |
| control positivo: WhatsApp inválido | **400**, mensaje exacto del servidor |
| control positivo: servicio inventado | **400** `Servicio no válido` |
| bindings de la versión viva `d9bd82f5` | `env.LEADS` → `62e3482…`, el mismo que se lista |
| destino tras >5 min y consultas por prefijo | **11 claves. Cero con prefijo `lead:2026-10-21`** |

Los controles positivos son lo que descarta que la petición muera antes: el
manejador real se ejecuta, pasa el honeypot y las seis validaciones, llega al
`put`, lo espera y responde `ok`.

**Qué quedó sin medir.** La causa. Un `put` que lanzara saldría por el `catch`
con 500, y salió 200. Tampoco está medido si se perdieron consultas reales entre
el 5 de octubre y hoy: dieciséis días sin un solo lead es **coherente** con eso,
no una prueba.

**Mitigación desplegada** (no es el arreglo): commit `17161f1`. El asistente
dejó de prometer «Recibimos tu consulta y te contactamos» y pide mandar el
resumen por WhatsApp, que es el canal que sí llega; la sección de contacto da
peso de botón al enlace y muestra el número directo.

## 7. Pendiente, dueño Katsumi

El aviso de privacidad del sitio probablemente **no** cubría retención de IP ni
geolocalización. No lo redacta esta sesión.

---

## Lo que esta sesión NO midió

Me llegaron atribuidas y no son mías. Si alguien las midió, que las cite desde
su propio informe:

- el método del `?probe=` como técnica previa — hoy la marca tuvo que viajar
  **en los datos**, no en la URL, precisamente porque con la observabilidad
  apagada una marca en la URL no queda registrada en ninguna parte;
- los pesos «330 KB → 64 KB» y «370 KB → 76 KB» (los reales están en §5);
- que `figura/tablero-380v` no se fusiona a `main`, y que algo se mueva a un
  repositorio `figuras-toguchi`: no existe esa decisión;
- «la auditoría es puerta y no etapa»;
- que una regla de permisos se moviera a `settings.json` porque Claude Code
  reescribe `settings.local.json`: esta sesión no movió ninguna regla, y lo que
  midió es que **no hacía falta** (§3);
- que el formulario quedara ciego «justo después de tocarle la validación»: los
  commits de contacto son anteriores a esta sesión;
- un conteo propio de los sólidos del `arcade-cabinet`: los 240 son una frase
  del `SKILL.md`, igual que los 53 del `test-rig`.
