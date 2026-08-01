export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

const MAX = { nombre: 100, empresa: 120, whatsapp: 20, distrito: 60, mensaje: 2000 };
const SERVICIOS = [
	"Instalaciones eléctricas",
	"CCTV y seguridad electrónica",
	"Redes y cableado estructurado",
	"Tableros y control industrial",
	"Domótica e IoT",
	"Mecatrónica y prototipado",
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
			urgencia: campo("urgencia"),
			mensaje: campo("mensaje"),
			origen: "toguchi.com.pe",
		};

		if (!lead.nombre || !lead.whatsapp || !lead.servicio || !lead.mensaje) {
			return json(false, 400, { error: "Faltan campos requeridos" });
		}
		if (
			lead.nombre.length > MAX.nombre ||
			lead.empresa.length > MAX.empresa ||
			lead.whatsapp.length > MAX.whatsapp ||
			lead.distrito.length > MAX.distrito ||
			lead.mensaje.length > MAX.mensaje
		) {
			return json(false, 400, { error: "Campo demasiado largo" });
		}
		if (!SERVICIOS.includes(lead.servicio)) {
			return json(false, 400, { error: "Servicio no válido" });
		}
		if (lead.urgencia && !URGENCIAS.includes(lead.urgencia)) {
			return json(false, 400, { error: "Valor de urgencia no válido" });
		}
		if (!/^[+0-9\s()-]{6,20}$/.test(lead.whatsapp)) {
			return json(false, 400, { error: "WhatsApp no válido" });
		}

		await env.LEADS.put(`lead:${lead.fecha}:${crypto.randomUUID().slice(0, 8)}`, JSON.stringify(lead));

		return json(true, 200);
	} catch (err) {
		console.error("Error guardando lead:", err);
		return json(false, 500, { error: "Error interno" });
	}
};
