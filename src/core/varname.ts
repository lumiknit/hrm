const VAR_WORDS = [
	// Latin alphabets
	"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
	"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
	// Greek Letters
	"alpha", "beta", "gamma", "delta", "zeta", "eta", "theta",
	"iota", "kappa", "lambda", "mu", "nu", "omicron", "pi", "rho",
	"sigma", "tau", "phi", "chi", "psi", "omega",
	// Names
	"alice", "alan", "bob", "carol", "dave", "eve", "fred", "grace", "heidi", "ivan",
	"james", "alexa", "lucy", "jane", "peter", "simon", "zoe", "cloe", "mike",
	"chris", "david", "elsa", "frank", "harry", "julia", "kevin", "laura", "maria",
	"nick", "olivia", "paul", "quinn", "rachel", "steve", "tom", "victor", "wendy",
	// Foods / Fruits
	"apple", "grape", "melon", "peach", "plum", "pear", "mango", "kiwi", "berry",
	"bean", "corn", "rice", "soup", "cake", "bread", "toast", "salad", "pizza",
	// Animals
	"lion", "tiger", "bear", "wolf", "fox", "deer", "frog", "duck", "swan",
	"dove", "seal", "whale", "shark", "crab", "fish", "ant", "bee", "moth",
	// Nature
	"tree", "leaf", "wood", "rock", "stone", "sand", "dirt", "gold", "iron",
	"wind", "rain", "snow", "ice", "fire", "star", "moon", "sun", "sky",
	"cloud", "wave", "river", "lake", "pond", "hill", "cliff",
	// Objects
	"hat", "shoe", "coat", "sock", "ring", "bag", "cup", "bowl", "fork",
	"desk", "chair", "bed", "door", "roof", "wall", "lamp", "clock", "bell",
	"ship", "boat", "car", "bike", "drum", "truck", "plane",
];

export const uniqueVar = (nameSet: Set<string>): string => {
	const randomOffset = Math.floor(Math.random() * VAR_WORDS.length);

	// Traverse over the names
	for (let j = 0; j < 100; j++) {
		for (let i = 0; i < VAR_WORDS.length; i++) {
			const idx = (randomOffset + i) % VAR_WORDS.length;
			const name = j === 0 ? VAR_WORDS[idx] : `${VAR_WORDS[idx]}${j}`;
			if (!nameSet.has(name)) {
				return name;
			}
		}
	}
	return ""
}
