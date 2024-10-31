const mysql = require('mysql');
const createDownloadableNoEntendidos = require('../utils/utils').createDownloadableNoEntendidos;
const createDownloadableTemas = require('../utils/utils').createDownloadableTemas;
const createDownloadableConversations = require('../utils/utils').createDownloadableConversations;
const separateTemas = require('../utils/utils').separateTemas;

//TODO: ADD NEW LOGIC
let connection;
exports.db_connection = function () {
	connection = mysql.createPool({
		connectionLimit: 100,
		host: process.env.MYSQL_HOST,
		user: process.env.MYSQL_USER,
		password: process.env.MYSQL_PASSWORD,
		database: process.env.MYSQL_DB,
		multipleStatements: true,
	});
	console.log('Conectado a la base de MySQL');
};

exports.getConversacionesInRange = async function (from, to, callback) {
	let query =
		from && to
			? 'SELECT DISTINCT CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) AS date FROM conversaciones WHERE CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) BETWEEN ? AND ?;'
			: 'SELECT DISTINCT CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) AS date FROM conversaciones;';

	try {
		let result = await MySQLQuery(query, [from, to]);
		const fechas = [];
		query = '';
		for (let i = 0; i < result.length; i++) {
			const fecha = result[i];
			query =
				query +
				`SELECT DATE_SUB(fecha, INTERVAL 6 HOUR) as fecha, 
					A.senderId, 
					A.emisor, 
					A.mensaje, 
					A.conversationId, 
					B.alias as pagina
				FROM conversaciones AS A
				LEFT JOIN recipients AS B 
				ON A.canal=B.canalAsociado AND A.recipientId=B.recipientId
				WHERE CONVERT(DATE_SUB(A.fecha, INTERVAL 6 HOUR),DATE) = DATE(?) 
				AND (A.senderId LIKE 'whatsapp:%' OR A.senderId NOT LIKE 'whatsapp:%')
				ORDER BY A.conversationId DESC, A.id, A.fecha;`;
			fechas.push(fecha.date);
		}
		query = query + 'SELECT NOW();';
		result = await MySQLQuery(query, fechas);

		callback(false, createDownloadableConversations(fechas, result));
	} catch (error) {
		console.error(error);
		callback(true, error);
	}
};

exports.getConversacionesInRangeByFbPage = function (from, to, fbPage, callback) {
	const query = 'SELECT * FROM conversaciones WHERE CONVERT(fecha , DATE) BETWEEN ? AND ?';
	const values = [from, to];

	connection.query(query, values, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else {
			const file = createDownloadableConversations(results);
			callback(false, file);
		}
	});
};

exports.getNoEntendidosInRange = async function (from, to, callback) {
	let query =
		from && to
			? 'SELECT DISTINCT CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) AS date FROM conversaciones WHERE CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) BETWEEN ? AND ?;'
			: 'SELECT DISTINCT CONVERT(DATE_SUB(fecha, INTERVAL 6 HOUR),DATE) AS date FROM conversaciones;';

	try {
		let result = await MySQLQuery(query, [from, to]);
		const fechas = [];
		query = '';
		for (let i = 0; i < result.length; i++) {
			const fecha = result[i];
			query =
				query +
				`SELECT DATE_SUB(fecha, INTERVAL 6 HOUR) as fecha, 
					A.senderId, 
					A.emisor, 
					A.mensaje, 
					B.alias as pagina
				FROM conversaciones AS A
				LEFT JOIN recipients AS B
				ON A.canal=B.canalAsociado AND A.recipientId=B.recipientId
				WHERE DATE_SUB(fecha, INTERVAL 6 HOUR) = DATE(?) 
					AND A.noEntendido = 1 
				ORDER BY A.conversationId DESC, A.id, A.fecha;`;
			fechas.push(fecha.date);
		}

		query = query + 'SELECT NOW();'; // Solo sirve para generar un arreglo de 2 dimensiones en el query, NO QUITAR!
		result = await MySQLQuery(query, fechas);

		callback(false, createDownloadableNoEntendidos(fechas, result));
	} catch (error) {
		console.error(error);
		callback(true, error);
	}
};

exports.getAllFbPages = function (callback) {
	const query = 'SELECT DISTINCT nombre FROM paginas_fb';

	connection.query(query, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else {
			var fbPagesNames = [];

			results.forEach((result) => {
				fbPagesNames.push(result.nombre);
			});

			callback(false, fbPagesNames);
		}
	});
};

exports.getAllChannels = function (callback) {
	const query = 'SELECT DISTINCT nombre FROM canales';

	connection.query(query, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else {
			var channelsNames = [];

			results.forEach((result) => {
				channelsNames.push(result.nombre);
			});

			callback(false, channelsNames);
		}
	});
};

exports.getHistoricoConversaciones = function (callback) {
	var queryHistoricoConv = `
				SELECT CONVERT(fecha , DATE) AS fecha,
					COUNT(DISTINCT senderId) AS conversaciones
				FROM conversaciones
				WHERE CONVERT(fecha , DATE) = CURDATE()
				GROUP BY CONVERT(fecha , DATE);`;

	var queryHistoricoNoEntendidos = `
				SELECT CONVERT(fecha , DATE) AS fecha,
					COUNT(1) AS noEntendidos
				FROM Invex_CallCenter_Dev.conversaciones
				WHERE CONVERT(fecha , DATE) = CURDATE()
					AND noEntendido = 1
				GROUP BY CONVERT(fecha , DATE);`;

	connection.query(queryHistoricoConv, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else {
			var countConversaciones = {};

			results.forEach((row) => {
				countConversaciones[row.fecha] = row.conversaciones;
			});

			connection.query(queryHistoricoNoEntendidos, function (error, results, fields) {
				if (error) {
					console.error(error);
					callback(true, error);
					return;
				} else {
					var countNoEntendidos = {};

					results.forEach((row) => {
						countNoEntendidos[row.fecha] = row.noEntendidos;
					});

					const groupedDatesConversaciones = Object.entries(countConversaciones);
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

					callback(false, { conversaciones: chartConversaciones, noEntendido: chartNoEntendidos });
				}
			});
		}
	});
};

exports.getHistoricoConversacionesByFbPage = function (fbPageName, callback) {
	var queryfbPageCode = `SELECT codigo_pagina FROM paginas_fb WHERE nombre = ?`;

	var queryHistoricoConv = `
                SELECT CONVERT(fecha , DATE) as fecha, 
                    COUNT(DISTINCT senderId) as conversaciones
                FROM conversaciones 
                WHERE fbPage = ?
                GROUP BY CONVERT(fecha , DATE);`;

	var queryHistoricoNoEntendidos = `
                SELECT CONVERT(fecha , DATE) as fecha,
                    COUNT(1) as noEntendidos
                FROM conversaciones 
                WHERE (noEntendido = 1 AND fbPage = ?)
                GROUP BY CONVERT(fecha , DATE);`;

	connection.query(queryfbPageCode, [fbPageName], function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else {
			var fbPageCode = results[0].codigo_pagina;

			connection.query(queryHistoricoConv, [fbPageCode], function (error, results, fields) {
				if (error) {
					console.error(error);
					callback(true, error);
					return;
				} else {
					var countConversaciones = {};

					results.forEach((row) => {
						countConversaciones[row.fecha] = row.conversaciones;
					});

					connection.query(queryHistoricoNoEntendidos, [fbPageCode], function (error, results, fields) {
						if (error) {
							console.error(error);
							callback(true, error);
							return;
						} else {
							var countNoEntendidos = {};

							results.forEach((row) => {
								countNoEntendidos[row.fecha] = row.noEntendidos;
							});

							const groupedDatesConversaciones = Object.entries(countConversaciones);
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

							callback(false, { conversaciones: chartConversaciones, noEntendido: chartNoEntendidos });
						}
					});
				}
			});
		}
	});
};

// exports.getTemas = function (from, to, fbPage, mode, callback) {
// 	var query = '';
// 	var values = [];

// 	getPageCode(fbPage, (err, fbPageCode) => {
// 		if (from && to) {
// 			if (fbPage != 'Todas') {
// 				query = "SELECT * FROM temas WHERE (fbPage = ? AND DATE_FORMAT(fecha, '%Y-%m-%d') BETWEEN ? AND ?)";
// 				values = [fbPageCode, from, to];
// 			} else {
// 				query = "SELECT * FROM temas WHERE DATE_FORMAT(fecha, '%Y-%m-%d') BETWEEN ? AND ?";
// 				values = [from, to];
// 			}
// 		} else {
// 			if (fbPage != 'Todas') {
// 				query = 'SELECT * FROM temas WHERE (fbPage = ?)';
// 				values = [fbPageCode];
// 			} else {
// 				query = 'SELECT * FROM temas';
// 				values = [];
// 			}
// 		}

// 		connection.query(query, values, function (error, results, fields) {
// 			if (error) {
// 				console.error(error);
// 				callback(true, error);
// 				return;
// 			} else {
// 				if (mode === 'download') {
// 					const text = createDownloadableTemas(results);
// 					callback(false, text);
// 					return;
// 				} else {
// 					const temas = separateTemas(results);
// 					const chart = {
// 						chart: 'ColumnChart',
// 						data: temas,
// 						options: { title: 'Temas hablados ' + (from ? `del dia ${from} al ${to} ` : 'en la historia') },
// 					};
// 					callback(false, chart);
// 				}
// 			}
// 		});
// 	});
// };

exports.getDayStats = function (date, callback) {
	let queryTotalMensajes = `SELECT COUNT(1) AS totalMensajes FROM conversaciones WHERE (emisor != 'CHATBOT_XIRA' AND CONVERT(fecha , DATE) = ?);`;

	let queryNoEntendidos = `SELECT COUNT(1) as noEntendidos FROM conversaciones WHERE noEntendido = 1 AND CONVERT(fecha , DATE) = ?;`;

	let queryConversaciones = ` SELECT CONVERT(fecha , DATE) as fecha, COUNT(DISTINCT senderId) as conversaciones_count FROM conversaciones WHERE (CONVERT(fecha , DATE) = ?) GROUP BY CONVERT(fecha , DATE);`;

	let queryDerivaciones = `SELECT CONVERT(fecha , DATE) as fecha, COUNT(senderId) as derivaciones FROM conversaciones WHERE CONVERT(fecha , DATE) = ? AND (interrupcionAsesor = 1 OR transferenciaAgente = 1) GROUP BY CONVERT(fecha , DATE);`;

	let values = [date];

	connection.query(queryConversaciones, values, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else var conversaciones_count = results.length > 0 ? results[0].conversaciones_count : 0;

		connection.query(queryDerivaciones, values, function (error, results, fields) {
			if (error) {
				console.error(error);
				callback(true, error);
				return;
			} else var transferencias_count = results.length > 0 ? results[0].derivaciones : 0;

			connection.query(queryNoEntendidos, values, function (error, results, fields) {
				if (error) {
					console.error(error);
					callback(true, error);
					return;
				} else var noEntendidos_count = results.length > 0 ? results[0].noEntendidos : 0;

				connection.query(queryTotalMensajes, values, function (error, results, fields) {
					if (error) {
						console.error(error);
						callback(true, error);
						return;
					} else var totalMensajes = results.length > 0 ? results[0].totalMensajes : 0;

					callback(false, {
						conversaciones: conversaciones_count,
						transferencias: transferencias_count,
						noEntendidos: noEntendidos_count,
						totalMensajes: totalMensajes,
					});
				});
			});
		});
	});
};

exports.getDayStatsByFbPage = function (date, fbPage, callback) {
	var queryfbPageCode = `SELECT codigo_pagina FROM paginas_fb WHERE nombre = ?`;

	let queryTotalMensajes = `SELECT 
	    COUNT(1) AS totalMensajes 
    FROM conversaciones 
    WHERE (emisor != 'CHATBOT_XIRA' AND DATE_FORMAT(fecha, "%Y-%m-%d") = ? AND fbPage = ?);`;

	let queryNoEntendidos = `
    SELECT 
        COUNT(1) as noEntendidos 
    FROM conversaciones 
    WHERE (noEntendido = 1 AND DATE_FORMAT(fecha, "%Y-%m-%d") = ? AND fbPage = ?)`;

	let queryConversaciones = `
    SELECT
        CONVERT(fecha , DATE) as fecha, 
        COUNT(DISTINCT senderId) as conversaciones_count
    FROM conversaciones 
    WHERE (CONVERT(fecha , DATE) = ? AND fbPage = ?) 
    GROUP BY CONVERT(fecha , DATE)
    `;
	let queryDerivaciones = `
    SELECT 
        CONVERT(fecha , DATE) as fecha, 
        COUNT(DISTINCT senderId) as derivaciones
    FROM conversaciones 
    WHERE (CONVERT(fecha , DATE) = ? AND (interrupcionAsesor = 1 OR transferenciaAgente = 1) AND fbPage = ?) 
    GROUP BY CONVERT(fecha , DATE);
    `;

	var values = [fbPage];

	connection.query(queryfbPageCode, values, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		} else var fbPageCode = results[0].codigo_pagina;
		values = [date, fbPageCode];

		connection.query(queryConversaciones, values, function (error, results, fields) {
			if (error) {
				console.error(error);
				callback(true, error);
				return;
			} else var conversaciones_count = results.length > 0 ? results[0].conversaciones_count : 0;

			connection.query(queryDerivaciones, values, function (error, results, fields) {
				if (error) {
					console.error(error);
					callback(true, error);
					return;
				} else var transferencias_count = results.length > 0 ? results[0].derivaciones : 0;

				connection.query(queryNoEntendidos, values, function (error, results, fields) {
					if (error) {
						console.error(error);
						callback(true, error);
						return;
					} else var noEntendidos_count = results.length > 0 ? results[0].noEntendidos : 0;

					connection.query(queryTotalMensajes, values, function (error, results, fields) {
						if (error) {
							console.error(error);
							callback(true, error);
							return;
						} else var totalMensajes = results.length > 0 ? results[0].totalMensajes : 0;

						callback(false, {
							conversaciones: conversaciones_count,
							transferencias: transferencias_count,
							noEntendidos: noEntendidos_count,
							totalMensajes: totalMensajes,
						});
					});
				});
			});
		});
	});
};

exports.getLegends = function (callback) {
	var queryConversaciones = `SELECT COUNT(DISTINCT senderId,  CONVERT(fecha , DATE)) as conversaciones FROM conversaciones WHERE CONVERT(fecha , DATE) = CURDATE();`;

	var queryDerivaciones = `SELECT COUNT(DISTINCT senderId,  CONVERT(fecha , DATE)) as derivaciones FROM conversaciones WHERE (transferenciaAgente = 1) AND CONVERT(fecha , DATE) = CURDATE();`;

	let queryTotalMensajes = `SELECT COUNT(1) AS totalMensajes FROM conversaciones WHERE (emisor != 'CHATBOT_XIRA') AND CONVERT(fecha , DATE) = CURDATE();`;

	var queryNoEntendidos = `SELECT COUNT(1) as noEntendidos FROM conversaciones WHERE (noEntendido = 1) AND CONVERT(fecha , DATE) = CURDATE();`;

	connection.query(queryConversaciones, function (error, results, fields) {
		if (error) {
			console.error(error);
			callback(true, error);
			return;
		}


		var conversaciones_count = results.length > 0 ? results[0].conversaciones : 0;
		connection.query(queryDerivaciones, function (error, results, fields) {
			if (error) {
				console.error(error);
				callback(true, error);
				return;
			}

			var transferencias_count = results.length > 0 ? results[0].derivaciones : 0;

			connection.query(queryNoEntendidos, function (error, results, fields) {
				if (error) {
					console.error(error);
					callback(true, error);
					return;
				}

				var noEntendidos_count = results.length > 0 ? results[0].noEntendidos : 0;

				connection.query(queryTotalMensajes, function (error, results, fields) {
					if (error) {
						console.error(error);
						callback(true, error);
						return;
					}

					var totalMensajes = results.length > 0 ? results[0].totalMensajes : 0;

					connection.query('SELECT * FROM temas', function (error, temas, fields) {
						if (error) {
							console.error(error);
							callback(true, error);
							return;
						}
						const facebook_count = temas.filter((x) => x.canal == 1).length;
						const whatsapp_count = temas.filter((x) => x.canal == 2).length;
						const telegram_count = temas.filter((x) => x.canal == 3).length;

						const response = {
							conversaciones: { total: conversaciones_count, transferencias: transferencias_count },
							noEntendidos: { total: totalMensajes, noEntendidos: noEntendidos_count },
							temas: { facebook: facebook_count, whatsapp: whatsapp_count, telegram: telegram_count },
						};
						callback(false, response);
					});
				});
			});
		});
	});
};

function getPageCode(nombre, callback) {
	var pageCode = 0;

	let query = `SELECT * FROM paginas_fb WHERE nombre = ?`;

	connection.query(query, [nombre], (err, result) => {
		if (err) {
			console.log(err);
			callback(null, pageCode);
			return;
		} else {
			pageCode = result.length > 0 ? result[0].codigo_pagina : 0;
			callback(null, pageCode);
			return;
		}
	});
}

exports.getConversationStats = async function (from, to) {
	// const query =
	// 	'SELECT COUNT(DISTINCT senderId, (DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)))) as conversacionesTotales FROM conversaciones;' +
	// 	'SELECT COUNT(*) as transferenciasTotales FROM conversaciones WHERE transferenciaAgente=1;' +
	// 	'SELECT COUNT(DISTINCT senderId, (DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)))) as conversacionesPeriodo FROM conversaciones WHERE DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)) BETWEEN ? AND ?;' +
	// 	'SELECT COUNT(*) as transferenciasPeriodo FROM conversaciones WHERE transferenciaAgente=1 AND DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)) BETWEEN ? AND ?;';

	const query =
		//'SELECT COUNT(DISTINCT conversationId) as conversacionesTotales FROM conversaciones WHERE CONVERT(fecha , DATE) = CURDATE();' +
		//'SELECT COUNT(conversationId) as transferenciasTotales FROM conversaciones WHERE CONVERT(fecha , DATE) = CURDATE() AND transferenciaAgente=1;' +
		'SELECT COUNT(DISTINCT conversationId) as conversacionesPeriodo FROM conversaciones WHERE CONVERT(fecha , DATE) = CURDATE();' +
		'SELECT COUNT(conversationId) as transferenciasPeriodo FROM conversaciones WHERE CONVERT(fecha , DATE) = CURDATE() AND transferenciaAgente=1 ;';


	try {


		console.log('Antes del query maratonico', query, '-');
		const resultado = await MySQLQuery(query, [from, to, from, to]);
		console.log('Despues del query mortal', resultado, '-');
		let pruebaNA= 'N/A';

		const respuesta = {
			conversacionesTotales: pruebaNA,//resultado[0][0].conversacionesTotales,
			transferenciasTotales: pruebaNA,//resultado[0][0].transferenciasTotales,
			conversacionesPeriodo: resultado[0][0].conversacionesPeriodo,
			transferenciasPeriodo: resultado[1][0].transferenciasPeriodo,
		};

		return respuesta;
	} catch (error) {
		console.log("Error en peticiones maratonica y mortal", error, "-")
	}

};

exports.getNotUnderstandedStats = async function (from, to) {
	const query =
		//"SELECT COUNT(conversationId) as mensajesTotales FROM conversaciones WHERE emisor != 'CHATBOT_XIRA';" +
		//'SELECT COUNT(conversationId) as mensajesNoEntendidos FROM conversaciones WHERE noEntendido=1;' +
		"SELECT COUNT(conversationId) as mensajesRango FROM conversaciones WHERE emisor != 'CHATBOT_XIRA' AND DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)) BETWEEN ? AND ?;" +
		'SELECT COUNT(conversationId) as mensajesNoEntendidosRango FROM conversaciones WHERE noEntendido=1 AND DATE(DATE_ADD(fecha, INTERVAL -6 HOUR)) BETWEEN ? AND ?;';

		let pruebaSN= "N/A";
	const resultado = await MySQLQuery(query, [from, to, from, to]);

	/* const respuesta = {
		mensajesTotales: resultado[0][0].mensajesTotales,
		mensajesNoEntendidos: resultado[1][0].mensajesNoEntendidos,
		mensajesRango: resultado[2][0].mensajesRango,
		mensajesNoEntendidosRango: resultado[3][0].mensajesNoEntendidosRango,
	}; */
	const respuesta = {
		mensajesTotales: pruebaSN,//resultado[0][0].mensajesTotales,
		mensajesNoEntendidos: pruebaSN,//resultado[1][0].mensajesNoEntendidos,
		mensajesRango: resultado[0][0].mensajesRango,
		mensajesNoEntendidosRango: resultado[1][0].mensajesNoEntendidosRango,
	};

	return respuesta;
};

exports.getSubjectsStats = async function () {
	const objRespuesta = {};

	let query = 'SELECT * FROM canales';
	let Canales = await MySQLQuery(query);

	query = 'SELECT DISTINCT tema as temas FROM temas';
	let Temas = await MySQLQuery(query);

	for (let i = 0; i < Canales.length; i++) {
		const Canal = Canales[i];
		objRespuesta[Canal.nombre] = {};
		objRespuesta[Canal.nombre].Total = {};

		// Se obtienen los totales de cada canal
		for (let j = 0; j < Temas.length; j++) {
			const Tema = Temas[j];

			query = 'SELECT COUNT(*) as mensajesTema FROM temas WHERE canal = ? AND tema = ?';
			let resp = await MySQLQuery(query, [Canal.idCanal, Tema.temas]);

			objRespuesta[Canal.nombre].Total[Tema.temas] = resp[0].mensajesTema;
		}

		// Se obtienen los totales de cada canal y cada recipiente
		query = 'SELECT alias, recipientId FROM recipients WHERE canalAsociado = ?';
		let resp = await MySQLQuery(query, [Canal.idCanal]);

		for (let j = 0; j < resp.length; j++) {
			const recipiente = resp[j];
			objRespuesta[Canal.nombre][recipiente.alias] = {};

			for (let j = 0; j < Temas.length; j++) {
				const Tema = Temas[j];

				query = 'SELECT COUNT(*) as mensajesTema FROM temas WHERE canal = ? AND tema = ? AND recipientId = ?';
				let resp = await MySQLQuery(query, [Canal.idCanal, Tema.temas, recipiente.recipientId]);

				objRespuesta[Canal.nombre][recipiente.alias][Tema.temas] = resp[0].mensajesTema;
			}
		}
	}

	return objRespuesta;
};

exports.getSubjects = async function () {
	query = 'SELECT DISTINCT tema as temas FROM temas';
	const Temas = await MySQLQuery(query);

	const subjectsArray = [];
	Temas.map((element) => subjectsArray.push(element.temas));

	return subjectsArray;
};

exports.getTemas = async function (callback) {
	try {
		const objRespuesta = {};

		let query = 'SELECT * FROM canales';
		let Canales = await MySQLQuery(query);

		query = 'SELECT DISTINCT tema as temas FROM temas';
		let Temas = await MySQLQuery(query);

		for (let i = 0; i < Canales.length; i++) {
			const Canal = Canales[i];
			objRespuesta[Canal.nombre] = {};
			objRespuesta[Canal.nombre].Total = {};

			// Se obtienen los totales de cada canal
			for (let j = 0; j < Temas.length; j++) {
				const Tema = Temas[j];

				query = 'SELECT COUNT(*) as mensajesTema FROM temas WHERE canal = ? AND tema = ?';
				let resp = await MySQLQuery(query, [Canal.idCanal, Tema.temas]);

				objRespuesta[Canal.nombre].Total[Tema.temas] = resp[0].mensajesTema;
			}

			// Se obtienen los totales de cada canal y cada recipiente
			query = 'SELECT alias, recipientId FROM recipients WHERE canalAsociado = ?';
			let resp = await MySQLQuery(query, [Canal.idCanal]);

			for (let j = 0; j < resp.length; j++) {
				const recipiente = resp[j];
				objRespuesta[Canal.nombre][recipiente.alias] = {};

				for (let j = 0; j < Temas.length; j++) {
					const Tema = Temas[j];

					query = 'SELECT COUNT(*) as mensajesTema FROM temas WHERE canal = ? AND tema = ? AND recipientId = ?';
					let resp = await MySQLQuery(query, [Canal.idCanal, Tema.temas, recipiente.recipientId]);

					objRespuesta[Canal.nombre][recipiente.alias][Tema.temas] = resp[0].mensajesTema;
				}
			}
		}

		let tmp = Temas.map(element => element.temas)

		callback(null, createDownloadableTemas(objRespuesta, tmp));
	} catch (error) {
		console.log(error);
		callback(true, error);
	}
};

async function MySQLQuery(queryString, arguments) {
	return new Promise((resolve, reject) => {
		connection.query(queryString, arguments, (err, data) => {
			if (err) reject(err);
			else resolve(data);
		});
	});
}