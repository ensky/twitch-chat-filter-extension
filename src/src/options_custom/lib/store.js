class Store {
	static set(key, val) {
		let ns = 'settings.' + key;
		return new Promise((resolve, reject) => {
			let obj = {};
			obj[ns] = val;

			chrome.storage.sync.set(obj, resolve);
		});
	}

	static get(key) {
		let ns = 'settings.' + key;
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(ns, (data) => resolve(data[ns]));
		});
	}
};