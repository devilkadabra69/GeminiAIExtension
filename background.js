// Import the necessary modules or libraries
import { GoogleGenerativeAI } from './lib/generative-ai/dist/index.mjs';

// Initialize the GoogleGenerativeAI instance with the API key
const API_KEY = "------API------- KEY";
const genAI = new GoogleGenerativeAI(API_KEY);

// Define a function to handle incoming messages from the popup script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('Message received in background script:', message);

    // Extract the prompt from the message
    const prompt = message?.prompt;

    // Check if a prompt is provided
    if (!prompt) {
        // Send an error response if the prompt is empty
        sendResponse({ error: 'Error: Empty prompt received.' });
        return;
    }

    // Call the API to get the response
    run(prompt)
        .then(response => {
            console.log('Response from API:', response);
            // Send the response back to the popup script
            sendResponse({ response });
        })
        .catch(error => {
            console.error('Error from API:', error);
            // Send an error response if there's an error during API call
            sendResponse({ error: error.message });
        });

    // Keep the message channel open until the response is sent
    return true;
});

// Function to call the API and generate a response
async function run(prompt) {
    // Obtain the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log("Generated text:", text);
    // Return the generated response as text
    return text;
}
