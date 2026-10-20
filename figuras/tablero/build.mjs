// Tablero de distribución 380/220 V — figura isométrica.
// Números de prueba. Todo lo que la figura muestra sale de model.mjs.
//
//   node build.mjs            página oscura + tablero.svg
//   node build.mjs --light    página clara (la del PNG de papel)

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { fillet } from "../../vendor/anatomy/kit/lathe.mjs";
import { tubePieces, tubeSvg } from "../../vendor/anatomy/kit/tube.mjs";
import * as A from "../../vendor/anatomy/kit/audit.mjs";
import { kitScript } from "../../vendor/anatomy/scripts/inline-kit.mjs";
import * as M from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const CON_TAPA = process.argv.includes("--tapa");
const ACTIVO = "C3"; // el circuito encendido en reposo, el mismo que pide el PNG de papel

const WIDTH = 650;
const HEIGHT = 520;

// El tablero se mira tumbado sobre su plano de montaje: la chapa de fondo es
// el piso, los rieles corren en x, la tapa se levanta en +z.
const CAJA = { x: -150, y: -250, w: 300, d: 500, r: 6 };
const PARED = 6; // espesor de la chapa doblada
const ALTO = 120; // fondo del gabinete
const FONDO_Z = 3; // chapa de montaje perforada

// La entrada va arriba del tablero, y "arriba" cae en la pared lejana de la
// cámara: así la cabecera no queda detrás de una pared cercana.
const RIEL_Y = { "riel-1": -120, "riel-2": -10, "riel-3": 100 }; // centro de cada riel
const RIEL_ANCHO = 35; // perfil DIN
const RIEL_Z0 = 18; // sobre separadores
const RIEL_Z1 = 25.5;
const RIEL_X0 = -M.RIEL.largo / 2; // 210 mm centrados

const APARATO_D = 45; // alto de cara de un módulo DIN
const CUERPO_Z = RIEL_Z1 + 40;
const FRENTE_Z = CUERPO_Z + 8;

const PEINE_Y = -32; // sobre los bornes superiores del riel 2
const PEINE_Z = CUERPO_Z - 6;

// El neutro va más cerca de los rieles y la tierra contra el borde: al revés,
// la barra de tierra queda en medio del camino de todos los neutros.
const BARRA = { neutro: 185, tierra: 215 };
const BARRA_Z1 = 24;

const TAPA_Z = 168; // levantada sobre el borde
const ENTRADA = [0, -235]; // prensaestopa en la pared superior, la lejana

const P = k.fitProjection(
	[...k.boxCorners(CAJA, 0, ALTO), ...(CON_TAPA ? k.boxCorners(CAJA, TAPA_Z, TAPA_Z + 10) : [])],
	WIDTH,
	HEIGHT,
	{ pad: 26, azimuth: 45, elevation: 46 },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

// El registro de la auditoría. `slab` y `cyl` dibujan y registran del MISMO
// parámetro: así la forma auditada es la dibujada y no una de relleno, que es
// el error que el propio kit dice que la auditoría debe fallar.
const R = A.recorder(P);

function slab(plan, z, h, { tone, lit, crease, r = 2, bevel = 0.5, name, ground }) {
	R.solid(A.slab(plan, z, h, { name: R.nameFor(name), ...(ground ? { ground: true } : {}) }));
	return S(k.slabOf(plan, z, h, P, r, bevel), { tone, lit, crease });
}

function cyl(cx, cy, rad, z, h, { tone, crease, steps = 20, name }) {
	R.solid(A.cylinder(cx, cy, rad, z, h, { name: R.nameFor(name) }));
	return S(k.cylinder(cx, cy, rad, z, h, P, steps), { tone, crease });
}

const paredes = () => [
	{ id: "y-", plan: { x: CAJA.x, y: CAJA.y, w: CAJA.w, d: PARED, r: 1 }, c: [0, CAJA.y] },
	{ id: "y+", plan: { x: CAJA.x, y: CAJA.y + CAJA.d - PARED, w: CAJA.w, d: PARED, r: 1 }, c: [0, CAJA.y + CAJA.d] },
	{ id: "x-", plan: { x: CAJA.x, y: CAJA.y, w: PARED, d: CAJA.d, r: 1 }, c: [CAJA.x, 0] },
	{ id: "x+", plan: { x: CAJA.x + CAJA.w - PARED, y: CAJA.y, w: PARED, d: CAJA.d, r: 1 }, c: [CAJA.x + CAJA.w, 0] },
];

const RECORTE = 28; // zócalo al que se cortan las paredes cercanas

/**
 * Las dos paredes lejanas van antes del contenido y enteras —son las que
 * sostienen el prensaestopa—; las dos cercanas van después y cortadas a un
 * zócalo, que es lo que deja ver el mecanismo. Es un corte, no una omisión:
 * el canto del corte se dibuja.
 */
function paredesPorDepth() {
	const orden = paredes().sort((a, b) => k.depthOf([a.c[0], a.c[1], 0], P) - k.depthOf([b.c[0], b.c[1], 0], P));
	return {
		lejos: orden.slice(0, 2).map((w) => ({ ...w, alto: ALTO })),
		cerca: orden.slice(2).map((w) => ({ ...w, alto: RECORTE })),
	};
}

function muro(w) {
	const out = [S(k.slabOf(w.plan, 0, w.alto, P, 2, 0.8), { tone: "lo" })];
	// pliegue de la chapa a lo largo del canto, y los tornillos del doblez
	out.push(L(k.planOutline(k.insetPlan(w.plan, 1.2), w.alto, P, 1), { tone: "faint" }));
	const largo = Math.max(w.plan.w, w.plan.d);
	const horizontal = w.plan.w > w.plan.d;
	const tornillos = [];
	for (let i = 0; i < 5; i++) {
		const t = (i + 0.5) / 5;
		const x = horizontal ? w.plan.x + t * largo : w.plan.x + w.plan.w / 2;
		const y = horizontal ? w.plan.y + w.plan.d / 2 : w.plan.y + t * largo;
		tornillos.push(at([x, y, w.alto]));
	}
	out.push(D(tornillos, { size: 0.45, tone: "lo" }));
	return out.join("");
}

function fondo() {
	const out = [`<path class="iso-halo" d="${k.haloOf(CAJA, 0, 6, P)}"/>`];
	// ceja perimetral de empotrar
	out.push(S(k.slabOf(k.insetPlan(CAJA, -10), 0, 4, P, 6, 0.8), { tone: "lo" }));
	// chapa de fondo perforada: es el suelo de todo lo que va dentro
	out.push(slab(k.insetPlan(CAJA, PARED), 0, FONDO_Z, { tone: "lo", r: 4, bevel: 0.5, name: "caja.fondo", ground: true }));
	const tornillos = k.corners(k.insetPlan(CAJA, 18), 0);
	out.push(L(tornillos.map(([x, y]) => k.ring(x, y, 3, FONDO_Z, P, 16)).join(""), { tone: "lo" }));
	out.push(D(tornillos.map(([x, y]) => at([x, y, FONDO_Z])), { size: 0.5 }));
	// Ranuras de montaje de la chapa perforada, en los dos márgenes libres.
	// Son ranuras cerradas: empiezan y terminan en su propio contorno.
	for (const x of [CAJA.x + 22, CAJA.x + CAJA.w - 34]) {
		for (let i = 0; i < 9; i++) {
			const y = -200 + i * 50;
			out.push(L(k.planOutline({ x, y, w: 12, d: 5, r: 2.5 }, FONDO_Z, P, 2), { tone: "faint" }));
		}
	}
	// placa de datos grabada: la única palabra del dibujo
	const placa = { x: CAJA.x + 24, y: -238, w: 86, d: 22, r: 1.5 };
	out.push(S(k.slabOf(placa, FONDO_Z, 1.2, P, 2), { tone: "mid", crease: "none" }));
	for (let i = 0; i < 3; i++) {
		const y = placa.y + 6 + i * 5;
		out.push(L(k.lineOnTop([placa.x + 5, y], [placa.x + placa.w - (i === 2 ? 34 : 8), y], FONDO_Z + 1.2, P), { tone: "lo", free: true }));
	}
	return out.join("");
}

function rieles() {
	const out = [];
	for (const [id, cy] of Object.entries(RIEL_Y)) {
		const plan = { x: RIEL_X0, y: cy - RIEL_ANCHO / 2, w: M.RIEL.largo, d: RIEL_ANCHO, r: 0.5 };
		// separadores
		for (const x of [RIEL_X0 + 12, 0, RIEL_X0 + M.RIEL.largo - 12]) {
			out.push(slab({ x: x - 7, y: cy - 9, w: 14, d: 18, r: 1 }, FONDO_Z, RIEL_Z0 - FONDO_Z, { tone: "lo", r: 2, bevel: 0.4, name: `${id}.separador` }));
			out.push(D([at([x, cy, RIEL_Z0])], { size: 0.45, tone: "lo" }));
		}
		// perfil omega: alma y dos alas
		out.push(slab(plan, RIEL_Z0, RIEL_Z1 - RIEL_Z0, { tone: "mid", r: 1, bevel: 0.4, name: `${id}.perfil` }));
		out.push(L(k.planOutline(k.insetPlan(plan, 5), RIEL_Z1, P, 1), { tone: "faint" }));
		// ranuras del riel, de ala a ala
		const ranuras = [];
		for (let x = RIEL_X0 + 10; x < RIEL_X0 + M.RIEL.largo - 6; x += 25) {
			ranuras.push(k.lineOnTop([x, plan.y + 5], [x, plan.y + plan.d - 5], RIEL_Z1, P));
		}
		out.push(L(ranuras.join(""), { tone: "lo" }));
		if (id === "riel-3") {
			// tapa ciega de reserva
			out.push(slab({ x: RIEL_X0, y: cy - APARATO_D / 2, w: M.RIEL.largo, d: APARATO_D, r: 1 }, RIEL_Z1, 14, { tone: "lo", r: 2, bevel: 0.6, name: "riel-3.tapa-ciega" }));
			out.push(L(k.planOutline(k.insetPlan({ x: RIEL_X0, y: cy - APARATO_D / 2, w: M.RIEL.largo, d: APARATO_D, r: 1 }, 6), RIEL_Z1 + 14, P, 2), { tone: "faint" }));
		}
	}
	return out.join("");
}

function barras() {
	const out = [];
	for (const [nombre, cy] of Object.entries(BARRA)) {
		const plan = { x: RIEL_X0 + 6, y: cy - 7, w: M.RIEL.largo - 12, d: 14, r: 1 };
		// soportes aislantes
		for (const x of [plan.x + 8, plan.x + plan.w - 8]) {
			out.push(cyl(x, cy, 7, FONDO_Z, RIEL_Z0 - FONDO_Z, { tone: "lo", name: `barra-${nombre}.soporte` }));
		}
		out.push(slab(plan, RIEL_Z0, BARRA_Z1 - RIEL_Z0, { tone: "mid", r: 1, bevel: 0.4, name: `barra-${nombre}.pletina` }));
		// 12 bornes con su tornillo
		const n = M.BARRAS[nombre].bornes;
		const paso = (plan.w - 14) / (n - 1);
		const bornes = [];
		for (let i = 0; i < n; i++) {
			const x = plan.x + 7 + i * paso;
			out.push(slab({ x: x - 4, y: cy - 5, w: 8, d: 10, r: 0.6 }, BARRA_Z1, 7, { tone: "mid", r: 1, bevel: 0.3, name: `barra-${nombre}.borne` }));
			bornes.push(at([x, cy, BARRA_Z1 + 7]));
		}
		out.push(D(bornes, { size: 0.5, tone: "lo" }));
	}
	return out.join("");
}

/** Los aparatos de un riel, con el cuerpo, el frente y la palanca. */
function aparatos(rielId) {
	const cy = RIEL_Y[rielId];
	const out = [];
	for (const a of M.posiciones(rielId)) {
		const x0 = RIEL_X0 + a.x;
		const plan = { x: x0 + 0.6, y: cy - APARATO_D / 2, w: a.ancho - 1.2, d: APARATO_D, r: 1 };
		const deriv = a.tipo === "derivacion";
		const tone = deriv ? "hi" : "mid";
		const activo = a.id === ACTIVO; // el circuito encendido en reposo
		out.push(`<g data-aparato="${a.id}">`);
		out.push(slab(plan, RIEL_Z1, CUERPO_Z - RIEL_Z1, { tone, lit: activo, r: 1.5, bevel: 0.5, name: `${a.id}.cuerpo` }));
		// frente escalonado, más alto en el centro
		const frente = { x: plan.x, y: cy - 11, w: plan.w, d: 22, r: 1 };
		out.push(slab(frente, CUERPO_Z, FRENTE_Z - CUERPO_Z, { tone, lit: activo, r: 1, bevel: 0.4, name: `${a.id}.frente` }));
		// junta entre módulos de un cuerpo de 2 o 3: de canto a canto de la cara
		for (let i = 1; i < a.mod; i++) {
			const x = plan.x + i * M.RIEL.modulo - 0.6;
			out.push(L(k.lineOnTop([x, plan.y], [x, frente.y], CUERPO_Z, P), { tone: "faint" }));
			out.push(L(k.lineOnTop([x, frente.y + frente.d], [x, plan.y + plan.d], CUERPO_Z, P), { tone: "faint" }));
			out.push(L(k.lineOnTop([x, frente.y], [x, frente.y + frente.d], FRENTE_Z, P), { tone: "faint" }));
		}
		// ranuras de los bornes, arriba y abajo, con el tornillo de cada polo
		for (const y of [plan.y + 5, plan.y + plan.d - 5]) {
			out.push(L(k.lineOnTop([plan.x + 1.5, y], [plan.x + plan.w - 1.5, y], CUERPO_Z, P), { tone: "lo" }));
			const tornillos = [];
			for (let p = 0; p < a.polos && p < a.mod; p++) {
				const x = plan.x + (p + 0.5) * (plan.w / Math.min(a.polos, a.mod));
				tornillos.push(k.ring(x, y, 1.9, CUERPO_Z, P, 12));
			}
			out.push(L(tornillos.join(""), { tone: "lo" }));
			out.push(D(tornillos.map((_, p) => at([plan.x + (p + 0.5) * (plan.w / Math.min(a.polos, a.mod)), y, CUERPO_Z])), { size: 0.42, tone: "lo" }));
		}
		// El acento: el contorno del aparato encendido, en línea `lit`. El sólido
		// con `lit` solo levanta el cuerpo un punto; el blanco es tono de línea.
		if (deriv) {
			out.push(
				`<path class="iso-line" data-outline="${a.id}" data-tone="${activo ? "lit" : "faint"}" style="stroke-width:${activo ? 1.2 : 0.7}" d="${k.planOutline(k.insetPlan(plan, 1.2), CUERPO_Z, P, 1.5)}"/>`,
			);
		}
		// tres rayas de rótulo grabado en la cara del frente
		for (let i = 0; i < 3; i++) {
			const y = frente.y + 5 + i * 4;
			out.push(L(k.lineOnTop([plan.x + 2.5, y], [plan.x + plan.w - (i === 2 ? plan.w * 0.45 : 2.5), y], FRENTE_Z, P), { tone: "faint", free: true }));
		}
		// palanca
		const px = plan.x + plan.w / 2;
		out.push(S(k.slabOf({ x: px - 2.6, y: cy - 4, w: 5.2, d: 9, r: 1 }, FRENTE_Z, 6, P, 1, 0.3), { tone: "hi" }));
		out.push(L(k.lineOnTop([px - 2, cy + 1], [px + 2, cy + 1], FRENTE_Z + 6, P), { tone: "mid" }));
		// botón de test en los diferenciales
		if (a.tipo === "diferencial") {
			out.push(S(k.cylinder(plan.x + plan.w - 6, cy + 14, 2.6, CUERPO_Z, 3, P, 16), { tone: "hi" }));
		}
		// ventanas de testigo del DPS, una por cartucho
		if (a.tipo === "dps") {
			for (let i = 0; i < 4; i++) {
				const vx = plan.x + 4 + i * (plan.w - 8) / 3.4;
				out.push(S(k.slabOf({ x: vx, y: cy + 12, w: 7, d: 7, r: 0.8 }, CUERPO_Z, 1.2, P, 1), { tone: "lo", crease: "none" }));
			}
		}
		// ventana del display del relé
		if (a.tipo === "rele") {
			out.push(S(k.slabOf({ x: plan.x + 2, y: cy + 6, w: plan.w - 4, d: 12, r: 0.8 }, CUERPO_Z, 1, P, 1), { tone: "lo", crease: "none" }));
			out.push(D([at([plan.x + plan.w / 2, cy - 14, CUERPO_Z])], { size: 0.6, tone: "hi" }));
		}
		out.push(`</g>`);
	}
	return out.join("");
}

/** Peine trifásico sobre los bornes superiores del riel 2. */
function peine() {
	const out = [];
	const plan = { x: RIEL_X0 + 2, y: PEINE_Y - 6, w: M.RIEL.largo - 4, d: 12, r: 1 };
	out.push(S(k.slabOf(plan, PEINE_Z, 9, P, 1, 0.4), { tone: "mid" }));
	// Tres pletinas vistas por el canto. La del circuito encendido va en `lit`:
	// es lo que muestra de qué fase muerde esa derivación.
	const faseActiva = (M.derivaciones().find((d) => d.id === ACTIVO) || {}).fase;
	M.FASES.forEach((fase, i) => {
		const y = plan.y + 2.5 + i * 3.2;
		const viva = fase === faseActiva;
		out.push(
			`<path class="iso-line" data-pletina="${fase}" data-tone="${viva ? "lit" : "lo"}" style="stroke-width:${viva ? 1.1 : 0.7}" d="${k.lineOnTop([plan.x + 2, y], [plan.x + plan.w - 2, y], PEINE_Z + 9, P)}"/>`,
		);
	});
	// dientes: uno por derivación, bajando al borne
	for (const d of M.derivaciones()) {
		const x = RIEL_X0 + d.x + d.ancho / 2;
		out.push(`<g data-diente="${d.id}">`);
		out.push(S(k.slabOf({ x: x - 2, y: PEINE_Y - 10, w: 4, d: 6, r: 0.6 }, PEINE_Z - 4, 6, P, 1, 0.3), { tone: "mid", lit: d.id === ACTIVO }));
		out.push(`</g>`);
	}
	return out.join("");
}

// Canaleta de cableado por el margen derecho: es donde terminan todos los
// tramos, igual que en un tablero real, y por eso ninguno cruza un riel.
const CANALETA = { x: 112, y: -232, w: 28, d: 464, r: 2 };
const CANALETA_Z = FONDO_Z + 30;
const CABLE_R = 1.7;

function canaleta() {
	const out = [];
	const pared = 3;
	// dos paredes y el piso de la canaleta, no un bloque macizo
	// el piso primero, y las paredes ENCIMA de él: no hundidas dentro
	out.push(slab(CANALETA, FONDO_Z, 2, { tone: "lo", r: 1, bevel: 0.3, name: "canaleta.piso" }));
	out.push(slab({ ...CANALETA, w: pared }, FONDO_Z + 2, CANALETA_Z - FONDO_Z - 2, { tone: "mid", r: 1, bevel: 0.4, name: "canaleta.pared-interior" }));
	out.push(slab({ ...CANALETA, x: CANALETA.x + CANALETA.w - pared, w: pared }, FONDO_Z + 2, CANALETA_Z - FONDO_Z - 2, { tone: "mid", r: 1, bevel: 0.4, name: "canaleta.pared-exterior" }));
	// ranuras de salida de la pared interior, por donde entran los cables
	const ranuras = [];
	for (let i = 0; i < 16; i++) {
		const y = CANALETA.y + 14 + i * 28;
		ranuras.push(k.lineOnTop([CANALETA.x + 0.6, y], [CANALETA.x + pared - 0.6, y], CANALETA_Z, P));
	}
	out.push(L(ranuras.join(""), { tone: "faint" }));
	return out.join("");
}

/**
 * Los tramos THW-90. Seis de fase, del borne inferior de cada derivación a la
 * canaleta, y seis de neutro, de su borne en la barra a la misma canaleta.
 * Cada uno es una entidad propia con su circuito: el render decide si se ven
 * como haz o uno por uno, el modelo no pierde la distinción.
 */
function cables() {
	const der = M.derivaciones();
	const piezas = [];
	const extremos = [];
	const bocaX = CANALETA.x; // exactamente en la cara de la pared, no flotando dentro

	der.forEach((d, i) => {
		const x = RIEL_X0 + d.x + d.ancho / 2;
		const yBorne = RIEL_Y["riel-2"] + APARATO_D / 2 - 5;
		// El que está más a la izquierda baja más lejos: así su tramo horizontal
		// pasa por debajo de las verticales de los demás y ninguno cruza a otro.
		const yEntra = yBorne + 16 + (der.length - 1 - i) * 8;
		const faseRuta = [
			[x, yBorne, CUERPO_Z], // sobre la cara del borne, no dentro del cuerpo
			[x, yBorne, CUERPO_Z + 7], // sube recto: un extremo asentado sale perpendicular
			[x, yBorne + 11, CUERPO_Z + 7], // cruza el canto del aparato por encima
			[x, yEntra, CANALETA_Z - 4],
			[bocaX, yEntra, CANALETA_Z - 8],
		];
		const faseCurva = fillet(faseRuta, 9, 7, { P, tube: CABLE_R });
		R.route(`cable.${d.id}.fase`, faseCurva, CABLE_R, { limp: true });
		for (const pieza of tubePieces(faseCurva, CABLE_R, P, { maxLength: 12 })) {
			piezas.push({ pieza, id: d.id, tipo: "fase" });
		}
		extremos.push({ at: at([x, yBorne, CUERPO_Z - 1]), id: d.id });

		// el neutro: de su borne en la barra a la canaleta
		const r = M.ruta(d.id);
		const plan = { x: RIEL_X0 + 6, w: M.RIEL.largo - 12 };
		const paso = (plan.w - 14) / (M.BARRAS.neutro.bornes - 1);
		const xb = plan.x + 7 + r.borneNeutro * paso;
		const yb = BARRA.neutro;
		// El corredor queda entre la tapa ciega del riel 3 (acaba en y=122) y la
		// barra de neutro (empieza en y=178): ni encima de una ni de la otra.
		const yNeutro = 130 + i * 7;
		const neutroRuta = [
			[xb, yb, BARRA_Z1 + 7], // sobre la cara del borne
			[xb, yb, BARRA_Z1 + 13], // sube recto antes de girar
			[xb, yNeutro, CANALETA_Z - 6],
			[bocaX, yNeutro, CANALETA_Z - 10],
		];
		const neutroCurva = fillet(neutroRuta, 9, 7, { P, tube: CABLE_R });
		R.route(`cable.${d.id}.neutro`, neutroCurva, CABLE_R, { limp: true });
		for (const pieza of tubePieces(neutroCurva, CABLE_R, P, { maxLength: 12 })) {
			piezas.push({ pieza, id: d.id, tipo: "neutro" });
		}
		extremos.push({ at: at([xb, yb, BARRA_Z1 + 6]), id: d.id });
	});

	// cada chunk a su propia profundidad
	piezas.sort((a, b) => k.depthOf(a.pieza.mid, P) - k.depthOf(b.pieza.mid, P));
	const out = piezas.map(
		({ pieza, id, tipo }) =>
			`<g data-cable="${id}" data-tramo="${tipo}"${id === ACTIVO ? " data-on" : ""}>${tubeSvg(pieza, { tone: "mid" })}</g>`,
	);
	// terminal: cada cable arranca en un punto sobre su borne
	out.push(D(extremos.map((e) => e.at), { size: 0.55, tone: "lo" }));
	return out.join("");
}

function entrada() {
	const out = [];
	const [x, y] = ENTRADA;
	out.push(S(k.cylinder(x, y, 14, ALTO - 16, 10, P, 24), { tone: "lo" }));
	out.push(S(k.cylinder(x, y, 11, ALTO - 6, 8, P, 24), { tone: "mid" }));
	out.push(L(k.knurl(x, y, 11, ALTO - 6, ALTO + 2, 24, P), { tone: "lo" }));
	out.push(S(k.cylinder(x, y, 7.5, ALTO + 2, 16, P, 20), { tone: "mid", crease: "none" }));
	out.push(L(k.sideArc(x, y, 7.5, ALTO + 10, P, 14), { tone: "faint" }));
	return out.join("");
}

function tapa() {
	const out = [`<g data-part="tapa">`];
	const marco = 34;
	const barras_ = [
		{ x: CAJA.x, y: CAJA.y, w: CAJA.w, d: marco, r: 3 },
		{ x: CAJA.x, y: CAJA.y + CAJA.d - marco, w: CAJA.w, d: marco, r: 3 },
		{ x: CAJA.x, y: CAJA.y + marco, w: marco, d: CAJA.d - 2 * marco, r: 2 },
		{ x: CAJA.x + CAJA.w - marco, y: CAJA.y + marco, w: marco, d: CAJA.d - 2 * marco, r: 2 },
	];
	for (const b of barras_) out.push(S(k.slabOf(b, TAPA_Z, 8, P, 3, 0.8), { tone: "lo" }));
	// burlete del recorte
	const hueco = { x: CAJA.x + marco, y: CAJA.y + marco, w: CAJA.w - 2 * marco, d: CAJA.d - 2 * marco, r: 2 };
	out.push(L(k.planOutline(hueco, TAPA_Z + 8, P, 2), { tone: "faint" }));
	// tirador y pestillo
	out.push(S(k.slabOf({ x: CAJA.x + CAJA.w - 26, y: -14, w: 14, d: 28, r: 3 }, TAPA_Z + 8, 7, P, 2, 0.5), { tone: "mid" }));
	out.push(D(k.corners(k.insetPlan(CAJA, 14), 0).map(([cx, cy]) => at([cx, cy, TAPA_Z + 8])), { size: 0.5, tone: "lo" }));
	out.push(`</g>`);
	return out.join("");
}

const { lejos, cerca } = paredesPorDepth();

// Se dibuja UNA vez y se reusa en las dos salidas: llamarlo dos veces
// registraría cada forma por duplicado y la auditoría se chocaría consigo misma.

/** El dibujo, de atrás hacia adelante y de abajo hacia arriba. */
const cuerpo = () => [
	fondo(),
	lejos.map(muro).join(""),
	entrada(), // va con la pared lejana: se apoya en ella
	rieles(),
	barras(),
	aparatos("riel-1"),
	aparatos("riel-2"),
	peine(),
	cables(),
	canaleta(), // después de los cables: ellos entran y la pared los tapa
	cerca.map(muro).join(""),
	// La tapa, por defecto, no se dibuja: las dos salidas quietas (.svg de la
	// web y PNG de papel) necesitan ver el interior, así que el tablero está
	// abierto en reposo y levantarla al hover no mostraría nada nuevo.
	// `--tapa` la devuelve, flotando sobre la caja como en una vista explotada.
	CON_TAPA ? tapa() : "",
];

const CUERPO = cuerpo();

const svg = k.figureSvg({
	width: WIDTH,
	height: HEIGHT,
	label:
		"Un tablero de distribución trifásico visto desde arriba con la tapa levantada. Tres rieles DIN llevan la cabecera, seis derivaciones y un riel de reserva; un peine trifásico reparte las fases entre las derivaciones y dos barras de bornes recogen el neutro y la tierra.",
	body: CUERPO,
});

const resumen = M.resumen();
const live = `
const P = ${JSON.stringify(P)};
const DERIV = ${JSON.stringify(M.derivaciones().map((d) => ({ id: d.id, fase: d.fase, texto: M.detalle(d.id) })))};
const RESUMEN = ${JSON.stringify(`${resumen.fases}  ·  desequilibrio ${resumen.desequilibrio}`)};
const TAPA_Z = ${TAPA_Z};
const REPOSO = ${JSON.stringify(ACTIVO)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const tapa = svg.querySelector('[data-part="tapa"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let alza = 0, meta = 0, frame = 0, last = 0, visible = false, activo = null;
function pinta() {
  if (tapa) tapa.setAttribute("transform", translateAlong(P, [0, 0, alza]));
  const texto = activo ? (DERIV.find((d) => d.id === activo) || {}).texto : RESUMEN;
  if (readout.textContent !== texto) readout.textContent = texto;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  alza = still.matches ? meta : alza + (meta - alza) * (1 - Math.exp(-dt / 0.32));
  if (Math.abs(meta - alza) < 0.05) alza = meta;
  pinta();
  frame = visible && alza !== meta ? requestAnimationFrame(tick) : 0;
}
const corre = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) corre(); }, { rootMargin: "120px 0px" }).observe(stage);
/** Enciende un circuito: cuerpo levantado, contorno en blanco y su pletina. */
function enciende(id) {
  const fase = (DERIV.find((d) => d.id === id) || {}).fase;
  for (const g of svg.querySelectorAll("[data-aparato], [data-diente]")) {
    const suyo = (g.getAttribute("data-aparato") || g.getAttribute("data-diente")) === id;
    for (const s of g.querySelectorAll(".iso-solid")) {
      if (suyo) s.setAttribute("data-lit", ""); else s.removeAttribute("data-lit");
    }
  }
  for (const p of svg.querySelectorAll("[data-outline]")) {
    const suyo = p.getAttribute("data-outline") === id;
    p.setAttribute("data-tone", suyo ? "lit" : "faint");
    p.style.strokeWidth = suyo ? "1.2" : "0.7";
  }
  for (const g of svg.querySelectorAll("[data-cable]")) {
    if (g.getAttribute("data-cable") === id) g.setAttribute("data-on", ""); else g.removeAttribute("data-on");
  }
  for (const p of svg.querySelectorAll("[data-pletina]")) {
    const viva = p.getAttribute("data-pletina") === fase;
    p.setAttribute("data-tone", viva ? "lit" : "lo");
    p.style.strokeWidth = viva ? "1.1" : "0.7";
  }
}
for (const g of svg.querySelectorAll("[data-aparato]")) {
  g.addEventListener("pointerenter", () => {
    const id = g.getAttribute("data-aparato");
    if (!DERIV.some((d) => d.id === id)) return;
    activo = id; meta = 44; enciende(id); corre(); pinta();
  });
}
stage.addEventListener("pointerleave", () => { activo = null; meta = 0; enciende(REPOSO); corre(); pinta(); });
pinta();
`;

const body = k.plateHtml({
	fig: "Fig 1",
	title: "Tablero de distribución 380/220 V",
	hint: "Pasa sobre una derivación",
	readout: `${resumen.fases}  ·  desequilibrio ${resumen.desequilibrio}`,
	keys: [
		{ mark: "lit", label: "Las seis derivaciones: cada una muerde una fase del peine" },
		{ mark: "raised", label: "Cabecera: general, relé de tensión, DPS y diferencial" },
	],
	caption:
		`Tablero de 3 rieles de ${M.RIEL.modulos} módulos. El peine trifásico reparte L1, L2 y L3 entre las seis derivaciones, y por eso las fases no quedan cargadas igual: ${resumen.fases}, ${resumen.instalada} instalados y ${resumen.desequilibrio} de desequilibrio. La cifra es corriente instalada —la suma de las protecciones—, no carga medida. Números de prueba.`,
	body: `<style>
		g[data-cable] .tb-body{transition:fill .18s ease}
		g[data-cable][data-on] .tb-body{fill:var(--anatomy-lit)}
		g[data-cable][data-on] .tb-shine,g[data-cable][data-on] .tb-shade{opacity:.25}
	</style><div class="iso-stage" tabindex="0">${svg}</div>`,
});

const nombre = theme === "light" ? "tablero-light" : "tablero";
writeFileSync(join(HERE, `${nombre}.html`), k.pageHtml({ title: "Tablero de distribución", theme, body, script: kitScript() + live }));

// Salida 2: el .svg suelto con los estilos embebidos, para <img> en la landing.
const suelto = k.figureSvg({
	width: WIDTH,
	height: HEIGHT,
	label: "Tablero de distribución trifásico 380/220 V con la tapa levantada.",
	standalone: theme,
	body: CUERPO,
});
writeFileSync(join(HERE, `${nombre}.svg`), suelto);

console.log("wrote", `${nombre}.html`, "+", `${nombre}.svg`);

// `node build.mjs --audit` mide la geometría registrada: que ningún cable
// atraviese nada, que cada extremo termine en algo y que nada flote.
A.auditOrExit(R, P);
