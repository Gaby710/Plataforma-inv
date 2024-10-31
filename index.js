process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
//  -   -   -   -   -   -   -   -   -   -   N O D E   M O D U L E S  -   -   -   -   -   -   -   -   -   -

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const request = require('request');
const pm2 = require('pm2');
const db_functions = require('./database_connection/' + process.env.DB);
const training_functions = require('./training/' + process.env.NLP_MODEL);
const db_reporteria_functions = require('./database_connection/' + process.env.DB_REPORTES);
const formatDate = require('./utils/utils.js').formatDate;

db_functions.db_connection();
db_reporteria_functions.db_connection();

//  -   -   -   -   -   -   -   -   -   -   C O N E X I Ó N   A P I    -   -   -   -   -   -   -   -   -

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const port = process.env.PORT;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => console.log(`Servidor de plataforma de control de chatbots escuchando peticiones en el puerto: ${port}!`));

//  -   -   -   -   -   -   -   -   -   -   -   -   F L U J O   -   -   -   -   -   -   -   -   -   -   -   -

// Get Todas las Páginas de FB
app.get('/api/getAllFbPages', (req, res) => {
	db_reporteria_functions.getAllFbPages((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

// Get todos los canales
app.get('/api/getAllChannels', (req, res) => {
	db_reporteria_functions.getAllChannels((err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		res.json(result);
	});
});

// Get de todos los nodos
app.get('/api', (req, res) => {
	db_functions.getNodos((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

// Update de un nodo
app.put('/api/edit/:id', (req, res) => {
	db_functions.putNodo(req.params.id, req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Create de un nodo
app.post('/api/create', (req, res) => {
	db_functions.postNodo(req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Delete de un nodo
app.delete('/api/delete/:id', (req, res) => {
	db_functions.deleteNodo(req.params.id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		res.json(result);
	});
});

//Get de intents
app.get('/api/intents', (req, res) => {
	db_functions.getIntents((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Get de entities
app.get('/api/entities', (req, res) => {
	db_functions.getEntities((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Update de un intent
app.put('/api/intents/edit/:id', (req, res) => {
	db_functions.putIntent(req.params.id, req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Update de un entity
app.put('/api/entities/edit/:id', (req, res) => {
	db_functions.putEntity(req.params.id, req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Create de un intent
app.post('/api/intents/create', (req, res) => {
	db_functions.postIntent(req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Create de un entity
app.post('/api/entities/create', (req, res) => {
	db_functions.postEntity(req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Delete de un intent
app.delete('/api/intents', (req, res) => {
	if (!req.body._id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteIntent(req.body._id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Delete de un entity
app.delete('/api/entities', (req, res) => {
	if (!req.body._id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteEntity(req.body._id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Create de multiples intents
app.post('/api/intents/create_multiple', (req, res) => {
	req.body.intents.forEach((intent) => {
		db_functions.postIntent({ intent: intent, examples: [] }, (err, result) => {
			if (err) return console.error(err);
		});
	});
	res.json({ status: 'OK' });
});

//Create de multiples entities
app.post('/api/entities/create_multiple', (req, res) => {
	req.body.entities.forEach((entity) => {
		db_functions.postEntity({ entity: entity, subentities: [] }, (err, result) => {
			if (err) return console.error(err);
		});
	});
	res.json({ status: 'OK' });
});

//Get de conversaciones
app.get('/api/conversaciones', (req, res) => {
	db_reporteria_functions.getHistoricoConversaciones((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Get de temas
app.post('/api/temas', (req, res) => {
	const from = req.body.from;
	const to = req.body.to;
	const fbPage = req.body.fbPage;
	console.log(`from: ${from}`);
	console.log(`to: ${to}`);
	console.log(`fbPage: ${fbPage}`);

	db_reporteria_functions.getTemas(from, to, fbPage, 'data', (err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		// console.log(result);
		res.json(result);
	});
});

app.get('/api/download/temas', (req, res) => {
	db_reporteria_functions.getTemas((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=Reporte.xlsx');
		result.xlsx.write(res).then(function () {
			res.status(200).end();
		});
	});
});

app.post('/api/download/conversaciones', (req, res) => {
	var from = req.body.from;
	var to = req.body.to;
	var fbPageName = req.body.fbPage;

	db_reporteria_functions.getConversacionesInRange(from, to, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=Reporte.xlsx');
		result.xlsx.write(res).then(function () {
			res.status(200).end();
		});
	});
});

app.post('/api/download/noEntendidos', (req, res) => {
	const from = req.body.from;
	const to = req.body.to;

	db_reporteria_functions.getNoEntendidosInRange(from, to, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		res.setHeader('Content-Disposition', 'attachment; filename=Reporte.xlsx');
		result.xlsx.write(res).then(function () {
			res.status(200).end();
		});
	});
});

//Get para notificar el reentrenamiento del robot
app.get('/api/train', (req, res) => {
	console.log('Entrenando');
	db_functions.getIntents((err, intents) => {
		if (err) {
			console.error(err);
			return res.status(500).send('Something Broke!');
		}
		db_functions.getEntities((err, entities) => {
			training_functions.train({ intents: intents, entities: entities }, (err, result) => {
				if (err) return res.status(500).send('Something Broke!');
				res.json(result);
				db_functions.markTrained((err, result) => {
					if (err) return res.status(500).send('Something Broke!');
				});
			});
		});
	});
});

//Get para recibir o cambiar webhook de telegram
app.get('/api/telegram_bot', (req, res) => {
	if (req.query.url) {
		request('https://api.telegram.org/' + process.env.TELEGRAM_BOT_TOKEN + '/setWebhook?url=' + req.query.url, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				const data = JSON.parse(body);
				if (data.ok) {
					res.json(data.description);
				} else {
					res.status(500).send('Something broke!');
				}
			}
		});
	} else {
		request('https://api.telegram.org/' + process.env.TELEGRAM_BOT_TOKEN + '/getWebhookInfo', function (error, response, body) {
			if (!error && response.statusCode == 200) {
				const data = JSON.parse(body);
				if (data.ok) {
					res.json(data.result.url);
				}
			}
		});
	}
});

app.get('/api/legends', (req, res) => {
	db_reporteria_functions.getLegends((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

// app.post('/api/dayStats', (req, res) =>
// {
//     var date = req.body.date

//     const utc_offset = new Date().getTimezoneOffset() * 60 * 1000
//     const todayDate = formatDate(new Date(new Date() + utc_offset))

//     date = date == '' ?  todayDate : date

//     db_reporteria_functions.getDayStats(date, (err, result) =>
//     {
//         if (err)
//             return res.status(500).send('Something Broke!')

//         res.json(result);
//     })
// })

app.post('/api/dayStats', (req, res) => {
	var date = req.body.date;
	var fbPageName = req.body.fbPage;
	var channel = req.body.channel;

	const utc_offset = new Date().getTimezoneOffset() * 60 * 1000;
	const todayDate = formatDate(new Date(new Date() + utc_offset));

	date = date ? date : todayDate;

	db_reporteria_functions.getDayStats(date, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.get('/api/gramaticasFuertes', (req, res) => {
	db_functions.getGramaticasFuertes((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.get('/api/gramaticasDebiles', (req, res) => {
	db_functions.getGramaticasDebiles((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.put('/api/gramaticasFuertes', (req, res) => {
	const gramatica = req.body.gramatica;
	const id = gramatica._id;
	delete gramatica._id;
	db_functions.putGramaticaFuerte(id, gramatica, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.post('/api/gramaticasFuertes', (req, res) => {
	const gramatica = req.body.gramatica;
	db_functions.postGramaticaFuerte(gramatica, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.delete('/api/gramaticasFuertes', (req, res) => {
	if (!req.body.id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteGramaticaFuerte(req.body.id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.put('/api/gramaticasDebiles', (req, res) => {
	const gramatica = req.body.gramatica;
	const id = gramatica._id;
	delete gramatica._id;
	db_functions.putGramaticaDebil(id, gramatica, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.post('/api/gramaticasDebiles', (req, res) => {
	const gramatica = req.body.gramatica;
	db_functions.postGramaticaDebil(gramatica, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.delete('/api/gramaticasDebiles', (req, res) => {
	if (!req.body.id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteGramaticaDebil(req.body.id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.get('/api/scriptsNoFlujo', (req, res) => {
	db_functions.getScriptsNoFlujo((err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.put('/api/scriptsNoFlujo', (req, res) => {
	const id = req.body._id;
	delete req.body._id;
	db_functions.putScriptNoFlujo(id, req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.put('/api/scriptsNoFlujo', (req, res) => {
	const id = req.body._id;
	delete req.body._id;
	db_functions.putScriptNoFlujo(id, req.body, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.get('/api/recordatorios', (req, res) => {
	db_functions.getRecordatorios((err, result) => {
		if (err) {
			console.error(err);
			return res.status(500).send('Something Broke!');
		}
		res.json(result);
	});
});

app.delete('/api/recordatorios', (req, res) => {
	if (!req.body._id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteRecordatorio(req.body._id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

//Update a reminder
app.put('/api/recordatorios', (req, res) => {
	if (!req.body._id || !req.body.recordatorio) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.putRecordatorio(req.body._id, req.body.recordatorio, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

app.post('/api/recordatorios', (req, res) => {
	if (!req.body.recordatorio) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.postRecordatorio(req.body.recordatorio, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

/*--------------------------------------- PM2 PROCESSES ----------------------------------*/

app.get('/api/pm2_processes', (req, res) => {
	console.log('Peticion a procesos locales de pm2');
	pm2.list(function (error, processDescriptionList) {
		if (error) {
			console.error('pm2 no pudo ver procesos activos por: ', error);
			res.status(500).send('Something broke!');
			return;
		}
		res.json([]);
	});
});

app.get('/api/restart_process', (req, res) => {
	const process_name = req.query.process;
	console.log('Peticion a reiniciar proceso: ', process_name);
	pm2.restart(process_name, function (error) {
		if (error !== null) {
			console.error('pm2 no pudo reiniciar el chatbot por: ', error);
			res.status(500).send('Something broke!');
			return;
		}
		console.log('Reiniciando proceso');
		res.json('OK');
	});
});

app.get('/api/stop_process', (req, res) => {
	const process_name = req.query.process;
	console.log('Peticion a reiniciar proceso: ', process_name);
	pm2.stop(process_name, function (error) {
		if (error !== null) {
			console.error('pm2 no pudo reiniciar el chatbot por: ', error);
			res.status(500).send('Something broke!');
			return;
		}
		console.log('Deteniendo proceso');
		res.json('OK');
	});
});

app.get('/api/download_logs', (req, res) => {
	console.log('Peticion a descarga de logs');
	const logs_path = req.query.path;
	res.sendFile(logs_path);
});

/*--------------------------------------- PM2 PROCESSES ----------------------------------*/

//login
app.post('/api/login', async (req, res) => {
	if (!req.body.password || !req.body.username) {
		res.status(400).send('Bad Request!');
		return;
	}
	const { username, password } = req.body;
	console.log('Intento de inicio de sesión de: ' + username);
	db_functions.getUser(username, (err, user) => {
		if (err) {
			res.json(false);
			return;
		}
		const match = bcrypt.compareSync(password, user.password);
		if (match) {
			delete user.password;
			res.json(user);
			return;
		}
		res.json(false);
	});
});

// Get de todos los usuarios
app.get('/api/users', (req, res) => {
	db_functions.getUsers((err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		res.json(result);
	});
});

// Eliminar un usuario
app.delete('/api/users', (req, res) => {
	if (!req.body._id) {
		res.status(400).send('Bad Request!');
		return;
	}
	db_functions.deleteUser(req.body._id, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		res.json(result);
	});
});

// Modificar un usuario
app.put('/api/users', (req, res) => {
	if (!req.body.password || !req.body.rol || !req.body.username || !req.body._id) {
		res.status(400).send('Bad Request!');
		return;
	}
	const hashed_password = bcrypt.hashSync(req.body.password, 10);
	db_functions.modifyUser(req.body._id, { username: req.body.username, password: hashed_password, rol: req.body.rol }, (err, result) => {
		if (err) {
			console.log(err);
			return res.status(500).send('Something Broke!');
		}
		res.json(result);
	});
});

// POST crear nuevo usuario
app.post('/api/sign_up', (req, res) => {
	if (!req.body.password || !req.body.rol || !req.body.username) {
		res.status(400).send('Bad Request!');
		return;
	}
	const hashed_password = bcrypt.hashSync(req.body.password, 10);
	db_functions.saveUser({ username: req.body.username, password: hashed_password, rol: req.body.rol }, (err, result) => {
		if (err) return res.status(500).send('Something Broke!');

		res.json(result);
	});
});

// Get de todos los roles de usuario
app.get('/api/roles', (req, res) => {
	db_functions.getRoles((err, result) => {
		if (err) return res.status(500).send('Something Broke!');
		res.json(result);
	});
});

app.get('/api/all/conversaciones', async (req, res) => {
	console.log("Inicia /all/conversaciones");
	try {
		const from = req.query.from;
		const to = req.query.to;
		const result = await db_reporteria_functions.getConversationStats(from, to);
		console.log("termino /all/conversaciones");
		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Error');
	}
	
});

app.get('/api/all/noentendidos', async (req, res) => {
	console.log("Inicia /all/noentendidos");
	try {
		const from = req.query.from;
		const to = req.query.to;
		const result = await db_reporteria_functions.getNotUnderstandedStats(from, to);
		console.log("Inicia /all/conversaciones");
		res.json(result);
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Error');
	}
	
});

app.get('/api/all/temas', async (req, res) => {
	console.log("Inicia /all/temas");
	try {
		const result = await db_reporteria_functions.getSubjectsStats();
		console.log("termino /all/temas");
		res.json(result);
	} catch (error) {
		console.log("error /all/conversaciones");
		console.error(error);
		res.status(500).send('Internal Error');
	}
});

app.get('/api/all/temas/nombres', async (req, res) => {
	console.log("Inicia /all/nombres");
	try {
		const result = await db_reporteria_functions.getSubjects();
		console.log("termina /all/nombres");
		res.json(result);
	} catch (error) {
		console.log("error /all/nombres");
		console.error(error);
		res.status(500).send('Internal Error');
	}
});

app.get('/api/files', async (req, res) => {
	request(process.env.URL_CHATBOT + 'files', (error, response, body) => {
		if (error) {
			console.error(error);
			res.status(500).send('Internal Error');
		}
		res.send(body);
	});
});

app.get('/api/functions', async (req, res) => {
	try {
		request(process.env.URL_CHATBOT + 'functions', (error, response, body) => {
			res.send(body);
		});
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Error');
	}
});

app.post('/api/analyze', (req, res) => {
	const options = {
		uri: process.env.URL_CHATBOT + 'analyze',
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(req.body),
	};
	request(options, (error, response, body) => {
		if (error) {
			console.log(error);
			res.status(500).send('Internal Server Error');
		}
		res.send(body);
	});
});

//Redirect to react app
app.get('*', function (req, res) {
	res.redirect('/');
});
