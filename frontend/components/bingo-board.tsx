"use client";

import { useCallback } from "react";

interface BingoBoardProps {
	drawnNumbers: number[];
	onToggleNumber: (number: number) => void;
	disabled?: boolean;
}

export function BingoBoard({
	drawnNumbers,
	onToggleNumber,
	disabled,
}: BingoBoardProps) {
	const isDrawn = useCallback(
		(number: number) => drawnNumbers.includes(number),
		[drawnNumbers],
	);

	const handleClick = (number: number) => {
		if (disabled) return;
		onToggleNumber(number);
	};

	const rows = 10;
	const cols = 9;

	return (
		<div className="w-full">
			<div className="grid grid-cols-9 gap-1 sm:gap-1.5 p-2 sm:p-3 bg-wood-texture rounded-xl border border-wood-dark">
				{Array.from({ length: rows }, (_, rowIndex) =>
					Array.from({ length: cols }, (_, colIndex) => {
						const number = rowIndex * 9 + colIndex + 1;
						const drawn = isDrawn(number);

						return (
							<button
								key={number}
								onClick={() => handleClick(number)}
								disabled={disabled}
								className={`
                  aspect-square flex items-center justify-center
                  text-[10px] sm:text-xs md:text-sm font-semibold rounded-md sm:rounded-lg
                  transition-all duration-150 active:scale-95
                  touch-manipulation
                  ${
										drawn
											? "bg-wood-medium shadow-inner text-wood-dark cursor-pointer"
											: "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] cursor-pointer"
									}
                  ${disabled ? "cursor-not-allowed" : ""}
                `}
							>
								{number}
							</button>
						);
					}),
				)}
			</div>
		</div>
	);
}
