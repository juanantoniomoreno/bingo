import { LobbyForm } from '@/components/lobby-form';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-primary-50 to-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Bingo Multiplayer
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Crea una partida o únete a una existente
        </p>
      </div>
      <LobbyForm />
    </main>
  );
}
