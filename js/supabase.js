import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 🔴 ОСЫ ЖЕРГЕ ӨЗ ДАННЫЙЛАРЫҢДЫ ҚОЙ
const supabaseUrl = 'https://npaouiqmprigoaxitunm.supabase.co'
const supabaseKey = 'sb_publishable_nK6PIsZQiM_1pzN19XZgow_2f_p0vQs'

// клиент
export const supabase = createClient(supabaseUrl, supabaseKey)