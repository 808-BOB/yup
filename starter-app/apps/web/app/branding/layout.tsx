import { redirect } from 'next/navigation'
import { getServerUser, createServerSupabaseClient } from '../../lib/supabase-server'

async function checkPremiumStatus(user: any) {
  if (!user) return false

  // 1. Fast path – only check for Premium (not Pro) since custom branding is Premium-only
  if (user.is_premium || user.user_metadata?.is_premium) {
    return true
  }

  // 2. Fetch latest row from public.users to read flags
  try {
    const supabase = await createServerSupabaseClient()
    const { data: row, error } = await supabase
      .from('users')
      .select('is_premium, is_pro, username')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[BrandingLayout] premium check query error', error.message)
      return false
    }

    // Custom branding is ONLY available to Premium users, not Pro
    return row?.is_premium || row?.username === 'subourbon' // Keep admin override
  } catch (err) {
    console.error('[BrandingLayout] premium check exception', err)
    return false
  }
}

export default async function BrandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get user from server session (guaranteed by middleware)
  const user = await getServerUser()
  
  if (!user) {
    // This shouldn't happen due to middleware, but just in case
    redirect('/auth/login?redirect=branding')
  }

  // Check premium status (custom branding requires Premium plan, not Pro)
  const isPremium = await checkPremiumStatus(user)
  
  if (!isPremium) {
    redirect('/upgrade?message=premium-required-for-branding')
  }

  // User is authenticated and premium - render the page
  return <>{children}</>
} 