import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

// API Call that will eventually call Anthropic to generate
// a structured JSON of objects to render on the screen
export const POST: RequestHandler = async ({ request }) => {
	const { prompt } = await request.json();
	return json(prompt);
};
