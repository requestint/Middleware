#  How to Use Railway and Deploy Your GitHub Page

##  Step 1 — Create a GitHub Repository

To deploy your project, you first need to create a repository on GitHub.

1. Open GitHub and click the **“+”** icon in the top-right corner.  
2. From the dropdown menu, select **“New repository.”**  
3. Fill in your repository name and any other details you’d like.  
4. Click **“Create repository.”**

Once created, your new GitHub repository is ready for you to upload or push your project files to.
  and run the nesscary commands below in powershell
  
  ```Powershell
  git init
  git add .
  git commit -m "Initial commit"
  git branch -M main
  git remote add origin https://github.com/<yourusername>/<yourrepo>.git
  git push -u origin main
  ```

  you may get an error saying git isn't a package which means you need to install it on your system
  Website: https://git-scm.com/downloads/win
  
---

## Step 2 — Deploy Your Project to Railway

Now that your GitHub repository is set up, you can deploy your project using **Railway**.

1. Go to [Railway.app](https://railway.app) and sign in using your GitHub account.  
2. Click **“New Project.”**  
3. Choose **“Deploy from GitHub repo.”**  
4. Select the repository you just created.  
5. Wait for the deployment process to complete.  
   - Railway will automatically detect your project type (Node.js, etc.) and install all required dependencies.

Once the deployment finishes, you’ll see a public link like this:
  ```
    https://yourproject.up.railway.app
  ```

That’s your project’s live URL 🎉

---

## Step 3 — Run Your Project Locally (Using VS Code)

If you want to run your project locally, follow these steps:

1. **Visual Studio Code (VS Code)**.  
   - If you don’t have it installed, visit [https://code.visualstudio.com](https://code.visualstudio.com) and download it for your system.  
2. Open your project folder inside VS Code.  
3. Make sure **Node.js** is installed on your machine. Check by running:  
   ```powershell
   node -v
  ``

---

## !  Notices
  1 * Make sure to change the bot token preset in settings.js to YOUR bot token so it registers 
  to your bot and not the preset one (my bot token as of now)

  2 * When using npm int -y it requires to the expection of running scripts which may be blocked
  by default on your systems defender, Inorder to fix it Open Powershell in adminstator mode
  and type 
  ```powershell
    Set-ExecutionPolicy RemoteSigned
  ```

  Once Done you and fallowed the given steps you should be able to run

  ```powershell
  node index.js
  ```

  this will run your project file's main script
  
---


