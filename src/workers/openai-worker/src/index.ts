import { Mistral } from '@mistralai/mistralai';

import { HTTP_STATUS } from '../../../config/http.config';
import { ErrorCode } from '../../../enums/error-code.enum';
import { InternalServerError } from '../../../errors/internal-server.error';
import { AppError } from '../../../errors/app.error';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

async function* mistralStreamGenerator(mistral: Mistral, messages: any[], signal: AbortSignal) {
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

			console.log(`Stream: ${stream}`);

			for await (const chunk of stream) {
				const content = chunk.data.choices?.[0]?.delta?.content;
				if (content) yield content;
			}
			console.log(`Mistral attempt ${attempts} success`);
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
			const messages = (await request.json()) as any;
			console.log('Messages', messages);
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					try {
						for await (const token of mistralStreamGenerator(mistral, messages, request.signal)) {
							console.log(`Token: ${token}`);
							controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));
						}
						controller.close();
					} catch (err) {
						console.error(err);
						controller.error(err);
					}
				},
			});

			return new Response(stream, {
				headers: corsHeaders,
				status: HTTP_STATUS.OK,
			});
		} catch (error) {
			if (error instanceof Error) {
				return new Response(JSON.stringify({ error: error.message }), {
					headers: corsHeaders,
					status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
				});
			}

			if (error instanceof AppError) {
				return new Response(JSON.stringify({ error: error.message }), {
					headers: corsHeaders,
					status: error.statusCode,
				});
			}

			return new Response(JSON.stringify({ error: error }), {
				headers: corsHeaders,
				status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
			});
		}
	},
} satisfies ExportedHandler<Env>;
