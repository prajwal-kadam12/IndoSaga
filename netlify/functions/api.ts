import express from "express";
import serverless from "serverless-http";
import { registerRoutes } from "../../server/routes";

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Global error handler for Express in serverless environment
app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("EXPRESS_ERROR:", err);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || "Internal Server Error",
        error: err.toString(),
        path: _req.path
    });
});

let initialized = false;

const serverlessHandler = serverless(app);

export const handler: any = async (event: any, context: any) => {
    // Netlify Functions with redirects can have weird paths
    // We want the Express app to see the path starting from /api
    console.log(`Incoming request: ${event.httpMethod} ${event.path}`);

    try {
        if (!initialized) {
            console.log("Initializing lambda app...");

            // Check for DB URL before initializing
            if (!process.env.DATABASE_URL) {
                console.error("FATAL: DATABASE_URL is missing in Netlify environment!");
                return {
                    statusCode: 500,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: "Configuration Error",
                        error: "DATABASE_URL is not set. Please add it in Netlify Dashboard -> Site Settings -> Environment Variables.",
                        hint: "Use the 'Pooled connection string' from Neon for serverless functions."
                    })
                };
            }

            await registerRoutes(app);
            initialized = true;
            console.log("Lambda app initialized successfully.");
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
                hint: "Ensure DATABASE_URL is set in Netlify dashboard. If using Neon, use the 'Pooled connection string'.",
                details: error.toString(),
                stack: error.stack
            })
        };
    }
};
