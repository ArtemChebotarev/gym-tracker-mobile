import { useRouter } from 'expo-router';

import { MesocyclesScreen } from '@components/MesocyclesScreen';

export default function MesocyclesRoute() {
  const router = useRouter();

  return <MesocyclesScreen onRequestCreate={() => router.push('/meso-editor/basics')} />;
}
