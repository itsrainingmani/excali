import { ANTHROPIC_API_KEY } from '$env/static/private';
import Anthropic from '@anthropic-ai/sdk';

export const anthropicClient = new Anthropic({
	// defaults to process.env["ANTHROPIC_API_KEY"]
	apiKey: ANTHROPIC_API_KEY
}); // place files you want to import through the `$lib` alias in this folder.
