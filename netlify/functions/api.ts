import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let initialized = false;

const serverlessHandler = serverless(app);

export const handler: any = async (event: any, context: any) => {
    // Netlify Functions with redirects can have weird paths
    // We want the Express app to see the path starting from /api
    console.log(`Incoming request: ${event.httpMethod} ${event.path}`);

    try {
        if (!initialized) {
            console.log("Initializing lambda app...");
            await registerRoutes(app);
            initialized = true;
            console.log("Lambda app initialized.");
        }

        // Remove /.netlify/functions/api prefix if present
        if (event.path.startsWith('/.netlify/functions/api')) {
            event.path = event.path.replace('/.netlify/functions/api', '/api');
        } else if (!event.path.startsWith('/api') && event.path !== '/') {
            // If it's something like /categories, prepend /api if that's what base Express expects
            // But usually the redirect sends /api/categories to the function.
        }

        return await serverlessHandler(event, context);
    } catch (error: any) {
        console.error("CRITICAL_LAMBDA_ERROR:", error);
        return {
            statusCode: 502,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Internal Server Error in Lambda",
                error: error.message,
                hint: "Check if DATABASE_URL and other environment variables are set in Netlify dashboard.",
                stack: error.stack
            })
        };
    }
};
