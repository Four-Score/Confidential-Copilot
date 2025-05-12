### Documentation: How to Run the `email-assistant-extension` Folder

This documentation provides a step-by-step guide to set up, run, and use the `email-assistant-extension` project.

---

### 1. **Prerequisites**
Before running the project, ensure you have the following installed on your system:
- **Node.js** (v14 or higher)
- **npm** or **yarn** (for managing dependencies)
- **Google Chrome** (or any Chromium-based browser)

---

### 2. **Setup Instructions**

#### a. Clone the Repository
If you haven't already, clone the repository to your local machine:
```bash
git clone <repository-url>
cd email-assistant-extension
```

#### b. Install Dependencies
Run the following command to install the required dependencies:
```bash
npm install
```

#### c. Build the Extension
To build the extension, run:
```bash
npm run build
```
This will generate the necessary files in the `dist/` folder.

---

### 3. **Unpacking the Extension**

#### a. Open Chrome Extensions Page
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.

#### b. Enable Developer Mode
1. Toggle the **Developer mode** switch in the top-right corner of the page.

#### c. Load the Unpacked Extension
1. Click on the **Load unpacked** button.
2. Select the `dist/` folder generated during the build process.

---

### 4. **Setting the Extension Key**
The extension uses a key file (`dist.pem`) for signing and identification. Follow these steps to set it up:

1. Ensure the `dist.pem` file is present in the root directory of the project.
2. During the build process, the key is automatically used to sign the extension. If you need to regenerate the `.crx` file, run:
   ```bash
   npm run build:crx
   ```
   This will create a new `dist.crx` file.

---

### 5. **Running the Extension**

Once the extension is loaded in Chrome:
1. Click on the extension icon in the browser toolbar.
2. The popup UI (`popup.html`) will appear, allowing you to interact with the extension.

---

### 6. **Folder Structure Overview**
Here’s a brief overview of the key files and folders in the project:

- **src**: Contains the source code for the extension.
  - **`background.js`**: Handles background tasks for the extension.
  - **`content.tsx`**: Injects scripts into web pages.
  - **`popup.tsx`**: Manages the popup UI.
  - **`core/`**: Core logic for email extraction, analysis, and response generation.
  - **`services/`**: Contains services for API calls, email uploads, and local storage.
  - **`interfaces/`**: Defines TypeScript interfaces for the project.
  - **`public/manifest.json`**: The manifest file that defines the extension's metadata and permissions.

- **`dist/`**: Contains the built files for the extension.
  - **`dist.crx`**: The packaged extension file.
  - **`dist.pem`**: The private key used for signing the extension.

---

### 7. **Development Workflow**

#### a. Start Development Server
To start a development server and watch for changes:
```bash
npm run dev
```

#### b. Rebuild the Extension
If you make changes to the source code, rebuild the extension:
```bash
npm run build
```

---

### 8. **Debugging the Extension**

1. Open the Chrome Extensions page (`chrome://extensions/`).
2. Locate the `email-assistant-extension`.
3. Click on **Background Page** under the extension to open the Developer Tools for debugging background scripts.
4. Use the **Console** tab to view logs and debug issues.

---

### 9. **Testing**

#### a. Unit Tests
Run unit tests using:
```bash
npm test
```

#### b. Manual Testing
- Load the extension in Chrome.
- Test the popup UI and content scripts on supported email platforms (e.g., Gmail).

---

### 10. **Notes**
- The .gitignore file excludes sensitive files like `.pem` keys, `.env` files, and build artifacts.
- Ensure you do not commit the `dist.pem` file to version control for security reasons.

---

This documentation should help you set up and run the `email-assistant-extension` project. Let me know if you need further assistance!