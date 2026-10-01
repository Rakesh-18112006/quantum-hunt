import { redirect } from 'next/navigation';

// The hunt has no real "home page" - every entry point is either a QR scan
// (which lands on /login with a token) or someone typing the bare domain in,
// who should land in the same place rather than see the create-next-app
// starter that used to live here.
export default function Home() {
  redirect('/login');
}
