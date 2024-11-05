import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { anthropicClient } from '$lib';

// API Call that will eventually call Anthropic to generate
// a structured JSON of objects to render on the screen
export const POST: RequestHandler = async ({ request }) => {
	const { prompt, canvas_width, canvas_height } = await request.json();

	console.log(prompt, canvas_width, canvas_height);

	const task = `You are an AI assistant specialized in generating JSON data for drawing shapes on an HTML Canvas. Your task is to interpret a user's drawing request and create a list of JSON objects representing rectangles and ellipses that will visualize the request.\n\nFirst, let's look at the drawing request and canvas dimensions:\n\n<drawing_request>\n${prompt}\n</drawing_request>\n\n<canvas_dimensions>\nWidth: ${canvas_width}\nHeight: ${canvas_height}\n</canvas_dimensions>\n\nYou have two types of shapes available: rectangles and ellipses. Here are the parameters for each:\n\nRectangle:\n{\n  startX: number,\n  startY: number,\n  width: number,\n  height: number,\n  timestamp: string,\n  stroke: string,\n  linewidth: number, // 1 - 5\n  linetype: string, // either "dashed" or "dotted"\n  fill: boolean,\n  shape: 'rect'\n}\n\nEllipse:\n{\n  startX: number,\n  startY: number,\n  endX: number,\n  endY: number,\n  timestamp: string,\n  stroke: string,\n  linewidth: number, // 1 - 5\n  linetype: string, // either "dashed" or "dotted"\n  fill: boolean,\n  shape: 'circle'\n}\n\nYour task is to create a list of these shapes that best represents the drawing request. Follow these steps:\n\n1. Analyze the drawing request and break it down into simple shapes.\n2. For each shape, decide whether a rectangle or ellipse is more appropriate.\n3. Set the parameters for each shape, considering its position, size, and appearance.\n4. Ensure that the shapes are positioned relative to each other to create the desired image.\n5. Use the provided canvas dimensions to calculate more central starting positions for the shapes.\n\nGuidelines for creating visually appealing results:\n- Use appropriate sizes for shapes to maintain proportions.\n- Consider using multiple shapes to create more complex elements.\n- Utilize both filled and unfilled shapes for added depth and detail.\n- Layer shapes by listing them in the appropriate order (background elements first).\n\nIf the drawing request is too complex or cannot be reasonably represented using only rectangles and ellipses, provide the best approximation possible. If the request is unclear or lacks sufficient detail, create a basic interpretation based on the available information.\n\nAfter your thought process, provide only output a list of JSON objects. Ensure that the JSON is valid and properly formatted. Here's an example of the expected output format:\n\n[\n  {\n    "startX": 100,\n    "startY": 100,\n    "width": 200,\n    "height": 150,\n    "timestamp": "2023-05-15T10:30:00Z",\n    "stroke": "black",\n    "linewidth": 2,\n    "linetype": "dashed",\n    "fill": true,\n    "shape": "rect"\n  },\n  {\n    "startX": 150,\n    "startY": 200,\n    "endX": 250,\n    "endY": 300,\n    "timestamp": "2023-05-15T10:30:01Z",\n    "stroke": "blue",\n    "linewidth": 3,\n    "linetype": "dotted",\n    "fill": false,\n    "shape": "circle"\n  }\n]\n\nRemember to use the provided canvas dimensions to calculate more central starting positions for your shapes. Now, please analyze the drawing request and generate the appropriate JSON data. Please do not return any other data other than the list of JSON objects`;

	console.log(task);

	try {
		const msg = await anthropicClient.messages.create({
			model: 'claude-3-5-sonnet-20241022',
			max_tokens: 1000,
			temperature: 0,
			messages: [
				{
					role: 'user',
					content: [
						{
							type: 'text',
							text: '<examples>\n<example>\n<CANVAS_WIDTH>\n1875\n</CANVAS_WIDTH>\n<CANVAS_HEIGHT>\n948\n</CANVAS_HEIGHT>\n<DRAWING_REQUEST>\nDraw a tree with 2 birds near it\n</DRAWING_REQUEST>\n<ideal_output>\n[ { "startX": 897, "startY": 374, "width": 80, "height": 200, "timestamp": "2023-05-15T10:30:00Z", "stroke": "brown", "linewidth": 2, "linetype": "dashed", "fill": true, "shape": "rect" }, { "startX": 837, "startY": 274, "endX": 987, "endY": 374, "timestamp": "2023-05-15T10:30:01Z", "stroke": "green", "linewidth": 3, "linetype": "dashed", "fill": true, "shape": "circle" }, { "startX": 887, "startY": 244, "endX": 1037, "endY": 344, "timestamp": "2023-05-15T10:30:02Z", "stroke": "green", "linewidth": 3, "linetype": "dashed", "fill": true, "shape": "circle" }, { "startX": 937, "startY": 274, "endX": 1087, "endY": 374, "timestamp": "2023-05-15T10:30:03Z", "stroke": "green", "linewidth": 3, "linetype": "dashed", "fill": true, "shape": "circle" }, { "startX": 1050, "startY": 300, "endX": 1080, "endY": 320, "timestamp": "2023-05-15T10:30:04Z", "stroke": "black", "linewidth": 2, "linetype": "dashed", "fill": true, "shape": "circle" }, { "startX": 1100, "startY": 250, "endX": 1130, "endY": 270, "timestamp": "2023-05-15T10:30:05Z", "stroke": "black", "linewidth": 2, "linetype": "dashed", "fill": true, "shape": "circle" } ]\n</ideal_output>\n</example>\n</examples>\n\n'
						},
						{
							type: 'text',
							text: task
						}
					]
				},
				{
					role: 'assistant',
					content: [
						{
							type: 'text',
							text: '['
						}
					]
				}
			]
		});

		return json(msg.content);
	} catch (error) {
		// if (error instanceof Anthropic.APIError) {
		// 	console.error(error.status);
		// 	console.error(error.name);
		// 	console.error(error.headers);
		// }

		return new Response('Anthropic Error: ' + error, { status: 500 });
	}
};
