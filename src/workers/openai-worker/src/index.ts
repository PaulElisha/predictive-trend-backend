import { Mistral } from '@mistralai/mistralai';
import { ContentChunk } from '@mistralai/mistralai/models/components';

import HttpStatus from '@config/http.config.js';

import AppError from '@error/app-error.js';

import CAF from 'caf';
import retry from 'async-retry';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

/*
async function* mistralStreamGenerator(mistral: Mistral, messages: any[], signal: AbortSignal): AsyncGenerator<string | ContentChunk[]> {
	let attempts = 0;
	const maxAttempts = 3;

	while (attempts < maxAttempts) {
		try {
			const stream = await mistral.chat.stream(
				{
					model: 'mistral-large-latest',
					messages,
				},
				{ fetchOptions: { signal } },
			);

			console.log(`Stream: ${stream} - ${JSON.stringify(stream, null, 2)}`);

			for await (const chunk of stream) {
				console.log(`Chunk: ${chunk} - ${JSON.stringify(chunk, null, 2)}`);
				const content = chunk.data.choices?.[0]?.delta?.content;
				console.log(`Yielded: ${content} - ${JSON.stringify(content, null, 2)}`);
				if (content) yield content;
			}
			console.log(`Mistral at attempt ${attempts} - success`);
			return;
		} catch (error: any) {
			if (error?.name === 'AbortError') return;

			attempts++;
			console.error(`Mistral attempt ${attempts} failed:`, error);
			if (attempts === maxAttempts) throw error;
			await new Promise((res) => setTimeout(res, attempts * 1000));
		}
	}
}
*/

const mistralStreamGenerator = CAF(async function* (
	signal: AbortSignal,
	mistral: Mistral,
	messages: any[],
): AsyncGenerator<string | ContentChunk[]> {
	const stream = await retry(
		async (bail) => {
			try {
				return await mistral.chat.stream(
					{
						model: 'mistral-large-latest',
						messages,
					},
					{ fetchOptions: { signal } },
				);
			} catch (error: any) {
				if (error?.name === 'AbortError') return bail(error);
			}
		},
		{ retries: 2, factor: 2, minTimeout: 1000, maxTimeout: 5000 },
	);

	if (!stream) return;
	for await (const chunk of stream) {
		const content = chunk.data.choices?.[0]?.delta?.content;
		if (content) yield content;
	}
});

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method == 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders,
			});
		}

		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.` }), { status: 405, headers: corsHeaders });
		}

		const mistral = new Mistral({
			apiKey: env.MISTRAL_AI_API_KEY,
			serverURL: env.MISTRAL_SERVER_URL,
		});

		try {
			const body = (await request.json()) as any;
			const messages = Array.isArray(body) ? body : body.messages;

			console.log('--- NEW REQUEST ---');
			console.log('Received messages:', JSON.stringify(messages, null, 2));

			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					try {
						for await (const token of mistralStreamGenerator(request.signal, mistral, messages)) {
							console.log(`Token: ${token} - ${JSON.stringify(token, null, 2)}`);

							controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));

							while (controller.desiredSize != null && controller.desiredSize <= 0) {
								await new Promise((resolve) => setTimeout(resolve, 10));
							}
						}
						controller.close();
					} catch (err: any) {
						console.error(err);

						if (CAF.isCAFError(err)) {
							controller.close();
							return;
						}

						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err?.message })}\n\n`));
						controller.close();
					}
				},
			});

			return new Response(stream, {
				headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
				status: HttpStatus.OK,
			});
		} catch (error: any) {
			return new Response(JSON.stringify({ error: error?.message }), {
				headers: corsHeaders,
				status: error?.statusCode,
			});
		}
	},
} satisfies ExportedHandler<Env>;
