const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////                            /////////////////////////////////////////////
////////////////////////////////////////////  NEW ASYNCHRONOUS FEATURE  /////////////////////////////////////////////
////////////////////////////////////////////                            /////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.train = function (training_data, callback)
{
	const entities = training_data.entities;
	const intents = training_data.intents;
	const intents_to_train = [];
	const keywords_to_train = [];
	const post_intents = [];
	const post_entities = [];
	const local_entities = ['intent'];
	const samples_per_payload = 2;

	intents.map((intent) =>
	{
		intent.examples.map((example) =>
		{
			!example.trained
				? intents_to_train.push({
					text: example.phrase,
					entities: [
						{
							entity: 'intent',
							value: intent.intent,
						},
					],
				})
				: null;
		});
	});

	entities.map((entity) =>
	{
		entity.subentities.map((subentity) =>
		{
			subentity.examples.map((example) =>
			{
				!example.trained
					? keywords_to_train.push({
						text: example.phrase,
						entities: [
							{
								entity: entity.entity,
								value: subentity.subentity,
								start: 0,
								end: example.phrase.length,
							},
						],
					})
					: null;
			});
			local_entities.push(entity.entity);
		});
	});

	if (intents_to_train.length > 0)
	{
		let counter = 0;
		let payload = [];
		intents_to_train.map((intent, index, array) =>
		{
			payload.push(intent);
			counter++;
			if (counter === samples_per_payload || index + 1 === array.length)
			{
				post_intents.push({
					url: 'https://api.wit.ai/samples?v=20200121',
					method: 'POST',
					headers: {
						Authorization: 'Bearer ' + process.env.WIT_TOKEN,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});
				payload = [];
				counter = 0;
			}
		});
	}

	if (keywords_to_train.length > 0)
	{
		let counter = 0;
		let payload = [];
		keywords_to_train.map((keyword, index, array) =>
		{
			payload.push(keyword);
			counter++;
			if (counter === samples_per_payload || index + 1 === array.length)
			{
				post_entities.push({
					url: 'https://api.wit.ai/samples?v=20200121',
					method: 'POST',
					headers: {
						Authorization: 'Bearer ' + process.env.WIT_TOKEN,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(payload),
				});
				payload = [];
				counter = 0;
			}
		});
	}

	// = {
	// 	url: 'https://api.wit.ai/samples?v=20200121',
	// 	method: 'POST',
	// 	headers: {
	// 		Authorization: 'Bearer ' + process.env.WIT_TOKEN,
	// 		'Content-Type': 'application/json',
	// 	},
	// 	body: JSON.stringify(intents_to_train),
	// };

	//  = {
	// 	url: 'https://api.wit.ai/samples?v=20200121',
	// 	method: 'POST',
	// 	headers: {
	// 		Authorization: 'Bearer ' + process.env.WIT_TOKEN,
	// 		'Content-Type': 'application/json',
	// 	},
	// 	body: JSON.stringify(keywords_to_train),
	// };

	const retrieve_all_entities = {
		url: 'https://api.wit.ai/entities?v=20200121',
		method: 'GET',
		headers: {
			Authorization: 'Bearer ' + process.env.WIT_TOKEN,
			'Content-Type': 'application/json',
		},
	};

	request(retrieve_all_entities)
		.catch((error) =>
		{
			callback(true, error);
		})
		.then((data) =>
		{
			const wit_entities = JSON.parse(data);
			const new_entities = [];
			local_entities.map((local_entity) =>
			{
				wit_entities.indexOf(local_entity) == -1 ? new_entities.push(local_entity) : null;
			});
			return new_entities;
		})
		.then((new_entities) =>
		{
			if (new_entities.length > 0)
			{
				const Post_Requests = [];
				new_entities.map((entity) =>
				{
					const post_wit_entity = {
						url: 'https://api.wit.ai/entities?v=20200121',
						method: 'POST',
						headers: {
							Authorization: 'Bearer ' + process.env.WIT_TOKEN,
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							id: entity,
							lookups: ['keywords'],
						}),
					};
					Post_Requests.push(request(post_wit_entity));
				});
				return Promise.allSettled(Post_Requests);
			} else
			{
				return 0;
			}
		})
		.then((promises) =>
		{
			const Post_Requests = [];
			if (post_intents.length > 0)
			{
				post_intents.map((post) =>
				{
					Post_Requests.push(request(post));
				});
			}
			if (post_entities.length > 0)
			{
				post_entities.map((post) =>
				{
					Post_Requests.push(request(post));
				});
			}
			return Promise.all(Post_Requests)
				.then((result) =>
				{
					return result;
				})
				.catch(() =>
				{
					return false;
				});
		})
		.then((promises) =>
		{
			if (promises !== false)
			{
				let number = 0;
				promises.map((promise) =>
				{
					number = number + JSON.parse(promise).n;
				});
				console.log(`Se entrenaron ${ number } nuevas frases`);
				callback(false, { sent: false, n: number });
			} else
			{
				callback(true, null);
			}
		});
};

// Request Promisification
let request = (obj) =>
{
	return new Promise((resolve, reject) =>
	{
		let xhr = new XMLHttpRequest();
		xhr.open(obj.method || 'GET', obj.url);
		if (obj.headers)
		{
			Object.keys(obj.headers).forEach((key) =>
			{
				xhr.setRequestHeader(key, obj.headers[key]);
			});
		}
		xhr.onload = () =>
		{
			// const data = JSON.parse(xhr.responseText)
			// console.log(obj.body)

			if (xhr.status >= 200 && xhr.status < 300)
			{
				resolve(xhr.responseText);
			} else
			{
				reject(xhr.statusText);
			}
		};
		xhr.onerror = () => reject(xhr.statusText);
		xhr.send(obj.body);
	});
};
