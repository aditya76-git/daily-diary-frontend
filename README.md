<h1 align="center">daily-diary-frontend 📒</h1>
<p align="center">
    <img src="https://i.imgur.com/wuO9WOM.png" alt="daily-diary-web">
</p>

<h4 align="center">
Frontend code for Daily Diary built with Flowbite and developed entirely in pure JavaScript </h4>

<div style="text-align:center;">
  <a href="https://github.com/aditya76-git">aditya76-git</a> /
  <a href="https://github.com/aditya76-git/daily-diary-frontend">daily-diary-frontend</a>
</div>

<br />

## 🚀 Live Demo

Experience the app in action! Visit the live demo:

[daily-diary-web.netlify.app](https://daily-diary-web.netlify.app)

## ⚙️ Making changes in the config

To adjust the application settings, you need to locate the `Config` class and modify the following:

1. Find the `Config` class in your codebase.
2. Adjust the `localhost` property:
   - Set to `true` for local development (this will have .html file in the url)
   - Set to `false` for production deployment (this will not have .html in the filename, good for deploys made on netlify)
3. Update the `serverApiBaseUrl` to match your server's address:
   - For local development, it's typically "http://127.0.0.1:5000"
   - For production, use your deployed API's URL
4. If needed, change the `defaultProfilePhoto` URL to your preferred default image

Example:

```javascript
class Config {
  constructor() {
    this.localhost = true; // Set to false for production
    this.serverApiBaseUrl = "http://127.0.0.1:5000";
    this.defaultProfilePhoto =
      "https://flowbite.com/docs/images/people/profile-picture-5.jpg";
  }
}
```

Remember to update these settings before deploying your application to ensure it connects to the correct server and uses the appropriate configuration for your environment.

[daily-diary-web.netlify.app](https://daily-diary-web.netlify.app)

## 📝 Description

This repository contains the fronend code for a journaling web app called Daily Diary. It is built with flowbite and developed entirely in pure JavaScript

## 🌟 Key Features

- User authentication (signup, login, logout)
- Login with Google
- Create and edit diary entries
- Categorize entries
- Search functionality
- Streak tracking for daily entries

## 🔍 Overview

The application is structured around a single `script.js` file that uses a page handler system to manage different views (signup, login, dashboard, etc.). This approach keeps the codebase modular and easy to maintain.

Key classes include:

- `PageHandler`: Manages different page views
- `ApiRequestUtils`: Handles API requests
- `Utils`: Provides utility functions used throughout the app
- `LocalStorageUtils`: Manages local storage operations
- Various handler classes for specific functionalities (e.g., `LoginFormHandler`, `DashboardAddEntryHandler`)

## 📸 Screenshots

<p align="center">
<a href="">
  <img src="https://i.imgur.com/AhCY85u.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/mygCx5H.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/KCNCT2E.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/DQ1S4ZX.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/vvW7jB3.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/EsTYOnf.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/Zzb8Gzk.png"/>
</a>&nbsp; &nbsp; &nbsp;
<a href="">
  <img src="https://i.imgur.com/FQcVmf5.png"/>
</a>&nbsp; &nbsp; &nbsp;
</p>

## 🎯 Conclusion

- The project demonstrates how small, interconnected components can create a cohesive application.

## 🌟 Show Your Support

- If you find this project useful or interesting, please consider giving it a star on GitHub. It's a simple way to show your support and help others discover the project.

## 💻Authors

- Copyright © 2024 - [aditya76-git](https://github.com/aditya76-git) / [daily-diary-frontend](https://github.com/aditya76-git/daily-diary-frontend)
