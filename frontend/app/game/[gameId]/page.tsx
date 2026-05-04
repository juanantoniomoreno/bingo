// Game room page placeholder - T6.1 will implement role selection
export default function GamePage({ params }: { params: { gameId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Partida: {params.gameId}</h1>
      <p className="text-gray-600">Cargando...</p>
    </main>
  );
}