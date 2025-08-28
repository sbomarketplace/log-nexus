# iOS Setup Instructions

Run these commands in your project root directory:

```bash
# 1. Install dependencies and build the project
npm install
npm run build

# 2. Add the iOS platform
npx cap add ios

# 3. Sync the project to iOS
npx cap sync ios
```

After running these commands, the `ios/` directory should be created with the necessary Xcode project files.

Then I can proceed with updating the iOS deployment target and Swift version for newer Xcode compatibility.