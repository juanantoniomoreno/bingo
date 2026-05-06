import { LobbyForm } from '@/components/lobby-form';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-wood-light">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-wood-dark mb-2">
          Bingo Multiplayer
        </h1>
        <p className="text-gray-700 text-sm sm:text-base">
          Crea una partida o únete a una existente
        </p>
      </div>
      <div className="bg-wood-texture rounded-xl shadow-lg p-6 sm:p-8 border border-wood-dark">
        <LobbyForm />
      </div>
    </main>
  );
}
