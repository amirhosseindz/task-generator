# Troubleshooting Guide

Common issues and solutions for the Task Generator application.

## Backend Issues

### Server won't start

- **Check port availability**: Ensure port 5000 is not in use (or configure alternative port in `docker.env`)
- **Verify environment variables**: Ensure `.env.development` or `.env.production` file exists and contains required variables
- **Check OpenAI API key**: Verify `OPENAI_API_KEY` is set correctly

### OpenAI API errors

- **Invalid API key**: Verify your OpenAI API key is correct and has sufficient credits
- **Rate limiting**: Check if you've exceeded API rate limits
- **Model availability**: Ensure the specified model (`OPENAI_MODEL`) is available

### CORS errors

- **Check CORS_ORIGIN**: Ensure `CORS_ORIGIN` in backend `.env.development` or `.env.production` matches your frontend URL
- **Development**: Should be `http://localhost:3000`
- **Production**: Should match your production frontend domain

## Frontend Issues

### Cannot connect to backend

- **Check API URL**: Verify `VITE_API_URL` in `.env.development` or `.env.production`
- **Backend running**: Ensure backend server is running and accessible
- **Network issues**: Check firewall and network connectivity
- **Port mismatch**: If you changed backend port in `docker.env`, ensure `VITE_API_URL` matches the new port

### Build errors

- **Node version**: Ensure Node.js version 20+ is installed
- **Dependencies**: Run `npm install` to ensure all dependencies are installed
- **Environment variables**: Ensure all required environment variables are set

## Docker Issues

### Containers won't start

- **Docker running**: Ensure Docker daemon is running
- **Port conflicts**: 
  - Ports are configurable via the `docker.env` file
  - If port 5000 is already in use (e.g., macOS AirPlay Receiver), edit `docker.env` and set `BACKEND_PORT=5001` (or another available port)
  - On macOS, port 5000 is often used by AirPlay Receiver (disable in System Settings > General > AirDrop & Handoff, or use alternative port in `docker.env`)
  - After changing ports, restart services: `make restart`
  - Remember to update `frontend/.env.development` or `frontend/.env.production` if you change the backend port
- **Build errors**: Check Docker build logs: `make logs` or `docker-compose logs`

### Hot-reload not working

- **Volume mounts**: Verify volumes are correctly mounted in `docker-compose.dev.yml`
- **File permissions**: Ensure files have correct permissions for Docker user

### Image build failures

- **Dockerfile syntax**: Check Dockerfile syntax and base images
- **Network issues**: Ensure Docker can pull base images from Docker Hub
- **Build context**: Ensure you're running commands from the correct directory

## General Issues

### Environment variables not loading

- **File location**: Ensure `.env` files are in the correct directories
- **File naming**: 
  - Backend: Use `.env.development` for development, `.env.production` for production
  - Frontend: Use `.env.development` for development, `.env.production` for production
- **Auto-creation**: The make commands automatically create these files from `.env.example` if they don't exist
- **Restart required**: Restart services after changing environment variables using `make restart`
- **Make prompts**: The make commands will prompt you for required values (OpenAI API key, model, etc.) if not already set

### Module not found errors

- **Dependencies**: Run `npm install` in the affected directory
- **Node modules**: Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Jira Integration Issues

### OAuth authentication fails

- **Check credentials**: Verify `ATLASSIAN_CLIENT_ID` and `ATLASSIAN_CLIENT_SECRET` are correct
- **Redirect URI**: Ensure `OAUTH_REDIRECT_URI` exactly matches the redirect URI configured in your Atlassian OAuth app
- **Session secret**: Ensure `SESSION_SECRET` is set and consistent

### Cannot export to Jira

- **Authentication**: Ensure you've completed the OAuth flow and are authenticated
- **Project access**: Verify your Atlassian account has access to the target Jira project
- **Scopes**: Ensure your OAuth app has the required scopes (`read:jira-work`, `write:jira-work`)
- **Check logs**: Use `make logs-backend` to see detailed error messages

## Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs: `make logs` or `make logs-backend`
2. Verify all environment variables are configured correctly (see [CONFIGURATION.md](CONFIGURATION.md))
3. Review the [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API-related issues
4. Open an issue on the GitHub repository with:
   - Description of the problem
   - Steps to reproduce
   - Relevant log output
   - Environment details (OS, Docker version, etc.)
