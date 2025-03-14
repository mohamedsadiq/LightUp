# LightUp Extension Permissions Explanation

## Required Permissions

### Host Permissions
```json
"host_permissions": [
  "http://127.0.0.1:1234/*",
  "https://*/*",
  "http://*/*"
]
```
- `http://127.0.0.1:1234/*`: Required for local LLM processing, enabling users to run AI models on their own machines
- `https://*/*` and `http://*/*`: Needed to access web pages for text selection and analysis

### Chrome Permissions
```json
"permissions": [
  "activeTab",
  "storage",
  "commands"
]
```

1. **tabs**
   - Purpose: Access current tab information
   - Used for: 
     - Getting page context for better AI analysis
     - Managing popup positioning
     - Handling multiple tab states

2. **activeTab**
   - Purpose: Access the current active tab
   - Used for:
     - Reading selected text
     - Applying highlights
     - Injecting response UI

3. **scripting**
   - Purpose: Interact with web page content
   - Used for:
     - Capturing selected text
     - Applying highlights to text
     - Inserting AI responses
     - Managing popup UI

4. **storage**
   - Purpose: Save user preferences
   - Used for:
     - Storing API keys securely
     - Saving user settings
     - Managing theme preferences
     - Persisting customizations

5. **commands**
   - Purpose: Handle keyboard shortcuts
   - Used for:
     - Opening welcome page (Ctrl+Shift+W)
     - Quick access to features
     - Power user functionality

## Security Measures

- All permissions are used with minimal scope
- No unnecessary permissions requested
- Data access is limited to explicit user actions
- All storage is local to the user's browser
- No background tracking or monitoring

## User Control

Users can:
- Disable any permission
- Use local processing only
- Clear stored data
- Remove the extension

## Best Practices

We follow Chrome's best practices for permissions:
- Request only what's needed
- Explain each permission's purpose
- Provide user control
- Maintain transparency
- Regular security audits 