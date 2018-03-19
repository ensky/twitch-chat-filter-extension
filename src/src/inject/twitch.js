class Context {
	static isNeedToInject() {
		return !!document.querySelector('.video-chat') || !!document.querySelector('.chat-list');
	}

	main() {
		this.mainEl = document.querySelector('.video-chat') || document.querySelector('.chat-list');
		this.isLive = !!document.querySelector('.chat-list');
		this.selectors = {
			messageMain: this.isLive ? 'div[data-a-target="chat-line-message"]' : 'div[data-test-selector="message-layout"]'
		};

		this.messageParser = new MessageParser(this);
		this.menuHandler = new MenuHandler(this);
		this.filterHandler = new FilterHandler(this);
		this.observer = new Observer(this);
		this.renderer = new Renderer(this);
	}
};

class MenuHandler {
	constructor(context) {
		this.context = context;
		this.context.mainEl.addEventListener('dblclick', this.onClickedAny.bind(this));
	}

	onClickedAny(event) {
		let messageRow = $(event.target).parents(this.context.selectors.messageMain).get(0);
		if (!messageRow) {
			return;
		}

		let message = this.context.messageParser.parse(messageRow);
		if (!message) {
			return;
		}

		let prompt = window.prompt(chrome.i18n.getMessage('inject_prompt_message'), message.msg);
		if (prompt && prompt.length > 0) {
			message.msg = prompt;

			this.context.filterHandler.addFilter(message, {message: true});
		}
	}
};

class FilterHandler {
	constructor(context) {
		this.context = context;
		this.initFilter();
	}

	initFilter() {
		this.blocks = {};

		return Promise.all([
			Setting.get(Setting.keys.users)
				.then((users) => {
					this.blocks.users = this.fromString(users);
				}),
			Setting.get(Setting.keys.msgs)
				.then((msgs) => {
					this.blocks.msgs = this.fromString(msgs);
				})
		]);
	}

	syncFilter() {
		return Promise.all([
			Setting.set(Setting.keys.users, this.toString(this.blocks.users)),
			Setting.set(Setting.keys.msgs, this.toString(this.blocks.msgs))
		]);
	}

	fromString(text) {
		if (!text) {
			return new Set();
		}

		return text.split('\n').reduce((set, val) => {
			val = val.trim();
			if (val.length > 0) {
				set.add(val);
			}
			return set;
		}, new Set());
	}

	toString(set) {
		return Array.from(set).join('\n');
	}

	addFilter(message, filter = { user: true, message: true }) {
		if (filter.user) {
			this.blocks.users.add(message.user);
		}

		if (filter.message) {
			this.blocks.msgs.add(message.msg);
		}

		console.debug('message', message, 'is added to filter');
		this.syncFilter();
	}

	onNodeAdded(message, messageDom) {
		if (this.isFiltered(message)) {
			this.context.renderer.filter(messageDom);
		}
	}

	isFiltered(message) {
		if (this.isFilteredByUser(message)) {
			console.debug('message is filtered by user', message);
			return true;
		}

		if (this.isFilteredByMessage(message)) {
			console.debug('message is filtered by message', message);
			// this.addFilter(message.user, { user: true });
			return true;
		}

		return false;
	}

	isFilteredByUser(message) {
		return this.blocks.users.has(message.user);
	}

	isFilteredByMessage(message) {
		return Array.from(this.blocks.msgs).some((msg) => {
			return message.msg.indexOf(msg) !== -1;
		});
	}
};

class Observer {
	constructor(context) {
		this.context = context;

		let config = { attributes: false, childList: true, subtree: true };
		this.observer = new MutationObserver(this.onChildNodeChanged.bind(this));
		this.observer.observe(this.context.mainEl, config);
	}

	onChildNodeChanged(mutationsList) {
		for (let mutation of mutationsList) {
			if (mutation.type === 'childList' && (mutation.target.nodeName === 'UL' || mutation.target.nodeName === 'DIV')) {
				mutation.addedNodes.forEach(this.onNodeAdded.bind(this));
			}
		}
	}

	onNodeAdded(listDom) {
		let messageRow;

		if (this.context.isLive) {
			if ($(listDom).attr('data-a-target') !== 'chat-line-message') {
				return;
			}
			messageRow = listDom;
		} else {
			messageRow = listDom.querySelector(this.context.selectors.messageMain);

			if (!messageRow) {
				return;
			}
		}

		setTimeout(() => {
			let message = this.context.messageParser.parse(messageRow);
			if (!message) {
				return;
			}

			this.context.filterHandler.onNodeAdded(message, messageRow);
		}, 50);
	}
};

class MessageParser {
	constructor(context) {
		this.context = context;
	}

	parse(messageDom) {
		this.dom = messageDom;

		this.result = new Message();
		this.isGood = this.parseUser() && this.parseMsg();

		return this.isGood ? this.result : null;
	}

	parseUser() {
		let userDom = this.dom.querySelector('span[data-test-selector="message-username"]');
		if (!userDom) {
			return false;
		}

		let user = $(userDom).attr('data-a-user');
		if (!user) {
			return false;
		}

		this.result.user = user;

		return true;
	}

	parseMsg() {
		let msgDom = this.context.isLive ? this.dom : this.dom.querySelector('div[data-test-selector="comment-message-selector"] .qa-mod-message');
		if (!msgDom) {
			return false;
		}

		let msg = '';
		for (let child of msgDom.children) {
			msg += this.parseMsgSpan(child);
		}
		msg = msg.trim();

		if (msg.length === 0) {
			return false;
		}

		this.result.msg = msg;

		return true;
	}

	parseMsgSpan(span) {
		let $span = $(span);
		let target = $span.attr('data-a-target');

		if (this.context.isLive) {
			if (target !== 'emote-name' && target !== 'chat-message-text') {
				return '';
			}
		}

		if (target === 'emote-name') {
			return $span.children().eq(0).attr('alt');
		} else {
			return $span.text();
		}
	}
};

class Renderer {
	constructor(context) {
		this.context = context;
	}

	filter(messageDom) {
		window.requestAnimationFrame(() => {
			$(messageDom).addClass('filtered-by-user');
		})
	}
};

/**
 * user
 * msg
 */
class Message { };

class Setting {
	static set(key, val) {
		return new Promise((resolve, reject) => {
			let obj = {};
			obj[key] = val;

			chrome.storage.sync.set(obj, resolve);
		});
	}

	static get(key) {
		return new Promise((resolve, reject) => {
			chrome.storage.sync.get(key, (data) => resolve(data[key]));
		});
	}
};

Setting.keys = {
	users: 'settings.users',
	msgs: 'settings.msgs'
};

var readyStateCheckInterval = setInterval(function () {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		if (Context.isNeedToInject()) {
			new Context().main();
		}
	}
}, 10);
