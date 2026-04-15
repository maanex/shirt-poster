
export function lcgRandom(step: number, range = 10): number {
	const prime = 7
	const offset = 3

	return ((step * prime) + offset) % range
}

export function pickOne<T>(...options: T[]): T {
	return options[Math.floor(Math.random() * options.length)]!
}
