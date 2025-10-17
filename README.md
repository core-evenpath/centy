# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Running the project locally

To run this project on your local machine, you will need to have Node.js and npm installed. You'll need to run two processes in separate terminals: the Next.js development server and the Genkit AI service.

1.  **Install dependencies:**
    Open your terminal in the project root and run the following command to install all the necessary packages.
    ```bash
    npm install
    ```

2.  **Run the Next.js Development Server:**
    In your first terminal, start the Next.js development server. This runs the main application frontend.
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:9002](http://localhost:9002).

3.  **Run the Genkit AI Service:**
    In a second, separate terminal, run the Genkit service. This is required for all AI-powered features to function correctly.
    ```bash
    npm run genkit:dev
    ```
    This command starts the Genkit flows and makes them available to your Next.js application.

You should now have both the application and the AI services running locally.
