-- Verificar se a tabela profiles existe e criar se necessário
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- Adicionar coluna avatar_url na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Adicionar coluna name se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name text;

-- Garantir que todos os usuários existentes tenham um registro em profiles
INSERT INTO public.profiles (id, email, role)
SELECT 
  id, 
  email,
  COALESCE((raw_user_meta_data->>'role')::text, 'user')
FROM auth.users
ON CONFLICT (id) DO NOTHING;
