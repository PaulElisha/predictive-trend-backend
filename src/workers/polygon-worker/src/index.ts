import axios from 'axios';

import HttpStatus from '@config/http.config.js';

import AppError from '@error/app-error.js';

import BadRequestExceptionError from '@error/bad-request.js';

import ErrorCode from '@enum/error-code.js';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);
		const ticker = url.searchParams.get('ticker');
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		try {
			const url = `${env.POLYGON_BASE_URL}/${ticker}/range/1/day/${startDate}/${endDate}?apiKey=${env.POLYGON_API_KEY}`;

			const response = await axios.get(url, { headers: corsHeaders, timeout: 10000 });

			if (response.status !== HttpStatus.OK) {
				throw new BadRequestExceptionError('Polygon API: Error fetching stock data', HttpStatus.BAD_REQUEST, ErrorCode.RESOURCE_NOT_FOUND);
			}

			const { request_id, ...data } = response.data;

			return new Response(JSON.stringify(data), { headers: corsHeaders, status: HttpStatus.OK });
		} catch (error: any) {
			return new Response(JSON.stringify({ error: error?.message }), {
				status: error?.statusCode,
				headers: corsHeaders,
			});
		}
	},
} satisfies ExportedHandler<Env>;
