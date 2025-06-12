# Confidential Copilot

Confidential Copilot is a privacy-preserving AI assistant platform. It leverages secure technologies to provide intelligent assistance while protecting user data and communications.

## Features

- **Privacy-first:** Built with privacy and security as core principles.
- **AI-powered assistance:** Integrates with modern AI frameworks for natural language understanding and task automation.
- **Extensible:** Modular design allows for additional extensions, such as the email assistant.
- **Modern stack:** Uses Next.js, React, and a suite of powerful libraries for rapid development.

## Project Structure

- `/extensions/email-assistant-extension` — A secure email assistant with privacy-preserving features.
- Main application in the project root (`cc_copilot`), built with Next.js and React.

## Getting Started

### Prerequisites

- Node.js (v18 or newer recommended)
- npm or yarn

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Development

To start the main app in development mode:

```bash
npm run dev
```

For the email assistant extension:

```bash
cd extensions/email-assistant-extension
npm install
npm run start
```

### Build

To build the main app:

```bash
npm run build
```

To build the email assistant extension:

```bash
cd extensions/email-assistant-extension
npm run build
```

## Scripts

- `dev` — Start Next.js app in development mode
- `build` — Build for production
- `start` — Run the production build
- `lint` — Lint codebase

## Dependencies

- Next.js
- React
- Supabase
- LangChain
- Radix UI
- and others (see `package.json`)

### Extension Dependencies

- React
- Webpack

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project may not yet have a license specified. Please add one to clarify usage.

## Maintainers

- Organization: [Four-Score](https://github.com/Four-Score)

---

*Generated with Copilot. Please edit for accuracy and to add project-specific details!*
