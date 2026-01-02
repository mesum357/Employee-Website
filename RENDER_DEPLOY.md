# Deploy Employee Website to Render

## Prerequisites
- A Render account
- Your backend API deployed on Render (or another service)

## Deployment Steps

### 1. Create a New Static Site on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository (or use Render's GitHub integration)

### 2. Configure Build Settings

- **Name**: `employee-website` (or your preferred name)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `Employee Website`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### 3. Add Environment Variables

In the Render dashboard, go to your static site settings and add:

**Key**: `VITE_API_URL`  
**Value**: Your backend API URL (e.g., `https://your-backend.onrender.com/api`)

**Important**: 
- Make sure to include the `/api` suffix if your backend serves the API at that path
- Do NOT include a trailing slash
- For local development, you can use `http://localhost:5000/api`

### 4. Deploy

Click "Create Static Site" and Render will build and deploy your application.

## Example Environment Variable

```
VITE_API_URL=https://your-backend-api.onrender.com/api
```

## Notes

- The build process will automatically use the `VITE_API_URL` environment variable
- Changes to environment variables require a rebuild
- After deployment, your site will be available at a URL like: `https://employee-website.onrender.com`

