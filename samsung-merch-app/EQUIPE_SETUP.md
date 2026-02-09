# Équipe Module - Frontend Setup Instructions

## 📦 Required Dependencies

Install the following packages:

```bash
cd samsung-merch-app
npm install @tanstack/react-query @mui/x-data-grid react-hot-toast
```

**Optional (for TypeScript support):**
```bash
npm install -D typescript @types/react @types/react-dom
```

## 📁 File Structure

The following files have been created:

```
samsung-merch-app/src/
├── types/
│   └── user.ts                    # TypeScript interfaces
├── api/
│   └── usersApi.ts                # API functions
├── hooks/
│   ├── useUsers.ts                # React Query hooks for users
│   └── useStats.ts                # React Query hooks for stats
├── components/
│   └── Equipe/
│       └── UserFormModal.tsx      # Modal form for creating users
└── pages/
    └── Equipe.tsx                 # Main Team page
```

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @mui/x-data-grid react-hot-toast
```

### 2. Configure React Query Provider

Update `src/main.jsx` (or `src/main.tsx` if using TypeScript):

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-right" />
    </QueryClientProvider>
  </StrictMode>,
)
```

### 3. Update App.jsx to Use Equipe Page

Replace the Team import and route:

```jsx
// Change this line:
import Team from './pages/Team';

// To:
import Equipe from './pages/Equipe';

// And update the route:
<Route path="team" element={<Equipe />} />
```

### 4. Verify Vite Proxy Configuration

Ensure `vite.config.js` has the proxy configured:

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

### 5. TypeScript Configuration (Optional)

If you want to use TypeScript, create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

And rename `.jsx` files to `.tsx` if using TypeScript.

## 🚀 Testing

1. **Start Backend:**
   ```bash
   cd ..
   .\mvnw.cmd spring-boot:run
   ```

2. **Start Frontend:**
   ```bash
   cd samsung-merch-app
   npm run dev
   ```

3. **Navigate to:** `http://localhost:5173/team`

4. **Expected:**
   - Stats cards showing SFOS and Promoters counts
   - Two tabs: SFOS and Promoters
   - DataGrid tables with pagination
   - Floating Action Button (FAB) to add new users
   - Modal form for creating users

## 📝 Features

✅ **Stats Cards:** Display counts of SFOS, Promoters, and Supervisors  
✅ **Tabbed Interface:** Separate tabs for SFOS and Promoters  
✅ **DataGrid:** Server-side pagination with MUI DataGrid  
✅ **User Creation:** Modal form with role-based fields  
✅ **Cascading Selection:** SFOS dropdown appears only for Promoters  
✅ **Error Handling:** Toast notifications for success/error  
✅ **Loading States:** Spinners during data fetching  
✅ **TypeScript:** Fully typed with interfaces  

## 🔍 API Endpoints Used

- `GET /api/users/stats` - Get user statistics
- `GET /api/users?page=0&size=20&role=SFOS` - Get SFOS with pagination
- `GET /api/users?page=0&size=20&role=PROMOTER` - Get Promoters with pagination
- `POST /api/users` - Create new user

## 🐛 Troubleshooting

### DataGrid not showing:
- Ensure `@mui/x-data-grid` is installed
- Check browser console for errors

### React Query errors:
- Verify `QueryClientProvider` wraps the App
- Check API endpoints are accessible

### TypeScript errors:
- If using JSX files, rename to `.tsx` or remove TypeScript
- Ensure types are imported correctly

### Modal not opening:
- Check FAB click handler
- Verify UserFormModal is imported

---

**Status:** ✅ Ready for testing!
