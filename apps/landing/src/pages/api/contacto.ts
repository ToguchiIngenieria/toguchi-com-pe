export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

const MAX = { nombre: 100, empresa: 120, whatsapp: 20, distrito: 60, direccion: 200, mensaje: 2000 };
const SERVICIOS = [
	"Instalaciones eléctricas",
	"CCTV y seguridad electrónica",
	"Redes y cableado estructurado",
	"Tableros y control industrial",
	"Domótica e IoT",
	"Mecatrónica y prototipado",
	"Remodelación y acondicionamiento",
	"Consultoría e ingeniería técnica",
	"Otro",
];
const URGENCIAS = ["Lo antes posible", "Dentro de este mes", "Aún estoy cotizando"];

export const POST: APIRoute = async ({ request }) => {
	const json = (ok: boolean, status: number, extra = {}) =>
		new Response(JSON.stringify({ ok, ...extra }), {
			status,
			headers: { "Content-Type": "application/json" },
		});

	try {
		const data = await request.formData();

		if (String(data.get("website") || "").length > 0) {
			return json(true, 200);
		}

		const campo = (k: string) => String(data.get(k) || "").trim();
		const lead = {
			fecha: new Date().toISOString(),
			nombre: campo("nombre"),
			empresa: campo("empresa"),
			whatsapp: campo("whatsapp"),
			servicio: campo("servicio"),
			distrito: campo("distrito"),
			direccion: campo("direccion"),
			urgencia: campo("urgencia"),
			mensaje: campo("mensaje"),
			origen: "toguchi.com.pe",
		};

		if (!lead.nombre || !lead.whatsapp || !lead.servicio || !lead.urgencia || !lead.mensaje) {
			return json(false, 400, { error: "Faltan campos requeridos" });
		}
		if (
			lead.nombre.length > MAX.nombre ||
			lead.empresa.length > MAX.empresa ||
			lead.whatsapp.length > MAX.whatsapp ||
			lead.distrito.length > MAX.distrito ||
			lead.direccion.length > MAX.direccion ||
			lead.mensaje.length > MAX.mensaje
		) {
			return json(false, 400, { error: "Campo demasiado largo" });
		}
		if (!SERVICIOS.includes(lead.servicio)) {
			return json(false, 400, { error: "Servicio no válido" });
		}
		if (!URGENCIAS.includes(lead.urgencia)) {
			return json(false, 400, { error: "Valor de urgencia no válido" });
		}
		// Celular peruano, validado EN EL SERVIDOR. Hasta el 2026-10-05 esto aceptaba
		// cualquier cadena de 6 a 20 caracteres de digitos y separadores: medido, el
		// Worker admitia "97013017" de ocho digitos, "123456", "000000000" y
		// "+51 1 4567890". La validacion del navegador no es frontera y un POST
		// fabricado a mano la salta. Ver D-62.
		//
		// Se normaliza una COPIA y se valida sobre ella; en KV se guarda el valor tal
		// como llego. El motivo esta medido: willis-lead.ps1 arma `https://wa.me/$wa`
		// quitando no-digitos y SIN codigo de pais, asi que guardar nueve digitos le
		// rompe el enlace.
		const waDigitos = lead.whatsapp
			.replace(/[^\d+]/g, "")
			.replace(/^\+/, "")
			.replace(/^0+/, "")
			.replace(/^51/, "");
		if (!/^9\d{8}$/.test(waDigitos)) {
			return json(false, 400, {
				error: "El WhatsApp debe ser un celular peruano de nueve dígitos que empiece por 9",
			});
		}

		await env.LEADS.put(`lead:${lead.fecha}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(lead));

		return json(true, 200);
	} catch (err) {
		console.error("Error guardando lead:", err);
		return json(false, 500, { error: "Error interno" });
	}
};
