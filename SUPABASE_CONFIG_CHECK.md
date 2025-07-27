# Verificación de Configuración de Supabase

## URLs que deben estar configuradas en Supabase:

### 1. Site URL:
```
https://pfn-personal-finances.vercel.app
```

### 2. Redirect URLs:
```
https://pfn-personal-finances.vercel.app
https://pfn-personal-finances.vercel.app/auth/callback
```

### 3. Google Provider Configuration:
- **Enable:** ✅ Habilitado
- **Client ID:** [Tu Client ID de Google]
- **Client Secret:** [Tu Client Secret de Google]
- **Redirect URL:** `https://bpjlnxorlwfbuemibvbm.supabase.co/auth/v1/callback`

## URLs que deben estar en Google Cloud Console:

### Authorized JavaScript origins:
```
http://localhost:5173
https://pfn-personal-finances.vercel.app
```

### Authorized redirect URIs:
```
http://localhost:5173/auth/callback
https://pfn-personal-finances.vercel.app/auth/callback
https://bpjlnxorlwfbuemibvbm.supabase.co/auth/v1/callback
```

## Pasos para verificar:
1. Ve a https://supabase.com/dashboard/project/bpjlnxorlwfbuemibvbm
2. Authentication → URL Configuration
3. Authentication → Providers → Google
4. Verifica que todas las URLs estén correctas 