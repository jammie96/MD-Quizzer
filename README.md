# MD-Quizzer

A scalable quiz application for AWS practice exams, built with Node.js and Express. This application allows you to create and manage quizzes in Markdown format, making it easy to maintain and update your study materials.

## Features

- Markdown-based quiz format for easy content management
- Docker support for consistent deployment
- Simple and intuitive interface
- Scalable architecture for handling multiple quizzes
- Express.js backend for reliable performance

## Prerequisites

- Docker and Docker Compose (or Podman)
- Node.js (if running without Docker)
- npm (if running without Docker)

## Installation

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MD-Quizzer.git
   cd MD-Quizzer
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```
   or
   ```bash
   docker compose up
   ```
   or with Podman:
   ```bash
   podman-compose up
   ```

### Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MD-Quizzer.git
   cd MD-Quizzer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Adding New Quizzes

1. Create a new Markdown file in the project directory
2. Follow the existing quiz format in `TestFile.md`
3. The application will automatically detect and load new quiz files

## Project Structure

```
MD-Quizzer/
├── public/          # Static files
├── server.js        # Main application server
├── Dockerfile       # Docker configuration
├── docker-compose.yml # Docker Compose configuration
└── package.json     # Project dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.