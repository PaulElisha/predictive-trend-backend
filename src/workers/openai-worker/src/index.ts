import {Mistral}  from '@mistralai/mistralai';
import retry from 'async-retry';

import HttpStatus from '@config/http.config.js';

import {EventStream}  from '@mistralai/mistralai/lib/event-streams';
import {CompletionEvent}  from '@mistralai/mistralai/models/components/completionevent';



const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}
		if (request.method !== 'POST') {
			return new Response(JSON.stringify({ error: `${request.method} method not allowed.` }), {
				status: HttpStatus.METHOD_NOT_ALLOWED,
				headers: corsHeaders,
			});
		}
		try {
			const body = (await request.json()) as any;
			const messages = Array.isArray(body) ? body : body?.messages;
			if (!Array.isArray(messages) || messages.length === 0) {
				return new Response(JSON.stringify({ error: 'Invalid or missing messages array' }), {
					status: HttpStatus.BAD_REQUEST,
					headers: corsHeaders,
				});
			}
			const mistral = new Mistral({
				apiKey: env.MISTRAL_AI_API_KEY,
				serverURL: env.MISTRAL_SERVER_URL,
			});
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					try {
						const mistralStream = await retry(
							async (bail) => {
								try {
									return await mistral.chat.stream(
										{ model: 'mistral-large-latest', messages },
										{ fetchOptions: { signal: request.signal } },
									);
								} catch (error: any) {
									if (error?.name === 'AbortError') return bail(error);
									if (error?.status >= 400 && error?.status < 500) return bail(error);
									throw error;
								}
							},
							{ retries: 2, factor: 2, minTimeout: 500, maxTimeout: 5000 },
						);
						for await (const chunk of <EventStream<CompletionEvent>>mistralStream ) {
							const content = chunk.data.choices?.[0]?.delta?.content;
							if (content) {
								controller.enqueue(encoder.encode(`data: ${JSON.stringify(content)}\n\n`));
							}
						}
						controller.close();
					} catch (err: any) {
						if (err?.name === 'AbortError' || (request.signal as AbortSignal).aborted) {
							controller.close();
							return;
						}
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' })}\n\n`));
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
				status: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
			});
		}
	},
} satisfies ExportedHandler<Env>;