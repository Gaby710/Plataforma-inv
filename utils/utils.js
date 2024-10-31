//  -   -   -   -   -   -   -   -   -   -   N O D E   M O D U L E S  -   -   -   -   -   -   -   -   -   -

const excel = require('exceljs');

//  -   -   -   -   -   -   -   -   -   -   -   -   F L U J O   -   -   -   -   -   -   -   -   -   -   -   -

exports.getUniqueConversations = function (arr) {
	const groupDatesAndIDs = arr.map((x) => x.fecha.toISOString().substring(0, 10) + '|' + x.senderId);
	// console.log(groupDatesAndIDs);
	const unique = [...new Set(groupDatesAndIDs)];
	return unique.map((x) => x.split('|')[0]);
};

exports.separateTemas = function (arr) {
	//["Facebook", "Whatsapp", "Telegram"]
	const temas = {};

	arr.forEach((element) => {
		if (!temas[element.tema]) temas[element.tema] = [0, 0, 0];
		temas[element.tema][element.canal - 1] += 1;
	});

	return Object.entries(temas).map((x) => [x[0], ...x[1]]);
};

// exports.createDownloadableTemas = function (arr) {
// 	const temas = {};
// 	arr.forEach((element) => {
// 		if (!temas[element.tema]) temas[element.tema] = `Tema: ${element.tema}\n`;
// 		temas[element.tema] += `Mensaje: ${element.mensaje}\n`;
// 	});
// 	return Object.entries(temas)
// 		.map((x) => x[1])
// 		.join('\n\n');
// };

// exports.createDownloadableConversations = function (arr)
// {
//     const conversaciones = {}

//     arr.forEach(element =>
//     {
//         if (!conversaciones[element.senderId])
//             conversaciones[element.senderId] = `Conversación del ID: ${ element.senderId }\n`;
//         conversaciones[element.senderId] += `Mensaje de ${ element.emisor }: ${ element.mensaje }${ element.noEntendido ? ' EL MENSAJE NO FUE ENTENDIDO POR EL ROBOT' : '' }${ element.interrupcionAsesor ? ' UN ASESOR TOMO LA CONVERSACION A PARTIR DE ESTE PUNTO' : '' }\n`
//     })

//     const zip = new AdmZip();

//     Object.entries(conversaciones).forEach(x =>
//     {
//         zip.addFile(`${ x[0] }.txt`, Buffer.alloc(x[1].length, x[1]), `Conversacion del sender: ${ x[0] }`);
//     })

//     return zip.toBuffer();
// }

exports.createDownloadableConversations = function (dates, conversations) {
	let workbook = new excel.Workbook();
	for (let i = 0; i < dates.length; i++) {
		const conversationsInDate = conversations[i];
		const date = dates[i];
		let worksheet = workbook.addWorksheet(date.toDateString());
		worksheet.views = [{ state: 'frozen', ySplit: 1 }];
		worksheet.columns = [
			{ header: 'Fecha', key: 'fecha', width: 20 },
			{ header: 'Id de conversacion', key: 'conversationId', width: 40 },
			{ header: 'Id de usuario', key: 'senderId', width: 20 },
			{ header: 'Emisor del mensaje', key: 'emisor', width: 20 },
			{ header: 'Pagina asociada', key: 'pagina', width: 20 },
			{ header: 'Mensaje', key: 'mensaje', width: 100 },
		];
		worksheet.addRows(conversationsInDate);
	}
	// workbook.xlsx.writeFile('prueba.xlsx').then(() => {});
	return workbook;
};

exports.createDownloadableNoEntendidos = function (dates, conversations) {
	let workbook = new excel.Workbook();
	for (let i = 0; i < dates.length; i++) {
		const conversationsInDate = conversations[i];
		const date = dates[i];
		let worksheet = workbook.addWorksheet(date.toDateString());
		worksheet.views = [{ state: 'frozen', ySplit: 1 }];
		worksheet.columns = [
			{ header: 'Fecha', key: 'fecha', width: 20 },
			{ header: 'Id de Usuario', key: 'senderId', width: 20 },
			{ header: 'Emisor del Mensaje', key: 'emisor', width: 20 },
			{ header: 'Pagina asociada', key: 'pagina', width: 20 },
			{ header: 'Mensaje', key: 'mensaje', width: 100 },
		];
		worksheet.addRows(conversationsInDate);
	}
	// workbook.xlsx.writeFile('prueba.xlsx').then(() => {});
	return workbook;
};

exports.createDownloadableTemas = function (Stats, Temas) {
	let workbook = new excel.Workbook();
	for (const canal in Stats) {
		const infoCanal = { ...Stats[canal] };
		let worksheet = workbook.addWorksheet(canal.toString());
		const Data = [];
		const cabecera = [{ header: 'Identificador', key: 'ID', width: 20 }];

		for (let i = 0; i < Temas.length; i++) {
			const Tema = Temas[i];
			cabecera.push({ header: Tema, key: Tema, width: 20 });
		}

		worksheet.columns = [...cabecera];

		for (const recipient in infoCanal) {
			const infoRecipient = { ...infoCanal[recipient] };
			infoRecipient.ID = recipient;
			Data.push(infoRecipient);
		}
		worksheet.addRows(Data);
	}
	// workbook.xlsx.writeFile('Temas.xlsx').then(() => {
	// 	return;
	// });
	return workbook;
};


exports.formatDate = function (date) {
	let month = '' + (date.getMonth() + 1),
		day = '' + date.getDate(),
		year = date.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
};
