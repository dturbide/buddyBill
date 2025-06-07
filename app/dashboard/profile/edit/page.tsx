import { AppLayout } from '@/components/app-layout'
import EditProfileScreen from '@/components/edit-profile-screen'

export default function EditProfilePage() {
  return (
    <AppLayout 
      title="Modifier le profil"
      showBackButton={true}
      backHref="/dashboard/profile"
      showNavigation={true}
    >
      <EditProfileScreen />
    </AppLayout>
  )
}
