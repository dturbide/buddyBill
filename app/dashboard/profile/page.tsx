import { AppLayout } from '@/components/app-layout'
import UserProfileScreen from '@/components/user-profile-screen'

export default function ProfilePage() {
  return (
    <AppLayout 
      title="Mon Profil"
      showBackButton={true}
      backHref="/dashboard"
      showNavigation={true}
    >
      <UserProfileScreen />
    </AppLayout>
  )
}
