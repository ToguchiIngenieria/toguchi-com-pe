// Tablero de distribución trifásico — tipo TOGUCHI.
//
// NÚMEROS DE PRUEBA, no de obra real.
//
// Módulo puro: sin dependencias y sin estado. Lo importa el build (geometría y
// rótulos) y la página lo vuelve a importar para el readout, así que todo
// número que la figura muestre sale de acá y de ningún otro lado.
//
// Unidades: milímetros y amperios. El mundo de la figura usa 1 unidad = 1 mm.

export const SISTEMA = {
	tensionLinea: 380, // V entre fases
	tensionFase: 220, // V fase-neutro
	fases: 3,
	hilos: "3F + N + T",
	frecuencia: 60, // Hz
};

export const GABINETE = {
	ancho: 300, // mm
	alto: 500,
	fondo: 120,
	montaje: "empotrable",
};

export const RIEL = {
	modulo: 17.5, // mm por módulo DIN
	modulos: 12, // módulos por riel
	cantidad: 3,
	get largo() {
		return this.modulo * this.modulos; // 210 mm
	},
};

export const ENTRADA = {
	prensaestopa: "PG29",
	cable: "NYY 3x10 mm² + 10 mm²",
	seccion: 10, // mm² por conductor de fase
	posicion: "superior",
};

export const BARRAS = {
	tierra: { bornes: 12, rotulo: "T" },
	neutro: { bornes: 12, rotulo: "N" },
};

// Los aparatos, riel por riel y en el orden en que ocupan los módulos.
// `mod` son módulos ocupados; el offset en mm lo calcula posiciones().
export const RIELES = [
	{
		id: "riel-1",
		rotulo: "cabecera",
		aparatos: [
			{ id: "general", tipo: "interruptor", rotulo: "General", polos: 3, mod: 3, In: 40, curva: "C", icc: 6 },
			{ id: "rele-tension", tipo: "rele", rotulo: "Relé de tensión", polos: 3, mod: 1, rango: [180, 260] },
			{ id: "dps", tipo: "dps", rotulo: "DPS tipo 2", polos: 4, mod: 4, In: 20, unidadIn: "kA", Up: 1.5 },
			{ id: "dif-general", tipo: "diferencial", rotulo: "Diferencial general", polos: 4, mod: 4, In: 40, sensibilidad: 300 },
		],
	},
	{
		id: "riel-2",
		rotulo: "derivaciones 220 V",
		aparatos: [
			{ id: "dif-tomas", tipo: "diferencial", rotulo: "Diferencial tomacorrientes", polos: 2, mod: 2, In: 40, sensibilidad: 30 },
			{ id: "C1", tipo: "derivacion", rotulo: "Alumbrado zona A", polos: 1, mod: 1, In: 16, curva: "B", fase: "L1", seccion: 2.5 },
			{ id: "C2", tipo: "derivacion", rotulo: "Alumbrado zona B", polos: 1, mod: 1, In: 16, curva: "B", fase: "L2", seccion: 2.5 },
			{ id: "C3", tipo: "derivacion", rotulo: "Tomacorrientes generales", polos: 1, mod: 1, In: 20, curva: "C", fase: "L3", seccion: 4 },
			{ id: "C4", tipo: "derivacion", rotulo: "Tomacorrientes oficina", polos: 1, mod: 1, In: 20, curva: "C", fase: "L1", seccion: 4 },
			{ id: "C5", tipo: "derivacion", rotulo: "Terma eléctrica", polos: 2, mod: 2, In: 25, curva: "C", fase: "L2", seccion: 6 },
			{ id: "C6", tipo: "derivacion", rotulo: "Cocina / fuerza", polos: 2, mod: 2, In: 32, curva: "C", fase: "L3", seccion: 6 },
		],
	},
	{ id: "riel-3", rotulo: "reserva", aparatos: [] },
];

export const FASES = ["L1", "L2", "L3"];
export const CABLEADO_INTERNO = "THW-90";

/** Los aparatos de un riel con su offset y ancho en mm desde el extremo izquierdo. */
export function posiciones(rielId) {
	const riel = RIELES.find((r) => r.id === rielId);
	let mod = 0;
	return riel.aparatos.map((a) => {
		const x = mod * RIEL.modulo;
		mod += a.mod;
		return { ...a, x, ancho: a.mod * RIEL.modulo };
	});
}

/** Módulos libres de un riel. El riel 3 entero es reserva. */
export function libres(rielId) {
	const riel = RIELES.find((r) => r.id === rielId);
	const usados = riel.aparatos.reduce((s, a) => s + a.mod, 0);
	return RIEL.modulos - usados;
}

/** Solo las derivaciones: las que tienen fase y sección. */
export function derivaciones() {
	return RIELES.flatMap((r) => posiciones(r.id)).filter((a) => a.tipo === "derivacion");
}

/**
 * Corriente INSTALADA por fase: la suma de las protecciones colgadas de cada
 * fase. No es la carga real —eso necesita factores de demanda—, y el caption
 * de la figura lo dice con esas palabras.
 */
export function corrienteInstalada() {
	const porFase = { L1: 0, L2: 0, L3: 0 };
	for (const d of derivaciones()) porFase[d.fase] += d.In;
	return porFase;
}

/**
 * Desequilibrio entre fases, en %, sobre la corriente instalada:
 * la desviación máxima respecto del promedio, dividida por el promedio.
 */
export function desequilibrio() {
	const porFase = corrienteInstalada();
	const valores = FASES.map((f) => porFase[f]);
	const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
	if (promedio === 0) return { promedio: 0, pct: 0, max: 0, min: 0, rango: 0 };
	const max = Math.max(...valores);
	const min = Math.min(...valores);
	const desviacion = Math.max(max - promedio, promedio - min);
	return {
		promedio,
		max,
		min,
		pct: (desviacion / promedio) * 100,
		rango: ((max - min) / max) * 100, // la otra definición de uso común
	};
}

/** El recorrido que se resalta al hover: del diente del peine al borne de salida. */
export function ruta(id) {
	const d = derivaciones().find((a) => a.id === id);
	if (!d) return null;
	const orden = derivaciones().map((a) => a.id).indexOf(id);
	return {
		aparato: d,
		diente: FASES.indexOf(d.fase), // pletina del peine, 0..2
		borneNeutro: orden, // borne en la barra de neutro
		borneTierra: orden, // borne en la barra de tierra
	};
}

/** Lo que el readout muestra en reposo. */
export function resumen() {
	const porFase = corrienteInstalada();
	const d = desequilibrio();
	return {
		fases: FASES.map((f) => `${f} ${porFase[f]} A`).join("  "),
		desequilibrio: `${d.pct.toFixed(1)} %`,
		instalada: `${FASES.reduce((s, f) => s + porFase[f], 0)} A`,
	};
}

/** Lo que el readout muestra al pasar sobre una derivación. */
export function detalle(id) {
	const d = derivaciones().find((a) => a.id === id);
	if (!d) return null;
	return `${d.id} ${d.rotulo} · ${d.In} A curva ${d.curva} · ${d.fase} · ${d.seccion} mm²`;
}
