const { NlpManager } = require('node-nlp');
const fs = require('fs');
const request = require('request');

exports.train = function (training_data, callback) {
	// const manager = new NlpManager({
	// 	languages: ['es'],
	// 	nlu: { spellCheck: true, spellCheckDistance: 2, useNoneFeature: true, threshold: 0.7 },
	// 	ner: { threshold: 0.7 },
	// });
	const manager = new NlpManager({ languages: ['es'] });

	const { intents, entities } = training_data;
	intents.forEach((intent) => {
		intent.examples.forEach((example) => {
			manager.addDocument('es', example.phrase, intent.intent);
		});
	});
	entities.forEach((entity) => {
		entity.subentities.forEach((subent) => {
			manager.addNamedEntityText(
				entity.entity,
				subent.subentity,
				['es'],
				subent.examples.map((x) => x.phrase)
			);
		});
	});
	manager
		.train()
		.then(() => {
			manager.save();
		})
		.then(() => {
			sendModelToChatbot('model.nlp', (error) => {
				if (error) callback(true, null);
				else callback(false, { sent: true, n: intents.length + entities.length });
			});
		});
};

function sendModelToChatbot(file, callback) {
	var stream = fs.createReadStream(file).pipe(request.post(process.env.URL_CHATBOT + 'nlpModel'));
	stream.on('close', () => {
		callback(false, 'Listo');
	});
	stream.on('error', () => {
		callback(true, 'Listo');
	});
}
