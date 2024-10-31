const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const getUniqueConversations = require('../utils/utils').getUniqueConversations;
const separateTemas = require('../utils/utils').separateTemas;
const createDownloadableTemas = require('../utils/utils').createDownloadableTemas;
const createDownloadableConversations = require('../utils/utils').createDownloadableConversations;

const mongodb_uri = process.env.MONGODB_URI;
let collection_nodos,
	collection_intents,
	collection_entities,
	collection_conversaciones,
	collection_temas,
	collection_scriptsNoFlujo,
	collection_gramaticasFuertes,
	collection_roles,
	collection_gramaticasDebiles,
	collection_recordatorios;

exports.db_connection = function () {
	MongoClient.connect(mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
		if (err) {
			console.error(err);
			return;
		}

		console.log('Conectado a la base de MongoDB');
		collection_nodos = client.db(process.env.MONGODB_BASE).collection('conexionesNodos');
		collection_intents = client.db(process.env.MONGODB_BASE).collection('intents');
		collection_entities = client.db(process.env.MONGODB_BASE).collection('entities');
		collection_conversaciones = client.db(process.env.MONGODB_BASE).collection('conversaciones');
		collection_temas = client.db(process.env.MONGODB_BASE).collection('temas');
		collection_scriptsNoFlujo = client.db(process.env.MONGODB_BASE).collection('scriptsNoFlujo');
		collection_gramaticasFuertes = client.db(process.env.MONGODB_BASE).collection('gramaticasFuertes');
		collection_gramaticasDebiles = client.db(process.env.MONGODB_BASE).collection('gramaticasDebiles');
		collection_users = client.db(process.env.MONGODB_BASE).collection('users_plataforma');
		collection_roles = client.db(process.env.MONGODB_BASE).collection('roles');
		collection_recordatorios = client.db(process.env.MONGODB_BASE).collection('recordatorios');
	});
};

exports.getNodos = function (callback) {
	collection_nodos.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putNodo = function (id, body, callback) {
	const _id = new ObjectId(id);
	const query = { _id: _id };

	let newValues = {};
	if (body.ejecutaFuncion) {
		newValues = { $set: body };
	} else {
		newValues = { $set: body, $unset: { ejecutaFuncion: '' } };
	}

	collection_nodos.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postNodo = function (body, callback) {
	collection_nodos.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteNodo = function (id, callback) {
	collection_nodos.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getIntents = function (callback) {
	collection_intents.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getEntities = function (callback) {
	collection_entities.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putIntent = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	const newValues = { $set: body };

	collection_intents.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putEntity = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	const newValues = { $set: body };

	collection_entities.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postIntent = function (body, callback) {
	collection_intents.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postEntity = function (body, callback) {
	collection_entities.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteIntent = function (id, callback) {
	collection_intents.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteEntity = function (id, callback) {
	collection_entities.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.markTrained = function (callback) {
	collection_intents.updateMany({}, { $set: { 'examples.$[].trained': true } }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		collection_entities.updateMany({}, { $set: { 'subentities.$[].examples.$[].trained': true } }, (err, result) => {
			if (err) {
				console.error(err);
				callback(true, err);
				return;
			}
			callback(false, result);
		});
	});
};

exports.getGramaticasFuertes = function (callback) {
	collection_gramaticasFuertes.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getGramaticasDebiles = function (callback) {
	collection_gramaticasDebiles.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putGramaticaFuerte = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	const newValues = { $set: body };

	collection_gramaticasFuertes.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postGramaticaFuerte = function (body, callback) {
	collection_gramaticasFuertes.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteGramaticaFuerte = function (id, callback) {
	collection_gramaticasFuertes.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postGramaticaDebil = function (body, callback) {
	collection_gramaticasDebiles.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putGramaticaDebil = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	const newValues = { $set: body };

	collection_gramaticasDebiles.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteGramaticaDebil = function (id, callback) {
	collection_gramaticasDebiles.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getScriptsNoFlujo = function (callback) {
	collection_scriptsNoFlujo.find().toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getRecordatorios = async function (callback) {
	try {
		const recordatorioGlobal = await collection_recordatorios.findOne({ global: true });
		const recordatorios = await collection_recordatorios.find({ $or: [{ global: false }, { global: { $exists: false } }] }).toArray();
		callback(false, { global: recordatorioGlobal, genericos: recordatorios });
	} catch (error) {
		console.error(error);
		callback(true, { global: null, genericos: [] });
	}

	return;
};

exports.deleteRecordatorio = function (id, callback) {
	collection_recordatorios.deleteOne({ _id: new mongodb.ObjectID(id) }, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.putRecordatorio = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	const newValues = { $set: body };

	collection_recordatorios.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.postRecordatorio = function (body, callback) {
	collection_recordatorios.insertOne(body, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

// exports.putScriptNoFlujo = function (id, body, callback) {
// 	const _id = new ObjectId(id);

// 	const query = { _id: _id };
// 	const newValues = { $set: body };

// 	collection_scriptsNoFlujo.updateOne(query, newValues, (err, result) => {
// 		if (err) {
// 			console.error(err);
// 			callback(true, err);
// 			return;
// 		}
// 		callback(false, result);
// 	});
// };

exports.putScriptNoFlujo = function (id, body, callback) {
	const _id = new ObjectId(id);

	const query = { _id: _id };
	let newValues = {};
	if (body.ejecutaFuncion) {
		newValues = { $set: body };
	} else {
		newValues = { $set: body, $unset: { ejecutaFuncion: '' } };
	}

	collection_scriptsNoFlujo.updateOne(query, newValues, (err, result) => {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

/* Reporteria */
exports.getConversaciones = function (date, mode, callback) {
	let query = {};
	if (date) {
		const from_date = new Date(date);
		const to_date = new Date(date);
		from_date.setDate(from_date.getDate() + 1);
		to_date.setDate(to_date.getDate() + 2);
		query = { fecha: { $gte: from_date, $lt: to_date } };
	}
	collection_conversaciones.find(query).toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		if (mode === 'noEntendido') {
			//change to mode
			const text = result
				.filter((x) => x.noEntendido)
				.map((x) => x.mensaje)
				.join('\n');
			callback(false, text);
		} else if (mode === 'conversaciones') {
			const text = createDownloadableConversations(result);
			callback(false, text);
		} else {
			const conversaciones = getUniqueConversations(result);
			const noEntendidos = result.filter((x) => x.noEntendido).map((x) => x.fecha.toISOString().substring(0, 10));
			const countConversaciones = {};
			const countNoEntendidos = {};
			conversaciones.forEach((i) => (countConversaciones[i] = (countConversaciones[i] || 0) + 1));
			noEntendidos.forEach((i) => (countNoEntendidos[i] = (countNoEntendidos[i] || 0) + 1));
			const groupedDatesCocollection_rolesnversaciones = Object.entries(countConversaciones);
			const groupedDatesNoEntendidos = Object.entries(countNoEntendidos);
			const chartConversaciones = {
				chart: 'Calendar',
				data: groupedDatesConversaciones,
				options: { title: 'Numero de conversaciones por día' },
			};
			const chartNoEntendidos = {
				chart: 'Calendar',
				data: groupedDatesNoEntendidos,
				options: { title: 'Numero de mensajes no entendidos por día' },
			};
			callback(false, {
				conversaciones: chartConversaciones,
				noEntendido: chartNoEntendidos,
			});
		}
	});
};

exports.getTemas = function (dates, mode, callback) {
	let query = {};
	if (dates) {
		const from_date = new Date(dates.split('|')[0]);
		const to_date = new Date(dates.split('|')[1]);
		query = { fecha: { $gte: from_date, $lt: to_date } };
	}
	collection_temas.find(query).toArray(function (err, result) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		if (mode === 'download') {
			const text = createDownloadableTemas(result);
			callback(false, text);
		} else {
			const temas = separateTemas(result);
			const chart = {
				chart: 'ColumnChart',
				data: temas,
				options: {
					title: 'Temas hablados ' + (dates ? `del dia ${dates.split('|')[0]} al ${dates.split('|')[1]} ` : 'en la historia'),
				},
			};
			callback(false, chart);
		}
	});
};

exports.getUser = async function (username, callback) {
	const user = await collection_users
		.aggregate([
			{ $match: { username: username } },
			{ $limit: 1 },
			{
				$lookup: {
					from: 'roles',
					localField: 'rol',
					foreignField: 'rol',
					as: 'permisos',
				},
			},
		])
		.toArray((error, data) => {
			if (error) {
				console.error(error);
				callback(true, null);
				return;
			}
			if (data.length == 0) {
				callback(true, null);
				return;
			}
			const user = data[0];
			user.permisos = user.permisos[0].permisos;
			callback(false, user);
			return;
		});
};

//Get all users
exports.getUsers = function (callback) {
	collection_users.find().toArray(function (err, res) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		const result = res.map((e) => {
			delete e.password;
			return e;
		});
		callback(false, result);
	});
};

exports.saveUser = function (user, callback) {
	collection_users.insertOne(user, (err, result) => {
		if (err) {
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.deleteUser = function (id, callback) {
	collection_users.deleteOne({ _id: new ObjectId(id) }, (err, result) => {
		if (err) {
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.modifyUser = function (id, data, callback) {
	collection_users.updateOne({ _id: new ObjectId(id) }, { $set: data }, (err, result) => {
		if (err) {
			callback(true, err);
			return;
		}
		callback(false, result);
	});
};

exports.getRoles = function (callback) {
	collection_roles.find().toArray(function (err, res) {
		if (err) {
			console.error(err);
			callback(true, err);
			return;
		}
		const result = res.map((element) => element.rol);
		callback(false, result);
	});
};
