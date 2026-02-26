let cnt = 0n;
export const uniqueID = () => {
	const c = cnt;
	cnt = (cnt + 1n) % (36n * 36n);
	return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}_${c.toString(36)}`;
};
