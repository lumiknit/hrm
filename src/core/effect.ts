/**
 * Getter is a function which returns a value of the signal.
 * If Getter is called inside an effect, the effect will be subscribed to the signal.
 */
export type Getter<T> = (ctx?: Effect) => T;

/**
 * Setter is a function which update a value of the signal.
 * After Setter is called, the subscribed effects will be scheduled to run.
 */
export type Setter<T> = (value: T) => void;

/**
 * Signal is a combination of Getter and Setter.
 */
export type Signal<T> = [Getter<T>, Setter<T>];

export type Effect = {
	execute: () => void | Promise<void>;
	deps: Set<Set<Effect>>;
};

/**
 * EffectController is a context of signals and effects.
 * If provides to create signal, effect and memo.
 * Also, you can manually execute effects by runOne or run method.
 */
export class EffectController {
	private pendingEffects: Set<Effect> = new Set();

	public runMicroBatchSize = 200;
	public macroBatchDuration = 12; // ms

	/**
	 * Create a reactive signal with an initial value.
	 * @param initValue The initial value of the signal.
	 * @return A tuple of Getter and Setter for the signal.
	 */
	public sig<T>(initValue: T): Signal<T> {
		let value = initValue;
		const subscribers = new Set<Effect>();

		const get = (ctx?: Effect) => {
			if (ctx) {
				subscribers.add(ctx);
				ctx.deps.add(subscribers);
			}
			return value;
		};

		const set = (newValue: T) => {
			if (value === newValue) {
				return;
			}
			value = newValue;
			for (const effect of subscribers) {
				this.pendingEffects.add(effect);
			}
		};

		return [get, set] as const;
	}

	/**
	 * Create a reactive effect that runs the provided function.
	 * @param fn The function to run as an effect.
	 */
	public eff(fn: (ctx: Effect) => void | Promise<void>) {
		const effect: Effect = {
			execute: () => {
				// Cleanup: 실행 전 기존의 모든 구독 관계를 끊음
				effect.deps.forEach(subSet => subSet.delete(effect));
				effect.deps.clear();
				return fn(effect);
			},
			deps: new Set(),
		};

		effect.execute();
	}

	/**
	 * Run single pending effect.
	 */
	public async runOne(): Promise<boolean> {
		const effect = this.pendingEffects.values().next().value;
		if (effect) {
			this.pendingEffects.delete(effect);
			try {
				await effect.execute();
			} catch (e) {
				console.error("Error in effect:", e);
			}
			return true;
		}
		return false;
	}

	/**
	 * Asynchronously run pending effects.
	 */
	public async run(limit?: number): Promise<number> {
		if (limit === undefined) {
			limit = Infinity;
		}
		let counter = 0;
		let now = performance.now();

		let micro = 0;
		let macro = 0;

		while (counter < limit) {
			if (!(await this.runOne())) {
				break;
			}
			counter++;
			if (counter % this.runMicroBatchSize === 0) {
				let elapsed = performance.now() - now;
				if (elapsed >= this.macroBatchDuration) {
					await new Promise<void>(resolve => setTimeout(resolve, 0));
					now = performance.now();
					macro++;
				} else {
					await new Promise<void>(resolve => queueMicrotask(resolve));
					micro++;
				}
			}
		}
		return counter;
	}
}
